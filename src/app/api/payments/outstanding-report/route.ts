import { createClient } from "@/lib/supabase/server";
import { OutstandingReportPDF } from "@/components/outstanding-report-pdf";
import { renderToBuffer } from "@react-pdf/renderer";
import { formatKes } from "@/lib/format-currency";

export async function POST() {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split("T")[0];

    const { data: expiredMemberships } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "active")
      .lt("end_date", today);

    const memberships = expiredMemberships ?? [];

    if (memberships.length === 0) {
      const pdfBuffer = await renderToBuffer(
        OutstandingReportPDF({ date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), rows: [], totalOutstanding: "KES 0" }),
      );
      const base64 = Buffer.from(pdfBuffer).toString("base64");
      return Response.json({ pdf: base64, filename: `outstanding-balance-${today}.pdf` });
    }

    const clientIds = [...new Set(memberships.map((m: any) => m.client_id))];

    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .in("id", clientIds);

    const clientsMap = new Map<string, any>();
    (clientsData as any[])?.forEach((c) => clientsMap.set(c.id, c));

    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    const payments = (paymentsData as any[]) ?? [];

    const rows: Array<{
      clientName: string;
      clientEmail: string;
      planName: string;
      endDate: string;
      price: string;
      lastPaymentDate: string;
      lastPaymentAmount: string;
    }> = [];

    let totalCents = 0;

    for (const m of memberships) {
      const client = clientsMap.get(m.client_id);
      if (!client) continue;

      const clientPayments = payments.filter((p) => p.client_id === m.client_id);
      const lastPayment = clientPayments[0] ?? null;

      totalCents += m.price ?? 0;

      rows.push({
        clientName: client.name,
        clientEmail: client.email,
        planName: m.plan_name,
        endDate: new Date(m.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        price: formatKes(m.price),
        lastPaymentDate: lastPayment
          ? new Date(lastPayment.paid_at ?? lastPayment.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : "N/A",
        lastPaymentAmount: lastPayment ? formatKes(lastPayment.amount_cents) : "N/A",
      });
    }

    const pdfBuffer = await renderToBuffer(
      OutstandingReportPDF({
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        rows,
        totalOutstanding: formatKes(totalCents),
      }),
    );

    const base64 = Buffer.from(pdfBuffer).toString("base64");
    return Response.json({ pdf: base64, filename: `outstanding-balance-${today}.pdf` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
