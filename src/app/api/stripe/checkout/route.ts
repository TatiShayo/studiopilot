import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkoutSchema = z.object({
  client_id: z.string().uuid(),
  plan_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid client_id or plan_id" }, { status: 400 });
    }

    const { client_id, plan_id } = parsed.data;

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data: plan } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (!plan || plan.tier !== "monthly") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: client.email,
      subscription_data: {
        metadata: {
          client_id: client.id,
          plan_id: plan.id,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description ?? undefined,
            },
            recurring: {
              interval: "month" as const,
            },
            unit_amount: plan.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        client_id: client.id,
        plan_id: plan.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
