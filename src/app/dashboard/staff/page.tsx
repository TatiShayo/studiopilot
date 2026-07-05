import { db } from "@/lib/db";
import StaffClient from "./staff-client";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  // Load staff records and schedules on the server
  const staffList = await db.staff.list();
  const schedules = await db.classSchedule.list();
  const instances = await db.classInstances.list();
  const classTypes = await db.classTypes.list();
  const locations = await db.locations.list();

  // Sort staff alphabetically
  const sortedStaff = [...staffList].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <StaffClient
      staffList={sortedStaff}
      schedules={schedules}
      instances={instances}
      classTypes={classTypes}
      locations={locations}
    />
  );
}
