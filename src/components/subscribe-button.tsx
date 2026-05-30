"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";

interface SubscribeButtonProps {
  clientId: string;
  planId: string;
  planName: string;
}

export default function SubscribeButton({ clientId, planId, planName }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSubscribe} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CreditCard className="size-4" />
      )}
      Subscribe to {planName}
    </Button>
  );
}
