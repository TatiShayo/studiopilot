import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lookupKey = searchParams.get("lookup_key") || "price_pro";

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isProduction = process.env.NODE_ENV === "production";

    if (stripeKey) {
      // Real Stripe Checkout Session Integration
      const priceIdMap: Record<string, string> = {
        price_starter: process.env.STRIPE_PRICE_STARTER || "",
        price_pro: process.env.STRIPE_PRICE_PRO || "",
        price_studio: process.env.STRIPE_PRICE_STUDIO || ""
      };

      const priceId = priceIdMap[lookupKey] || lookupKey;

      const params = new URLSearchParams({
        success_url: `${request.nextUrl.origin}/dashboard/billing?checkout=success`,
        cancel_url: `${request.nextUrl.origin}/dashboard/billing?checkout=cancelled`,
        mode: "subscription",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
      });

      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString()
      });

      const session = await response.json();
      if (session.url) {
        return NextResponse.redirect(session.url);
      } else {
        console.error("Stripe error response:", session);
        throw new Error("Failed to create Stripe checkout session");
      }
    }

    // In production, block missing configuration bypass!
    if (isProduction) {
      console.error("Stripe Integration Error: Missing STRIPE_SECRET_KEY in production.");
      const errRedirect = new URL(`/dashboard/billing?checkout=error&msg=BillingServiceUnavailable`, request.url);
      return NextResponse.redirect(errRedirect);
    }

    // Fallback checkout (Stripe is not configured in env variables)
    // Simulates a Stripe checkout completion
    const redirectUrl = new URL("/dashboard/billing?checkout=success", request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    // Return to billing page with sanitized error message
    const errRedirect = new URL(`/dashboard/billing?checkout=error&msg=CheckoutSessionFailed`, request.url);
    return NextResponse.redirect(errRedirect);
  }
}
