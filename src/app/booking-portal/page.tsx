import { db, syncClassInstances } from "@/lib/db";
import BookingClient from "./booking-client";

export const dynamic = "force-dynamic";

export default async function BookingPortalPage() {
  // Sync recurring schedule slots for the current 2-week calendar view
  await syncClassInstances("2026-06-29", "2026-07-12");

  // Load all required scheduling data
  const clients = await db.clients.list();
  const locations = await db.locations.list();
  const classTypes = await db.classTypes.list();
  const staff = await db.staff.list();
  const schedules = await db.classSchedule.list();
  const instances = await db.classInstances.list();
  const bookings = await db.bookings.list();

  // Sort clients alphabetically for the dropdown selection
  const sortedClients = [...clients].sort((a, b) => 
    `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)
  );

  return (
    <BookingClient
      clients={sortedClients}
      locations={locations}
      classTypes={classTypes}
      staff={staff}
      schedules={schedules}
      instances={instances}
      bookings={bookings}
    />
  );
}
