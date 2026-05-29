"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function promoteWaitlist(supabase: Awaited<ReturnType<typeof createClient>>, classId: string) {
  const { data: waitlisted } = await supabase
    .from("bookings")
    .select("id, client_id")
    .eq("scheduled_class_id", classId)
    .eq("status", "waitlisted")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!waitlisted) return;

  await supabase
    .from("bookings")
    .update({ status: "booked" })
    .eq("id", waitlisted.id);
}

export async function bookClientIntoClass(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const classId = formData.get("classId") as string;

  if (!clientId || !classId) {
    return { error: "Missing client or class" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("client_id", clientId)
    .eq("scheduled_class_id", classId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "cancelled") {
      await supabase
        .from("bookings")
        .update({ status: "booked" })
        .eq("id", existing.id);
      revalidatePath(`/dashboard/classes/${classId}`);
      return { status: "booked" };
    }
    return { error: "Already booked or waitlisted" };
  }

  const { data: sc } = await supabase
    .from("scheduled_classes")
    .select("*, class_types(capacity)")
    .eq("id", classId)
    .single();

  if (!sc) {
    return { error: "Class not found" };
  }

  const capacity = (sc.class_types as any)?.capacity ?? 20;

  const { count: bookedCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("scheduled_class_id", classId)
    .in("status", ["booked", "checked_in"]);

  const status = (bookedCount ?? 0) >= capacity ? "waitlisted" : "booked";

  const { error } = await supabase.from("bookings").insert({
    client_id: clientId,
    scheduled_class_id: classId,
    status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  return { status };
}

export async function cancelBooking(formData: FormData) {
  const bookingId = formData.get("bookingId") as string;
  const classId = formData.get("classId") as string;

  if (!bookingId || !classId) {
    return { error: "Missing booking or class" };
  }

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return { error: "Booking not found" };
  }

  const wasBookedOrCheckedIn = booking.status === "booked" || booking.status === "checked_in";

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (wasBookedOrCheckedIn) {
    await promoteWaitlist(supabase, classId);
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  return { success: true };
}
