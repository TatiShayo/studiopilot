"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { format } from "date-fns";

export async function cancelClass(formData: FormData) {
  const classId = formData.get("classId") as string;
  if (!classId) return { error: "Missing class ID" };

  const supabase = await createClient();

  const { data: sc, error: scError } = await supabase
    .from("scheduled_classes")
    .select("*, class_types(name)")
    .eq("id", classId)
    .single();

  if (scError || !sc) return { error: "Class not found" };
  if (sc.status === "cancelled") return { error: "Already cancelled" };

  const { error: updateError } = await supabase
    .from("scheduled_classes")
    .update({ status: "cancelled" })
    .eq("id", classId);

  if (updateError) return { error: updateError.message };

  const { data: bookings } = await supabase
    .from("bookings")
    .select("client_id, clients(email, name)")
    .eq("scheduled_class_id", classId)
    .in("status", ["booked", "waitlisted"]);

  if (bookings) {
    const classDate = format(new Date(sc.start_time), "EEEE, MMM d 'at' h:mm a");
    const className = (sc.class_types as any)?.name ?? "Class";
    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/book`;

    const emails = bookings
      .map((b: any) => b.clients?.email)
      .filter(Boolean) as string[];

    for (const email of [...new Set(emails)]) {
      await sendEmail({
        to: email,
        subject: `Cancelled: ${className} on ${classDate}`,
        text: `Hi,

We're sorry to let you know that ${className} on ${classDate} has been cancelled.

We apologize for any inconvenience this may cause. Please visit our booking portal to find an alternative class that works for you:

${portalUrl}

— StudioPilot`,
      });
    }
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath("/dashboard/classes/upcoming");

  return { success: true };
}
