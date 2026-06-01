"use client";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, subMonths, startOfWeek, startOfDay, endOfDay, startOfYear } from "date-fns";
import { formatKes, kesFormatter } from "@/lib/format-currency";
import type { Payment } from "@/lib/types";

interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export default function RevenueDashboard() {
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [yearRevenue, setYearRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  useEffect(() => {
    const fetchRevenue = async () => {
      const supabase = getSupabase();

      const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5).toISOString();
      const { data } = await supabase
        .from("payments")
        .select("amount_cents, created_at, paid_at")
        .gte("created_at", sixMonthsAgo)
        .order("created_at");

      const payments = (data as Pick<Payment, "amount_cents" | "created_at" | "paid_at">[]) ?? [];

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const yearStart = startOfYear(now).toISOString();

      const getTime = (p: typeof payments[number]) => p.paid_at ?? p.created_at;

      const today = payments
        .filter((p) => getTime(p) >= todayStart && getTime(p) <= todayEnd)
        .reduce((s, p) => s + p.amount_cents, 0);
      const week = payments
        .filter((p) => getTime(p) >= weekStart)
        .reduce((s, p) => s + p.amount_cents, 0);
      const month = payments
        .filter((p) => getTime(p) >= monthStart)
        .reduce((s, p) => s + p.amount_cents, 0);
      const year = payments
        .filter((p) => getTime(p) >= yearStart)
        .reduce((s, p) => s + p.amount_cents, 0);

      setTodayRevenue(today);
      setWeekRevenue(week);
      setMonthRevenue(month);
      setYearRevenue(year);

      const months: MonthlyRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "yyyy-MM");
        const monthLabel = format(monthDate, "MMM yy");
        const monthStartStr = startOfMonth(monthDate).toISOString();
        const nextMonth = subMonths(monthDate, -1);
        const nextMonthStart = startOfMonth(nextMonth).toISOString();

        const monthPayments = payments.filter(
          (p) => getTime(p) >= monthStartStr && getTime(p) < nextMonthStart
        );
        months.push({
          month: monthLabel,
          revenue: Math.round(monthPayments.reduce((s, p) => s + p.amount_cents, 0) / 100),
          count: monthPayments.length,
        });
      }
      setMonthly(months);
      setLoading(false);
    };

    fetchRevenue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today&apos;s Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-teal-500">
              {formatKes(todayRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatKes(weekRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatKes(monthRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatKes(yearRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Month</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : monthly.every((m) => m.revenue === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No payment data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
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
