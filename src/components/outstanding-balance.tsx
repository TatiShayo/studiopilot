"use client";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Client, Payment } from "@/lib/types";

const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

interface OutstandingClient extends Client {
  lastPayment: Payment | null;
  totalPaidCents: number;
}

export default function OutstandingBalance() {
  const [clients, setClients] = useState<OutstandingClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutstanding = async () => {
      const supabase = createClient();

      const { data: monthlyClients } = await supabase
        .from("clients")
        .select("*")
        .eq("membership_tier", "monthly")
        .eq("status", "active");

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();

      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .gte("created_at", monthStart)
        .lte("created_at", endOfMonth(now).toISOString());

      const allPayments = (payments as Payment[]) ?? [];
      const paidClientIds = new Set(allPayments.map((p) => p.client_id));

      const monthlyList = (monthlyClients as Client[]) ?? [];
      const outstanding = monthlyList
        .filter((c) => !paidClientIds.has(c.id))
        .map((c) => {
          const clientPayments = allPayments.filter(
            (p) => p.client_id === c.id,
          );
          const last = clientPayments.length > 0
            ? clientPayments.reduce((a, b) =>
                new Date(a.created_at) > new Date(b.created_at) ? a : b
              )
            : null;

          const totalPaidCents = allPayments
            .filter((p) => p.client_id === c.id)
            .reduce((sum, p) => sum + p.amount_cents, 0);

          return { ...c, lastPayment: last, totalPaidCents };
        });

      setClients(outstanding);
      setLoading(false);
    };

    fetchOutstanding();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 text-amber-500" />
        <div>
          <h2 className="text-lg font-semibold">Outstanding Balances</h2>
          <p className="text-sm text-muted-foreground">
            Monthly members without a payment recorded for {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              All monthly members have paid for this month. Great job!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <Card key={c.id} className="border-amber-200 dark:border-amber-900">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <Badge variant="outline">
                      {c.membership_tier.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  {c.lastPayment && (
                    <p className="text-xs text-muted-foreground">
                      Last payment: {format(new Date(c.lastPayment.created_at), "MMM d, yyyy")}{" "}
                      · {kesFormatter.format(c.lastPayment.amount_cents / 100)}
                    </p>
                  )}
                  {!c.lastPayment && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      No payments recorded
                    </p>
                  )}
                </div>
                <Link href={`/dashboard/clients/${c.id}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="size-3" /> View
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Outstanding Balance</CardTitle>
          <CardDescription>
            This shows monthly subscription members who haven&apos;t had a payment
            recorded this month. Record their payment on the Transactions tab,
            or set up{" "}
            <Link href="/dashboard/clients/plans" className="underline">
              Stripe subscriptions
            </Link>{" "}
            for automatic billing.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
