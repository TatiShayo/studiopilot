import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      let clientId = (session as any).metadata?.client_id;
      let planId = (session as any).metadata?.plan_id;

      if (!clientId && session.subscription) {
        const subData = await stripe.subscriptions.retrieve(
          session.subscription as string,
        ) as any;
        clientId = subData.metadata?.client_id;
        planId = subData.metadata?.plan_id;
      }

      if (clientId && planId) {
        await supabase.from("payments").insert({
          client_id: clientId,
          amount_cents: session.amount_total ?? 0,
          method: "stripe",
          description: `Stripe subscription: ${session.id}`,
        });

        await supabase
          .from("clients")
          .update({
            membership_plan_id: planId,
            membership_tier: "monthly",
            status: "active",
          })
          .eq("id", clientId);

        const { data: plan } = await supabase
          .from("membership_plans")
          .select("name, price_cents")
          .eq("id", planId)
          .single();

        const stripeSubData = session.subscription
          ? await stripe.subscriptions.retrieve(session.subscription as string)
          : null;
        const currentPeriodEnd = (stripeSubData as any)?.current_period_end
          ? new Date((stripeSubData as any).current_period_end * 1000).toISOString().split("T")[0]
          : null;

        await supabase.from("memberships").insert({
          client_id: clientId,
          plan_name: plan?.name ?? "Monthly Plan",
          price: plan?.price_cents ?? 0,
          billing_cycle: "monthly",
          start_date: new Date().toISOString().split("T")[0],
          end_date: currentPeriodEnd,
          stripe_subscription_id: session.subscription as string,
          status: "active",
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subData = subscription as any;
      const clientId = subData.metadata?.client_id;

      if (clientId) {
        const currentPeriodEnd = subData.current_period_end
          ? new Date(subData.current_period_end * 1000).toISOString().split("T")[0]
          : null;

        const status =
          subData.status === "active"
            ? "active"
            : subData.status === "past_due"
            ? "past_due"
            : "canceled";

        await supabase
          .from("memberships")
          .update({
            status,
            end_date: currentPeriodEnd,
          })
          .eq("stripe_subscription_id", subscription.id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string | undefined;

      if (subscriptionId) {
        const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const clientId = subscriptionData.metadata?.client_id;

        if (clientId) {
          await supabase
            .from("clients")
            .update({ status: "inactive" })
            .eq("id", clientId);

          await supabase
            .from("memberships")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subData = subscription as any;
      const client_id = subData.metadata?.client_id;

      if (client_id) {
        await supabase
          .from("clients")
          .update({
            membership_plan_id: null,
            membership_tier: "drop_in",
          })
          .eq("id", client_id);

        await supabase
          .from("memberships")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
