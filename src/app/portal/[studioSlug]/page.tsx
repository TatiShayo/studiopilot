"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  Users,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { addDays, startOfDay, format } from "date-fns";
import Link from "next/link";
import { formatKes } from "@/lib/format-currency";
import { sendBookingEmail } from "@/lib/booking-email-action";

interface ClientMatch {
  id: string;
  name: string;
  email: string;
  class_credits: number;
}

interface UpcomingClass {
  id: string;
  class_type_id: string;
  start_time: string;
  end_time: string;
  status: string;
  class_types: { name: string; duration_minutes: number; capacity: number; price_cents: number } | null;
  bookings: { client_id: string; status: string }[];
}

export default function PortalPage() {
  const [email, setEmail] = useState("");
  const [client, setClient] = useState<ClientMatch | null>(null);
  const [hasWaiver, setHasWaiver] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [bookingStates, setBookingStates] = useState<Record<string, "idle" | "loading" | "success" | "waitlisted" | "error">>({});
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const lookupClient = useCallback(async (searchEmail: string) => {
    const s = getSupabase();
    setSearching(true);
    setNotFound(false);
    const { data } = await s
      .from("clients")
      .select("id, name, email, class_credits")
      .eq("email", searchEmail)
      .maybeSingle();
    if (data) {
      setClient(data as ClientMatch);
      const { data: waiver } = await s
        .from("waivers")
        .select("id")
        .eq("client_id", data.id)
        .maybeSingle();
      setHasWaiver(!!waiver);
    } else {
      setClient(null);
      setNotFound(true);
    }
    setSearching(false);
  }, []);

  const fetchClasses = useCallback(async (clientId: string) => {
    const s = getSupabase();
    setLoadingClasses(true);
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 7);
    const { data } = await s
      .from("scheduled_classes")
      .select("*, class_types(name, duration_minutes, capacity, price_cents), bookings(client_id, status)")
      .eq("status", "scheduled")
      .gte("start_time", today.toISOString())
      .lt("start_time", weekEnd.toISOString())
      .order("start_time");
    setClasses((data as UpcomingClass[]) ?? []);
    setLoadingClasses(false);
  }, []);

  useEffect(() => {
    if (client) fetchClasses(client.id);
  }, [client, fetchClasses]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    lookupClient(email.trim().toLowerCase());
  };

  const handleBook = async (classId: string) => {
    const s = getSupabase();
    if (!client) return;
    setBookingStates((prev) => ({ ...prev, [classId]: "loading" }));
    setBookingErrors((prev) => {
      const next = { ...prev };
      delete next[classId];
      return next;
    });

    const { data: sc } = await s
      .from("scheduled_classes")
      .select("start_time, end_time, class_types(capacity, name), staff(name)")
      .eq("id", classId)
      .single();

    const capacity = (sc?.class_types as any)?.capacity ?? 20;

    const { count: bookedCount } = await s
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("scheduled_class_id", classId)
      .in("status", ["booked", "checked_in"]);

    const status = (bookedCount ?? 0) >= capacity ? "waitlisted" : "booked";

    const { error } = await s.from("bookings").upsert(
      {
        client_id: client.id,
        scheduled_class_id: classId,
        status,
      },
      { onConflict: "client_id,scheduled_class_id" }
    );

    if (status === "booked" && client.class_credits > 0) {
      await s
        .from("clients")
        .update({ class_credits: client.class_credits - 1 })
        .eq("id", client.id);
      setClient((prev) =>
        prev ? { ...prev, class_credits: prev.class_credits - 1 } : prev
      );
    }

    if (error) {
      setBookingStates((prev) => ({ ...prev, [classId]: "error" }));
      setBookingErrors((prev) => ({ ...prev, [classId]: error.message }));
    } else {
      setBookingStates((prev) => ({
        ...prev,
        [classId]: status === "waitlisted" ? "waitlisted" : "success",
      }));
      if (status === "booked" && client.email && sc) {
        sendBookingEmail({
          to: client.email,
          clientName: client.name,
          className: (sc.class_types as any)?.name ?? "Class",
          date: format(new Date(sc.start_time), "EEEE, MMMM d"),
          time: format(new Date(sc.start_time), "h:mm a"),
          instructor: (sc as any).staff?.name,
          cancelUrl: `${window.location.origin}/portal`,
          calendarStartISO: sc.start_time,
          calendarEndISO: sc.end_time,
        });
      }
      fetchClasses(client.id);
    }
  };

  const handleCancelBooking = async (classId: string) => {
    const s = getSupabase();
    if (!client) return;
    setBookingStates((prev) => ({ ...prev, [classId]: "loading" }));

    const { data: booking } = await s
      .from("bookings")
      .select("status")
      .eq("client_id", client.id)
      .eq("scheduled_class_id", classId)
      .maybeSingle();

    await s
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("client_id", client.id)
      .eq("scheduled_class_id", classId);

    const wasBookedOrCheckedIn = booking?.status === "booked" || booking?.status === "checked_in";
    if (wasBookedOrCheckedIn) {
      const { data: waitlisted } = await s
        .from("bookings")
        .select("id")
        .eq("scheduled_class_id", classId)
        .eq("status", "waitlisted")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (waitlisted) {
        await s.from("bookings").update({ status: "booked" }).eq("id", waitlisted.id);
      }
    }

    setBookingStates((prev) => {
      const next = { ...prev };
      delete next[classId];
      return next;
    });
    fetchClasses(client.id);
  };

  const getBookingStatus = (sc: UpcomingClass): "booked" | "waitlisted" | "available" => {
    const booking = sc.bookings?.find((b) => b.client_id === client?.id);
    if (!booking) return "available";
    if (booking.status === "booked" || booking.status === "checked_in") return "booked";
    if (booking.status === "waitlisted") return "waitlisted";
    return "available";
  };

  const bookedCount = (sc: UpcomingClass) =>
    (sc.bookings ?? []).filter((b) => b.status === "booked" || b.status === "checked_in").length;

  if (!client) {
    return (
      <div className="mx-auto max-w-md pt-12">
        <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
          Book a Class
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter the email you registered with your studio.
        </p>
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="your@email.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {notFound && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              No client found with that email. Please contact your studio to register.
            </div>
          )}
          <Button type="submit" className="w-full" disabled={searching}>
            {searching ? "Looking up..." : "Find My Account"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book Classes</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {client.name}
            {client.class_credits > 0 && (
              <> · <span className="font-medium text-primary">{client.class_credits} credits</span></>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setClient(null);
            setEmail("");
            setNotFound(false);
            setClasses([]);
            setBookingStates({});
          }}
        >
          Sign out
        </Button>
      </div>

      {!hasWaiver && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <FileText className="size-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Waiver Required</p>
                <p className="text-xs text-muted-foreground mb-2">
                  You must sign the liability waiver before booking classes.
                </p>
                <Link href="/waiver">
                  <Button size="sm" variant="outline">
                    Sign Waiver
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingClasses ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Loading upcoming classes...
        </p>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-10 text-muted-foreground mx-auto mb-3" />
            <CardTitle className="text-base mb-1">No Upcoming Classes</CardTitle>
            <p className="text-sm text-muted-foreground">
              No classes scheduled for the next 7 days. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(() => {
            const grouped: Record<string, UpcomingClass[]> = {};
            for (const sc of classes) {
              const key = format(new Date(sc.start_time), "yyyy-MM-dd");
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(sc);
            }
            return Object.entries(grouped).map(([dateStr, classList]) => (
              <Card key={dateStr}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(new Date(dateStr), "EEEE, MMMM d")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {classList.map((sc) => {
                    const ct = sc.class_types;
                    const status = getBookingStatus(sc);
                    const bs = bookingStates[sc.id];
                    const spots = bookedCount(sc);
                    const full = spots >= (ct?.capacity ?? 20);

                    const bookedOrWaitlisted = status === "booked" || status === "waitlisted";
                    const stateLabel = status === "booked" ? "Booked" : status === "waitlisted" ? "Waitlisted" : null;

                    const bookingStateUI = (() => {
                      if (bookedOrWaitlisted) {
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant={status === "booked" ? "default" : "outline"}>
                              {stateLabel}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-muted-foreground"
                              onClick={() => handleCancelBooking(sc.id)}
                              disabled={bs === "loading"}
                            >
                              Cancel
                            </Button>
                          </div>
                        );
                      }
                      if (bs === "success") {
                        return (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="size-4" />
                            Booked!
                          </div>
                        );
                      }
                      if (bs === "waitlisted") {
                        return <Badge variant="outline">Waitlisted</Badge>;
                      }
                      return (
                        <Button
                          size="sm"
                          disabled={bs === "loading" || full || !hasWaiver}
                          onClick={() => handleBook(sc.id)}
                        >
                          {bs === "loading"
                            ? "Booking..."
                            : full
                            ? "Full"
                            : !hasWaiver
                            ? "Sign Waiver First"
                            : "Book"}
                          <ArrowRight className="size-3.5" />
                        </Button>
                      );
                    })();

                    return (
                      <div
                        key={sc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col items-center shrink-0">
                            <span className="text-sm font-bold">
                              {format(new Date(sc.start_time), "h:mm")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(sc.start_time), "a")}
                            </span>
                          </div>
                          <div className="hidden sm:block h-8 w-px bg-border" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{ct?.name ?? "Class"}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {ct?.duration_minutes ?? "-"}min
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {spots} / {ct?.capacity ?? "-"}
                              </span>
                              {ct && ct.price_cents > 0 && (
                                <span>{formatKes(ct.price_cents)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="self-end sm:self-auto">{bookingStateUI}</div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}
    </>
  );
}
