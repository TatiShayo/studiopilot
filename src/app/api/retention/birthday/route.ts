import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await request.json();

  const { data: client } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", clientId)
    .single();

  if (!client) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  const firstName = client.name.split(' ')[0];
  const message = `Hi ${firstName}! 🎂 Happy Birthday from everyone at the studio! Have a wonderful day and we hope to see you soon for a celebratory class!`;

  await sendEmail({
    to: client.email,
    subject: "Happy Birthday! 🎂",
    text: message,
  });

  // Create activity log entry
  await supabase.from("client_notes").insert({
    client_id: clientId,
    content: `Birthday greeting sent! 🎂`,
    author_id: user.id
  });

  return Response.json({ sent: true });
}
