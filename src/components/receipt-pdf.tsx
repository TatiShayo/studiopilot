import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 24, borderBottom: "2px solid #14b8a6", paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: "bold", color: "#14b8a6" },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: "#666", width: 120 },
  value: { fontWeight: "bold", flex: 1 },
  section: { marginTop: 16, paddingTop: 12, borderTop: "1px solid #e5e5e5" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 8, borderTop: "1px solid #14b8a6" },
  totalLabel: { fontSize: 14, fontWeight: "bold" },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#14b8a6" },
  footer: { marginTop: 40, textAlign: "center", fontSize: 9, color: "#999" },
});

interface ReceiptPDFProps {
  receiptNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  method: string;
  description: string;
  amount: string;
  mpesaPhone?: string;
  mpesaRef?: string;
}

export function ReceiptPDF({
  receiptNumber,
  date,
  clientName,
  clientEmail,
  method,
  description,
  amount,
  mpesaPhone,
  mpesaRef,
}: ReceiptPDFProps) {
  const methodLabel =
    method === "mpesa"
      ? "M-Pesa"
      : method === "bank"
      ? "Bank Transfer"
      : method.charAt(0).toUpperCase() + method.slice(1);

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>StudioPilot</Text>
          <Text style={styles.subtitle}>Payment Receipt</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Receipt #</Text>
          <Text style={styles.value}>{receiptNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{date}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{clientEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{methodLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{description}</Text>
          </View>
          {mpesaPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>M-Pesa Phone</Text>
              <Text style={styles.value}>{mpesaPhone}</Text>
            </View>
          )}
          {mpesaRef && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction Ref</Text>
              <Text style={styles.value}>{mpesaRef}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{amount}</Text>
        </View>

        <View style={styles.footer}>
          <Text>StudioPilot — Run your studio. Not your software.</Text>
          <Text style={{ marginTop: 4 }}>Thank you for your payment!</Text>
        </View>
      </Page>
    </Document>
  );
}
