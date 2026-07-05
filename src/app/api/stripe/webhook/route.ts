import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Strict signature enforcement in production
    const isProduction = process.env.NODE_ENV === "production";

    if (webhookSecret && signature && stripeKey) {
      const stripe = new Stripe(stripeKey, {
        apiVersion: "2025-01-27.acacia" as any
      });

      try {
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log(`Stripe Webhook Verified: ${event.type}`);

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as any;
          console.log("Subscription Checkout completed for Customer: ", session.customer);
        }
      } catch (err: any) {
        console.error("Stripe Webhook Verification Failed:", err.message);
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
      }
    } else {
      if (isProduction) {
        console.error("Stripe Webhook Config Error: Webhook secret or signature is missing in production.");
        return NextResponse.json({ error: "Forbidden in production without valid signature" }, { status: 403 });
      }
      
      // Fallback/Mock processing for development only
      console.warn("Stripe webhook received (Verification skipped, secrets not set in DEV):", body.substring(0, 200));
      try {
        const event = JSON.parse(body);
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          console.log("Mock Subscription Checkout completed for Customer: ", session?.customer);
        }
      } catch (err) {
        console.error("Failed to parse mock event body:", err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
