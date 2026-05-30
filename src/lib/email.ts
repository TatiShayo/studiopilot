let resend: any = null;

function getResend() {
  if (!resend) {
    try {
      const { Resend } = require("resend");
      if (process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
      }
    } catch {
      // resend not available
    }
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  const { error } = await client.emails.send({
    from: "StudioPilot <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
  if (error) {
    console.error("Resend error:", error);
  }
}
