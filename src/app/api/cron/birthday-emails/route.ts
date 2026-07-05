import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || token !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, birth_date")
    .eq("status", "active");

  if (!clients) {
    return Response.json({ sent: 0 });
  }

  const birthdayClients = clients.filter((c) => {
    if (!c.birth_date) return false;
    const bd = new Date(c.birth_date);
    return bd.getMonth() + 1 === month && bd.getDate() === day;
  });

  let sent = 0;
  for (const client of birthdayClients) {
    await sendEmail({
      to: client.email,
      subject: "Happy Birthday from StudioPilot! 🎂",
      text: `Happy Birthday, ${client.name}!\n\nWishing you a wonderful day filled with joy and wellness. Thank you for being part of our studio community.\n\n— The StudioPilot Team`,
    });
    sent++;
  }

  return Response.json({ sent, clients: birthdayClients.map((c) => c.name) });
}
