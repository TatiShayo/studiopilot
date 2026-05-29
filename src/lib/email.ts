import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  const { error } = await resend.emails.send({
    from: "StudioPilot <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
  if (error) {
    console.error("Resend error:", error);
  }
}
