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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Cake } from "lucide-react";
import type { Client, Payment, Booking, ClientNote, ScheduledClass, ClassType, Membership } from "@/lib/types";
import ClientBillingSection from "@/components/client-billing-section";
import { AlertTriangle } from "lucide-react";

const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { id } = await params;

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) {
    return (
      <div>
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  const c = client as Client;

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, scheduled_classes(*, class_types(*))")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: notes } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const membershipList = (memberships as Membership[] | null) ?? [];
  const activeMembership = membershipList.find((m) => m.status === "active");
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = activeMembership && activeMembership.end_date && activeMembership.end_date < today;

  const statusVariant = (s: string) =>
    s === "active" ? "default" : s === "vip" ? "secondary" : "outline";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {c.membership_tier.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Visit History</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              {bookings && bookings.length > 0 ? (
                <div className="space-y-3">
                  {(bookings as any[]).map((b: any) => (
                    <div
                      key={b.id}
                      className="rounded-lg border bg-white dark:bg-zinc-950 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {b.scheduled_classes?.class_types?.name ?? "Class"}
                        </span>
                        <Badge variant="outline">{b.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No class history yet.</p>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              {payments && (payments as Payment[]).length > 0 ? (
                <div className="space-y-3">
                  {(payments as Payment[]).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border bg-white dark:bg-zinc-950 p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{p.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()} ·{" "}
                          {p.method}
                        </p>
                      </div>
                      <span className="font-bold">
                        {kesFormatter.format(p.amount_cents / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No payment history yet.</p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              {notes && (notes as ClientNote[]).length > 0 ? (
                <div className="space-y-3">
                  {(notes as ClientNote[]).map((n) => (
                    <div
                      key={n.id}
                      className="rounded-lg border bg-white dark:bg-zinc-950 p-4"
                    >
                      <p className="text-sm">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No notes yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${c.email}`} className="hover:underline">
                  {c.email}
                </a>
              </div>
              {c.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${c.phone}`} className="hover:underline">
                    {c.phone}
                  </a>
                </div>
              )}
              {c.birth_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Cake className="size-4 text-muted-foreground" />
                  <span>
                    {new Date(c.birth_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {c.emergency_contact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{c.emergency_contact}</p>
              </CardContent>
            </Card>
          )}

          {c.medical_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Medical Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{c.medical_notes}</p>
              </CardContent>
            </Card>
          )}

          {activeMembership && (
            <Card className={isOverdue ? "border-red-500/30 bg-red-500/5" : "border-teal-500/20 bg-teal-500/5"}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Membership
                  {isOverdue && <AlertTriangle className="size-4 text-red-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{activeMembership.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>{kesFormatter.format(activeMembership.price / 100)}/{activeMembership.billing_cycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start</span>
                  <span>{new Date(activeMembership.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End</span>
                  <span>{activeMembership.end_date ? new Date(activeMembership.end_date).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={activeMembership.status === "active" ? "default" : "destructive"}>
                    {isOverdue ? "Overdue" : activeMembership.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <ClientBillingSection clientId={c.id} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Visit</span>
                <span>
                  {c.last_visit
                    ? new Date(c.last_visit).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Classes</span>
                <span>{bookings?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid</span>
                <span>
                  {kesFormatter.format(
                    ((payments as Payment[] | null)?.reduce(
                      (sum, p) => sum + p.amount_cents,
                      0
                    ) ?? 0) / 100
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
