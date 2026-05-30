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

      let clientId = session.metadata?.client_id;
      let planId = session.metadata?.plan_id;

      if (!clientId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        clientId = sub.metadata.client_id;
        planId = sub.metadata.plan_id;
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
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string | undefined;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const clientId = subscription.metadata.client_id;

        if (clientId) {
          await supabase
            .from("clients")
            .update({ status: "inactive" })
            .eq("id", clientId);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { client_id } = subscription.metadata ?? {};

      if (client_id) {
        await supabase
          .from("clients")
          .update({
            membership_plan_id: null,
            membership_tier: "drop_in",
          })
          .eq("id", client_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
