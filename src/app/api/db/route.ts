import { NextResponse, NextRequest } from "next/server";
import { readMockDB, writeMockDB, MockDBStore } from "@/lib/db";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const store = readMockDB();
    return NextResponse.json(store);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load database" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const data: Partial<MockDBStore> = await request.json();
    const store = readMockDB();

    // Merge entities if provided
    if (data.clients) store.clients = data.clients;
    if (data.payments) store.payments = data.payments;
    if (data.bookings) store.bookings = data.bookings;
    if (data.class_instances) store.class_instances = data.class_instances;
    if (data.class_schedule) store.class_schedule = data.class_schedule;
    if (data.class_types) store.class_types = data.class_types;
    if (data.staff) store.staff = data.staff;
    if (data.memberships) store.memberships = data.memberships;

    writeMockDB(store);

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update database" }, { status: 400 });
  }
}
