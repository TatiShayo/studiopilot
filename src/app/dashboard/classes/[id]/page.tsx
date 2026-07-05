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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Clock, Users, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { Client, Booking, ClassType, Staff } from "@/lib/types";
import { CheckInButton } from "./check-in-button";
import { BookClientForm } from "./book-client-form";
import { CancelBookingButton } from "./cancel-booking-button";
import { CancelClassButton } from "./cancel-class-button";

type BookingWithClient = Booking & {
  clients: Client | null;
};

export default async function ClassDetailPage({
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

  const { data: sc } = await supabase
    .from("scheduled_classes")
    .select("*, class_types(*), staff(*)")
    .eq("id", id)
    .single();

  if (!sc) {
    return (
      <div>
        <Link href="/dashboard/classes/upcoming">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
        <p className="text-muted-foreground">Class not found.</p>
      </div>
    );
  }

  const classType = sc.class_types as ClassType | null;
  const staff = sc.staff as Staff | null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, clients(*)")
    .eq("scheduled_class_id", id)
    .order("created_at");

  const bookingList = (bookings as BookingWithClient[]) ?? [];
  const booked = bookingList.filter((b) => b.status === "booked" || b.status === "checked_in");
  const waitlisted = bookingList.filter((b) => b.status === "waitlisted");
  const capacity = classType?.capacity ?? 0;
  const spotsLeft = capacity - booked.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link href="/dashboard/classes/upcoming">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {classType?.name ?? "Class"} · {format(new Date(sc.start_time), "EEEE, MMM d")}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {format(new Date(sc.start_time), "h:mm a")} – {format(new Date(sc.end_time), "h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {booked.length}/{capacity} booked
            </span>
            {staff && (
              <span className="flex items-center gap-1.5">
                {staff.photo_url ? (
                  <img src={staff.photo_url} alt={staff.name} className="size-4 rounded-full object-cover" />
                ) : (
                  <User className="size-3.5" />
                )}
                {staff.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sc.status === "scheduled" && <CancelClassButton classId={id} />}
          <Badge
            variant={
              sc.status === "scheduled"
                ? "default"
                : sc.status === "completed"
                ? "secondary"
                : "destructive"
            }
          >
            {sc.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Booked ({booked.length}/{capacity})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booked.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients booked yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booked.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/clients/${b.client_id}`}
                            className="font-medium hover:underline"
                          >
                            {b.clients?.name ?? "Unknown"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.status === "checked_in" ? "default" : "outline"}>
                            {b.status === "checked_in" ? "Checked In" : "Booked"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                          {b.status === "booked" && sc.status === "scheduled" && (
                            <CheckInButton bookingId={b.id} classId={id} />
                          )}
                          {b.status !== "checked_in" && sc.status === "scheduled" && (
                            <CancelBookingButton bookingId={b.id} classId={id} />
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {waitlisted.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Waitlist ({waitlisted.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlisted.map((b, i) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/clients/${b.client_id}`}
                            className="font-medium hover:underline"
                          >
                            {b.clients?.name ?? "Unknown"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          #{i + 1}
                        </TableCell>
                        <TableCell>
                          {sc.status === "scheduled" && (
                            <CancelBookingButton bookingId={b.id} classId={id} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <BookClientForm classId={id} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Class Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{classType?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{classType?.duration_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span>{capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spots Left</span>
                <span className={spotsLeft <= 2 ? "text-destructive font-medium" : ""}>
                  {spotsLeft}
                </span>
              </div>
              {classType?.description && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground">{classType.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
