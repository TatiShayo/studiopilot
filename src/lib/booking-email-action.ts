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
}) {
  await sendBookingConfirmation(data);
}
