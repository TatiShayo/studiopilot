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

import { buildCalendarLinks } from "@/lib/calendar";

export async function sendBookingConfirmation({
  to,
  clientName,
  className,
  date,
  time,
  instructor,
  location,
  cancelUrl,
  calendarStartISO,
  calendarEndISO,
}: {
  to: string;
  clientName: string;
  className: string;
  date: string;
  time: string;
  instructor?: string;
  location?: string;
  cancelUrl?: string;
  calendarStartISO?: string;
  calendarEndISO?: string;
}) {
  let calendarLine = "";

  if (calendarStartISO && calendarEndISO) {
    const links = buildCalendarLinks({
      className,
      startISO: calendarStartISO,
      endISO: calendarEndISO,
      instructor,
      location,
    });
    calendarLine = `\nAdd to calendar: ${links.google}`;
  }

  const text = `Hi ${clientName},

You're booked!

${className}
${date} at ${time}${instructor ? ` with ${instructor}` : ""}${location ? ` at ${location}` : ""}
${calendarLine}
${cancelUrl ? `Need to cancel? ${cancelUrl}` : ""}

See you there!
— StudioPilot`;

  await sendEmail({
    to,
    subject: `Booked: ${className} on ${date}`,
    text,
  });
}
