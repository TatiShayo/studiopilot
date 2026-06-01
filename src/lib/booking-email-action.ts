"use server";

import { sendBookingConfirmation } from "@/lib/email";

export async function sendBookingEmail(data: {
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
  await sendBookingConfirmation(data);
}
