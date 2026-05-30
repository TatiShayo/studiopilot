import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Clock, Users, User } from "lucide-react";
import { addDays, startOfDay, format } from "date-fns";
import { GenerateButton } from "./generate-button";
import { InstructorFilter } from "./instructor-filter";

export default async function UpcomingClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ instructor?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { instructor } = await searchParams;

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .eq("active", true)
    .order("name");

  let query = supabase
    .from("scheduled_classes")
    .select("*, class_types(*), staff(*), bookings(count)")
    .gte("start_time", today.toISOString())
    .lt("start_time", weekEnd.toISOString());

  if (instructor && instructor !== "all") {
    query = query.eq("staff_id", instructor);
  }

  const { data: scheduledClasses } = await query.order("start_time");

  const statusVariant = (s: string) =>
    s === "scheduled" ? "default" : s === "completed" ? "secondary" : "destructive";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/classes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Upcoming Classes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Next 7 days · {format(today, "MMM d")} – {format(addDays(today, 6), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <InstructorFilter staffList={staffList ?? []} selected={instructor ?? "all"} />
          <GenerateButton />
        </div>
      </div>

      {(!scheduledClasses || scheduledClasses.length === 0) ? (
        <div className="rounded-xl border bg-white dark:bg-zinc-950 p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No classes scheduled for this week. Set up your weekly schedule first, then generate classes.
          </p>
          <Link href="/dashboard/classes/schedule">
            <Button variant="outline" size="sm">
              Set Weekly Schedule
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* group by day */}
          {(() => {
            const grouped: Record<string, typeof scheduledClasses> = {};
            for (const sc of scheduledClasses) {
              const dayKey = format(new Date(sc.start_time), "yyyy-MM-dd");
              if (!grouped[dayKey]) grouped[dayKey] = [];
              grouped[dayKey].push(sc);
            }
            return Object.entries(grouped).map(([dateStr, classes]) => (
              <Card key={dateStr}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(new Date(dateStr), "EEEE, MMMM d")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {classes.map((sc: any) => (
                    <Link
                      key={sc.id}
                      href={`/dashboard/classes/${sc.id}`}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold">
                            {format(new Date(sc.start_time), "h:mm")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sc.start_time), "a")}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                          <p className="font-medium">{sc.class_types?.name ?? "Class"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {sc.class_types?.duration_minutes ?? "-"}min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              {sc.bookings?.[0]?.count ?? 0} / {sc.class_types?.capacity ?? "-"}
                            </span>
                            {sc.staff && (
                              <span className="flex items-center gap-1">
                                {sc.staff.photo_url ? (
                                  <img src={sc.staff.photo_url} alt={sc.staff.name} className="size-3 rounded-full object-cover" />
                                ) : (
                                  <User className="size-3" />
                                )}
                                {sc.staff.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={statusVariant(sc.status)}>
                        {sc.status}
                      </Badge>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
