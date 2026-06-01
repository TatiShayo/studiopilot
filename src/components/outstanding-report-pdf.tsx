import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottom: "2px solid #14b8a6", paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold", color: "#14b8a6" },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  meta: { marginBottom: 20 },
  metaRow: { fontSize: 9, color: "#666" },
  tableHeader: { flexDirection: "row", borderBottom: "1px solid #999", paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottom: "1px solid #eee" },
  colClient: { flex: 2, fontWeight: "bold" },
  colPlan: { flex: 1.5 },
  colEnd: { flex: 1 },
  colPrice: { flex: 1, textAlign: "right" },
  colLast: { flex: 1.5 },
  colLastAmt: { flex: 1, textAlign: "right" },
  totalRow: { flexDirection: "row", marginTop: 16, paddingTop: 8, borderTop: "1px solid #14b8a6" },
  totalLabel: { flex: 3, fontSize: 11, fontWeight: "bold" },
  totalValue: { flex: 1, fontSize: 11, fontWeight: "bold", color: "#14b8a6", textAlign: "right" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#999" },
});

interface OverdueRow {
  clientName: string;
  clientEmail: string;
  planName: string;
  endDate: string;
  price: string;
  lastPaymentDate: string;
  lastPaymentAmount: string;
}

interface OutstandingReportPDFProps {
  date: string;
  rows: OverdueRow[];
  totalOutstanding: string;
}

export function OutstandingReportPDF({ date, rows, totalOutstanding }: OutstandingReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>StudioPilot</Text>
          <Text style={styles.subtitle}>Outstanding Balance Report</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaRow}>Generated: {date}</Text>
          <Text style={styles.metaRow}>Total overdue clients: {rows.length}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colClient}>Client</Text>
          <Text style={styles.colPlan}>Plan</Text>
          <Text style={styles.colEnd}>End Date</Text>
          <Text style={styles.colPrice}>Price</Text>
          <Text style={styles.colLast}>Last Payment</Text>
          <Text style={styles.colLastAmt}>Amount</Text>
        </View>

        {rows.map((row, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.colClient}>{row.clientName}</Text>
            <Text style={styles.colPlan}>{row.planName}</Text>
            <Text style={styles.colEnd}>{row.endDate}</Text>
            <Text style={styles.colPrice}>{row.price}</Text>
            <Text style={styles.colLast}>{row.lastPaymentDate}</Text>
            <Text style={styles.colLastAmt}>{row.lastPaymentAmount}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Outstanding</Text>
          <Text style={styles.totalValue}>{totalOutstanding}</Text>
        </View>

        <View style={styles.footer}>
          <Text>StudioPilot — Run your studio. Not your software.</Text>
          <Text style={{ marginTop: 2 }}>This is a print-ready collections report. Generated automatically.</Text>
        </View>
      </Page>
    </Document>
  );
}
