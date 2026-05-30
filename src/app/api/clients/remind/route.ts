import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await request.json();

  if (!clientId) {
    return Response.json({ error: "Missing clientId" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, last_visit")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  const daysSince = client.last_visit
    ? Math.floor((Date.now() - new Date(client.last_visit).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const message = daysSince
    ? `Hi ${client.name},\n\nWe've missed you at the studio! It's been ${daysSince} days since your last visit. Your wellness journey is important to us — come back and join a class this week.\n\nWe'd love to see you again soon!\n\n— The StudioPilot Team`
    : `Hi ${client.name},\n\nWe noticed you haven't visited the studio yet. We'd love to welcome you for your first class! Book now and start your wellness journey.\n\n— The StudioPilot Team`;

  await sendEmail({
    to: client.email,
    subject: "We miss you at the studio! 🧘",
    text: message,
  });

  return Response.json({ success: true });
}
