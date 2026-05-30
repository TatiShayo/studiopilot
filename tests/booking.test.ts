import { describe, it, expect, vi, beforeEach } from "vitest";

function makeQuery(data: unknown = null, error: unknown = null) {
  const chain: Record<string, vi.Mock> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn().mockResolvedValue({ error }),
    update: vi.fn().mockReturnThis(),
    head: vi.fn(),
  };
  return chain;
}

function makeCountQuery(count: number) {
  const chain: Record<string, vi.Mock> = {
    select: vi.fn((_cols: string, opts?: { count: string; head: boolean }) => {
      if (opts?.count) {
        // Return a new chain that resolves with count
        const inner: Record<string, vi.Mock> = {
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ count, data: [], error: null }),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
        };
        return inner;
      }
      return {
        ...chain,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
      };
    }),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
  };
  return chain;
}

let mockFrom: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { bookClientIntoClass, cancelBooking } = await import(
  "../src/app/dashboard/classes/book-actions"
);

describe("bookClientIntoClass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom = vi.fn();
  });

  it("returns error when clientId or classId is missing", async () => {
    const fd = new FormData();
    fd.set("clientId", "");
    fd.set("classId", "");
    const result = await bookClientIntoClass(fd);
    expect(result).toEqual({ error: "Missing client or class" });
  });

  it("returns error when class not found", async () => {
    const existingQuery = makeQuery(null);
    const classQuery = makeQuery(null);

    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") return existingQuery;
      if (table === "scheduled_classes") return classQuery;
      return makeQuery(null);
    });

    const fd = new FormData();
    fd.set("clientId", "c1");
    fd.set("classId", "class1");

    const result = await bookClientIntoClass(fd);
    expect(result).toEqual({ error: "Class not found" });
  });

  it("returns error if client is already booked or waitlisted", async () => {
    const existingQuery = makeQuery({ id: "b1", status: "booked" });
    mockFrom.mockReturnValue(existingQuery);

    const fd = new FormData();
    fd.set("clientId", "c1");
    fd.set("classId", "class1");

    const result = await bookClientIntoClass(fd);
    expect(result).toEqual({ error: "Already booked or waitlisted" });
  });

  it("reactivates a cancelled booking instead of rejecting", async () => {
    let capturedUpdate: Record<string, unknown> | null = null;
    let capturedEqId: string | null = null;

    const updateEqMock = vi.fn().mockImplementation((_col: string, id: string) => {
      capturedEqId = id;
      return Promise.resolve({ error: null });
    });

    const existingQuery = makeQuery({ id: "b1", status: "cancelled" });
    existingQuery.update = vi.fn((payload: Record<string, unknown>) => {
      capturedUpdate = payload;
      return { eq: updateEqMock };
    });

    mockFrom.mockReturnValue(existingQuery);

    const fd = new FormData();
    fd.set("clientId", "c1");
    fd.set("classId", "class1");

    const result = await bookClientIntoClass(fd);
    expect(result).toEqual({ status: "booked" });
    expect(capturedUpdate).toEqual({ status: "booked" });
    expect(capturedEqId).toBe("b1");
  });

  it("books a client when under capacity", async () => {
    let insertedPayload: Record<string, unknown> | null = null;

    const existingQuery = makeQuery(null);

    const classQuery = makeQuery({ id: "class1", class_types: { capacity: 10 } });

    const countQuery = makeCountQuery(3);

    const insertQuery = makeQuery(null);
    insertQuery.insert = vi.fn((payload: Record<string, unknown>) => {
      insertedPayload = payload;
      return Promise.resolve({ error: null });
    });

    const callCount: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      callCount.push(table);
      // bookings called 3 times: existing check, count, insert
      if (table === "scheduled_classes") return classQuery;

      const bookingCalls = callCount.filter((c) => c === "bookings").length;
      if (bookingCalls === 1) return existingQuery;
      if (bookingCalls === 2) return countQuery;
      return insertQuery;
    });

    const fd = new FormData();
    fd.set("clientId", "c1");
    fd.set("classId", "class1");

    const result = await bookClientIntoClass(fd);
    expect(result).toEqual({ status: "booked" });
    expect(insertedPayload).toEqual({
      client_id: "c1",
      scheduled_class_id: "class1",
      status: "booked",
    });
  });

  it("waitlists client when at or over capacity", async () => {
    let insertedPayload: Record<string, unknown> | null = null;

    const existingQuery = makeQuery(null);
    const classQuery = makeQuery({ id: "class1", class_types: { capacity: 10 } });
    const countQuery = makeCountQuery(10);

    const insertQuery = makeQuery(null);
    insertQuery.insert = vi.fn((payload: Record<string, unknown>) => {
      insertedPayload = payload;
      return Promise.resolve({ error: null });
    });

    const callCount: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      callCount.push(table);
      if (table === "scheduled_classes") return classQuery;

      const bookingCalls = callCount.filter((c) => c === "bookings").length;
      if (bookingCalls === 1) return existingQuery;
      if (bookingCalls === 2) return countQuery;
      return insertQuery;
    });

    const fd = new FormData();
    fd.set("clientId", "c2");
    fd.set("classId", "class1");

    const result = await bookClientIntoClass(fd);
    expect(result).toEqual({ status: "waitlisted" });
    expect(insertedPayload).toEqual({
      client_id: "c2",
      scheduled_class_id: "class1",
      status: "waitlisted",
    });
  });
});

describe("cancelBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom = vi.fn();
  });

  it("returns error when bookingId or classId is missing", async () => {
    const fd = new FormData();
    fd.set("bookingId", "");
    fd.set("classId", "");
    const result = await cancelBooking(fd);
    expect(result).toEqual({ error: "Missing booking or class" });
  });

  it("returns error when booking not found", async () => {
    const bookingQuery = makeQuery(null);
    mockFrom.mockReturnValue(bookingQuery);

    const fd = new FormData();
    fd.set("bookingId", "b1");
    fd.set("classId", "class1");

    const result = await cancelBooking(fd);
    expect(result).toEqual({ error: "Booking not found" });
  });

  it("cancels booking and promotes waitlist when status was booked", async () => {
    const updates: Record<string, unknown>[] = [];

    const bookingQuery = makeQuery({ status: "booked" });
    bookingQuery.update = vi.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    });

    mockFrom.mockReturnValue(bookingQuery);

    const fd = new FormData();
    fd.set("bookingId", "b1");
    fd.set("classId", "class1");

    const result = await cancelBooking(fd);
    expect(result).toEqual({ success: true });
    expect(updates[0]).toEqual({ status: "cancelled" });
    // The second update is promoteWaitlist promoting oldest waitlisted → booked
    expect(updates[1]).toEqual({ status: "booked" });
  });

  it("cancels booking but skips waitlist promotion when status was waitlisted", async () => {
    let promoteCalled = false;

    const bookingQuery = makeQuery({ status: "waitlisted" });
    bookingQuery.update = vi.fn((_payload: Record<string, unknown>) => {
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    });
    bookingQuery.order = vi.fn(() => {
      promoteCalled = true;
      return {
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockFrom.mockReturnValue(bookingQuery);

    const fd = new FormData();
    fd.set("bookingId", "b1");
    fd.set("classId", "class1");

    const result = await cancelBooking(fd);
    expect(result).toEqual({ success: true });
    expect(promoteCalled).toBe(false);
  });
});
