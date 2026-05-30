import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail } from "lucide-react";
import Link from "next/link";
import { subDays } from "date-fns";

export async function RetentionAlerts() {
  const supabase = await createClient();

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: activeClients } = await supabase
    .from("clients")
    .select("id, name, email, last_visit")
    .eq("status", "active");

  if (!activeClients) return null;

  const atRisk = activeClients.filter((c) => {
    if (!c.last_visit) return true;
    return new Date(c.last_visit) < new Date(thirtyDaysAgo);
  });

  if (atRisk.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          Retention Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {atRisk.length} client{atRisk.length > 1 ? "s" : ""} haven&apos;t visited in
          30+ days:
        </p>
        <div className="space-y-2">
          {atRisk.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border bg-background p-2"
            >
              <div>
                <Link
                  href={`/dashboard/clients/${c.id}`}
                  className="font-medium text-sm hover:underline"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {c.last_visit
                    ? `Last visit: ${new Date(c.last_visit).toLocaleDateString()}`
                    : "Never visited"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  {c.last_visit
                    ? `${Math.floor(
                        (Date.now() - new Date(c.last_visit).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}d`
                    : "No visits"}
                </Badge>
              </div>
            </div>
          ))}
          {atRisk.length > 5 && (
            <p className="text-xs text-muted-foreground">
              +{atRisk.length - 5} more clients
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
