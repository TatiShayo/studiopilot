import { db } from "@/lib/db";
import ClientManager from "./client-manager";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  // Load all required data on the server
  const clients = await db.clients.list();
  const payments = await db.payments.list();
  const memberships = await db.memberships.list();
  const bookings = await db.bookings.list();
  const instances = await db.classInstances.list();
  const schedules = await db.classSchedule.list();
  const classTypes = await db.classTypes.list();

  // Sort clients by last name then first name
  const sortedClients = [...clients].sort((a, b) => {
    const ln = a.last_name.localeCompare(b.last_name);
    if (ln !== 0) return ln;
    return a.first_name.localeCompare(b.first_name);
  });

  return (
    <ClientManager
      clients={sortedClients}
      payments={payments}
      memberships={memberships}
      bookings={bookings}
      instances={instances}
      schedules={schedules}
      classTypes={classTypes}
    />
  );
}
