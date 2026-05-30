"use client";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import type { Payment } from "@/lib/types";

const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

export default function RevenueDashboard() {
  const [daily, setDaily] = useState<DailyRevenue[]>([]);
  const [period, setPeriod] = useState<"7" | "30">("7");

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  useEffect(() => {
    const fetchRevenue = async () => {
      const supabase = getSupabase();
      const days = parseInt(period);
      const since = subDays(startOfDay(new Date()), days).toISOString();

      const { data } = await supabase
        .from("payments")
        .select("amount_cents, created_at")
        .gte("created_at", since)
        .order("created_at");

      const payments = (data as Pick<Payment, "amount_cents" | "created_at">[]) ?? [];

      const dates = eachDayOfInterval({
        start: subDays(new Date(), days),
        end: new Date(),
      });

      const dailyData: DailyRevenue[] = dates.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const dayPayments = payments.filter(
          (p) => format(new Date(p.created_at), "yyyy-MM-dd") === key
        );
        return {
          date: format(d, "MMM d"),
          revenue: Math.round(dayPayments.reduce((s, p) => s + p.amount_cents, 0) / 100),
          count: dayPayments.length,
        };
      });

      setDaily(dailyData);
    };

    fetchRevenue();
  }, [period]);

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalTransactions = daily.reduce((s, d) => s + d.count, 0);
  const avgPerDay = totalTransactions > 0 ? (totalRevenue / (period === "7" ? 7 : 30)).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {period === "7" ? "Week" : "Month"} Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kesFormatter.format(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg / Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kesFormatter.format(Number(avgPerDay))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "7" | "30")}>
          <TabsList>
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Revenue</CardTitle>
          <CardDescription>
            {period === "7" ? "Last 7 days" : "Last 30 days"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No payment data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value) => [kesFormatter.format(Number(value ?? 0)), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
