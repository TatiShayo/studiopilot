"use client";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Bell, FileDown } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatKes } from "@/lib/format-currency";
import type { Client, Payment, Membership } from "@/lib/types";

interface OverdueClient {
  client: Client;
  membership: Membership;
  lastPayment: Payment | null;
  paidThisMonth: number;
}

export default function OutstandingBalance() {
  const [overdue, setOverdue] = useState<OverdueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchOutstanding = async () => {
      const supabase = createClient();

      const today = new Date().toISOString().split("T")[0];

      const { data: expiredMemberships } = await supabase
        .from("memberships")
        .select("*")
        .eq("status", "active")
        .lt("end_date", today);

      const memberships = (expiredMemberships as Membership[]) ?? [];

      if (memberships.length === 0) {
        setOverdue([]);
        setLoading(false);
        return;
      }

      const clientIds = [...new Set(memberships.map((m) => m.client_id))];

      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .in("id", clientIds);

      const clientsMap = new Map<string, Client>();
      (clientsData as Client[] | null)?.forEach((c) => clientsMap.set(c.id, c));

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false });

      const payments = (paymentsData as Payment[]) ?? [];

      const result: OverdueClient[] = memberships.map((m) => {
        const client = clientsMap.get(m.client_id);
        const clientPayments = payments.filter((p) => p.client_id === m.client_id);
        const lastPayment = clientPayments.length > 0 ? clientPayments[0] : null;

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const paidThisMonth = clientPayments
          .filter((p) => (p.paid_at ?? p.created_at) >= thisMonthStart)
          .reduce((sum, p) => sum + p.amount_cents, 0);

        return {
          client: client!,
          membership: m,
          lastPayment,
          paidThisMonth,
        };
      }).filter((r) => r.client);

      setOverdue(result);
      setLoading(false);
    };

    fetchOutstanding();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/payments/outstanding-report", { method: "POST" });
      const json = await res.json();
      if (json.pdf) {
        const byteChars = atob(json.pdf);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNums[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNums)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = json.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report downloaded");
      } else {
        toast.error(json.error || "Failed to generate report");
      }
    } catch {
      toast.error("Network error downloading report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-semibold">Outstanding Balances</h2>
            <p className="text-sm text-muted-foreground">
              Memberships past their end date that are still marked active
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          <FileDown className="size-4" />
          {downloading ? "Generating..." : "Download Report"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : overdue.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              All memberships are up to date. No overdue balances.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Bell className="size-5 text-amber-500" />
                <p className="text-sm font-medium">
                  {overdue.length} client{overdue.length > 1 ? "s" : ""} with overdue
                  membership{overdue.length > 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {overdue.map((item) => (
              <Card
                key={item.membership.id}
                className="border-amber-200 dark:border-amber-900"
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.client?.name}</span>
                      <Badge variant="outline">{item.membership.plan_name}</Badge>
                      <Badge variant="destructive">Overdue</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.client?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      End date: {format(new Date(item.membership.end_date!), "MMM d, yyyy")}
                      {" · "}
                      {formatKes(item.membership.price)}/
                      {item.membership.billing_cycle}
                    </p>
                    {item.lastPayment && (
                      <p className="text-xs text-muted-foreground">
                        Last payment:{" "}
                        {format(new Date(item.lastPayment.paid_at ?? item.lastPayment.created_at), "MMM d, yyyy")}{" "}
                        · {formatKes(item.lastPayment.amount_cents)}
                      </p>
                    )}
                    {item.paidThisMonth > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Paid this month: {formatKes(item.paidThisMonth)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/clients/${item.client?.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="size-3" /> View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/payments?remind=${item.client?.id}`}>
                      <Button size="sm" variant="secondary">
                        <Bell className="size-3" /> Send Reminder
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Outstanding Balance</CardTitle>
          <CardDescription>
            Memberships with a past end date but still marked as active indicate the
            client may need to renew. Record their payment on the Transactions tab
            to extend their membership.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
