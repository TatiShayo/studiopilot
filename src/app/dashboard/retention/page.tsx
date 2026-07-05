import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { calculateRetentionScore } from "@/lib/retention";
import type { Client, Booking } from "@/lib/types";
import BirthdayTracker from "./_components/birthday-tracker";
import { WinBackAction } from "./_components/win-back-action";

export default async function RetentionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: clientsData } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("client_id, created_at, status")
    .eq("status", "checked_in");

  const clients = (clientsData as Client[]) || [];
  const bookings = (bookingsData as Booking[]) || [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const clientStats = clients.map((client) => {
    const clientBookings = bookings.filter((b) => b.client_id === client.id);
    const visitsLast30d = clientBookings.filter(
      (b) => new Date(b.created_at) >= thirtyDaysAgo
    ).length;

    const daysActive = Math.max(
      1,
      Math.floor(
        (now.getTime() - new Date(client.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const totalVisits = clientBookings.length;
    const avgVisitsPer30d = (totalVisits / daysActive) * 30;

    const score = calculateRetentionScore(client.id, visitsLast30d, avgVisitsPer30d);

    return {
      ...client,
      retentionScore: score,
      visitsLast30d,
    };
  });

  // Sort by retention score ascending (worst first)
  const sortedClients = [...clientStats].sort((a, b) => a.retentionScore - b.retentionScore);
  const atRiskCount = sortedClients.filter((c) => c.retentionScore < 40).length;

  const getScoreColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Client Retention
              {atRiskCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {atRiskCount} At Risk
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Monitor client engagement and identify members who might need a check-in.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="size-5 text-blue-500" />
                Retention Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedClients.map((client) => (
                  <Card key={client.id} className="relative overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold truncate pr-2">{client.name}</h3>
                        {client.retentionScore < 40 && (
                          <Badge variant="destructive" className="text-[10px] h-4">
                            At Risk
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Retention Score</span>
                            <span className="font-medium">{client.retentionScore}%</span>
                          </div>
                          <Progress value={client.retentionScore} className="h-auto">
                            <ProgressTrack>
                              <ProgressIndicator 
                                className={getScoreColor(client.retentionScore)}
                              />
                            </ProgressTrack>
                          </Progress>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          Last visit: {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                          <Link href={`/dashboard/clients/${client.id}`} className="w-full">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              View Profile
                            </Button>
                          </Link>
                          {client.retentionScore < 40 && (
                            <WinBackAction contactId={client.id} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <BirthdayTracker />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Retention Legend</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500" />
                <span>Healthy (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-amber-500" />
                <span>Warning (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500" />
                <span>At Risk (&lt;40%)</span>
              </div>
              <p className="text-muted-foreground mt-4 italic">
                Score = (Visits last 30d / Avg visits per 30d) × 100
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
