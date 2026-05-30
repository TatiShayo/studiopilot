import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { ReceiptPDF } from "@/components/receipt-pdf";
import { renderToBuffer } from "@react-pdf/renderer";
import { formatKes } from "@/lib/format-currency";

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();
    if (!paymentId || typeof paymentId !== "string") {
      return Response.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: payment } = await supabase
      .from("payments")
      .select("*, clients(id, name, email)")
      .eq("id", paymentId)
      .single();

    if (!payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    const clientData = (payment as any).clients as { id: string; name: string; email: string } | null;
    if (!clientData?.email) {
      return Response.json({ error: "Client has no email" }, { status: 400 });
    }

    const date = new Date(payment.paid_at ?? payment.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const methodLabel =
      payment.method === "mpesa"
        ? "M-Pesa"
        : payment.method === "bank"
        ? "Bank Transfer"
        : payment.method.charAt(0).toUpperCase() + payment.method.slice(1);

    const pdfBuffer = await renderToBuffer(
      ReceiptPDF({
        receiptNumber: payment.id.slice(0, 8).toUpperCase(),
        date,
        clientName: clientData.name,
        clientEmail: clientData.email,
        method: methodLabel,
        description: payment.description || `${payment.method.toUpperCase()} payment`,
        amount: formatKes(payment.amount_cents),
        mpesaPhone: (payment as any).mpesa_phone || undefined,
        mpesaRef: (payment as any).transaction_ref || undefined,
      }),
    );

    const base64 = Buffer.from(pdfBuffer).toString("base64");

    const client = (() => {
      try {
        const { Resend } = require("resend");
        if (process.env.RESEND_API_KEY) {
          return new Resend(process.env.RESEND_API_KEY);
        }
      } catch {
        // resend not available
      }
      return null;
    })();

    if (client) {
      await client.emails.send({
        from: "StudioPilot <onboarding@resend.dev>",
        to: clientData.email,
        subject: `Receipt #${payment.id.slice(0, 8).toUpperCase()} — ${formatKes(payment.amount_cents)}`,
        text: `Thank you for your payment of ${formatKes(payment.amount_cents)} via ${methodLabel}. Your receipt is attached.`,
        attachments: [
          {
            filename: `receipt-${payment.id.slice(0, 8)}.pdf`,
            content: base64,
          },
        ],
      });
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
