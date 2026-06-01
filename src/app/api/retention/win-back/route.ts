import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await request.json();

  const { data: client } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", contactId)
    .single();

  if (!client) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  const firstName = client.name.split(' ')[0];
  const message = `Hi ${firstName}, we've missed you! Come back and book a class. Your spot on the mat is waiting for you.`;

  await sendEmail({
    to: client.email,
    subject: "We miss you!",
    text: message,
  });

  // Create activity log entry
  await supabase.from("client_notes").insert({
    client_id: contactId,
    content: `Win-back email sent: "${message}"`,
    author_id: user.id
  });

  return Response.json({ sent: true });
}
