import { db } from "@/lib/db";
import BillingClient from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  // Load data for billing details
  const clients = await db.clients.list();
  const payments = await db.payments.list();
  const memberships = await db.memberships.list();

  // Sort payments by newest paid_at first
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
  );

  // Sort clients alphabetically
  const sortedClients = [...clients].sort((a, b) => 
    `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)
  );

  return (
    <BillingClient
      clients={sortedClients}
      payments={sortedPayments}
      memberships={memberships}
    />
  );
}
