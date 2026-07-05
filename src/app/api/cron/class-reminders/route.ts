import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || token !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const tomorrow = addDays(startOfDay(new Date()), 1);
  const tomorrowEnd = endOfDay(tomorrow);

  const { data: classes } = await supabase
    .from("scheduled_classes")
    .select("id, start_time, class_types(name, duration_minutes), staff(name)")
    .eq("status", "scheduled")
    .gte("start_time", tomorrow.toISOString())
    .lte("start_time", tomorrowEnd.toISOString())
    .order("start_time");

  if (!classes || classes.length === 0) {
    return Response.json({ sent: 0, message: "No classes tomorrow" });
  }

  let sent = 0;

  for (const sc of classes) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("client_id, clients(email, name)")
      .eq("scheduled_class_id", sc.id)
      .in("status", ["booked", "checked_in"]);

    if (!bookings) continue;

    const ct = (sc as any).class_types;
    const staff = (sc as any).staff;
    const startTime = new Date(sc.start_time);
    const className = ct?.name ?? "Class";
    const dateStr = startTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const timeStr = startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const instructor = staff?.name;

    for (const booking of bookings as any[]) {
      const client = booking.clients as { email: string; name: string } | null;
      if (!client?.email) continue;

      await sendEmail({
        to: client.email,
        subject: `Reminder: ${className} tomorrow at ${timeStr}`,
        text: `Hi ${client.name},

Just a quick reminder — you're booked for ${className} tomorrow, ${dateStr} at ${timeStr}${instructor ? ` with ${instructor}` : ""}.

Duration: ${ct?.duration_minutes ?? "60"} minutes

See you there!
— StudioPilot`,
      });
      sent++;
    }
  }

  return Response.json({ sent, classes: classes.map((c) => (c as any).class_types?.name) });
}
