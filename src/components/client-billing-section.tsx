"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import type { MembershipPlan } from "@/lib/types";
import { formatKes } from "@/lib/format-currency";

interface ClientBillingSectionProps {
  clientId: string;
}

export default function ClientBillingSection({ clientId }: ClientBillingSectionProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("tier", "monthly")
        .eq("active", true)
        .order("price_cents");
      setPlans(data ?? []);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, plan_id: planId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe checkout failed:", data.error);
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Billing</CardTitle>
        <CardDescription>
          Subscribe this client to a monthly membership plan via Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No monthly plans available.{" "}
            <a href="/dashboard/clients/plans" className="underline">
              Create one
            </a>
            .
          </p>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="text-sm font-bold">
                  {formatKes(plan.price_cents)}{" "}
                  <span className="text-muted-foreground font-normal">/month</span>
                </p>
                {plan.description && (
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing !== null}
              >
                {subscribing === plan.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CreditCard className="size-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
