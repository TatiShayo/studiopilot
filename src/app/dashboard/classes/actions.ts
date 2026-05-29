"use server";

import { createClient } from "@/lib/supabase/server";
import { addDays, startOfDay, setHours, setMinutes } from "date-fns";

export async function generateWeeklyClasses(formData: FormData) {
  const supabase = await createClient();

  const today = startOfDay(new Date());

  const { data: recurring } = await supabase
    .from("recurring_schedules")
    .select("*, class_types(*)")
    .eq("active", true);

  if (!recurring || recurring.length === 0) {
    return { error: "No recurring schedules found" };
  }

  let created = 0;

  for (const r of recurring) {
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      if (date.getDay() !== r.day_of_week) continue;

      const [hours, minutes] = (r.start_time as string).split(":").map(Number);
      const startTime = setMinutes(setHours(date, hours), minutes);
      const durationMs = (r.class_types?.duration_minutes ?? 60) * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      const { data: existing } = await supabase
        .from("scheduled_classes")
        .select("id")
        .eq("class_type_id", r.class_type_id)
        .gte("start_time", startTime.toISOString())
        .lt("start_time", new Date(startTime.getTime() + 60000).toISOString());

      if (existing && existing.length > 0) continue;

      const { error } = await supabase.from("scheduled_classes").insert({
        class_type_id: r.class_type_id,
        staff_id: r.staff_id,
        recurring_schedule_id: r.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "scheduled",
      });

      if (!error) created++;
    }
  }

  return { created };
}
