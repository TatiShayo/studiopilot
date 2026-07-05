"use server";

import { db, Client, Payment, Membership, ClassType, ClassSchedule, Booking, Staff, ClassInstance } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Client Actions
export async function saveClientAction(clientData: Omit<Client, "id"> & { id?: string }) {
  try {
    const saved = await db.clients.save(clientData);
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: true, client: saved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save client" };
  }
}

// 2. Billing & Payment Actions
export async function recordPaymentAction(paymentData: Omit<Payment, "id" | "paid_at"> & { id?: string, paid_at?: string }) {
  try {
    const paid_at = paymentData.paid_at || new Date().toISOString();
    const saved = await db.payments.save({
      ...paymentData,
      paid_at
    } as Payment);
    
    // If the payment is for a membership renewal, let's also update the client's membership tier
    if (paymentData.description?.includes("Membership") && paymentData.amount > 0) {
      const client = await db.clients.get(paymentData.client_id);
      if (client) {
        let tier = "Starter";
        if (paymentData.amount >= 99) tier = "Studio";
        else if (paymentData.amount >= 59) tier = "Pro";
        
        await db.clients.save({
          ...client,
          membership_tier: tier,
          is_active: true
        });
      }
    }
    
    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: true, payment: saved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record payment" };
  }
}

// 3. Membership Assignment Action
export async function assignMembershipAction(membershipData: Omit<Membership, "id"> & { id?: string }) {
  try {
    const saved = await db.memberships.save(membershipData as Membership);
    
    // Update the client's membership tier to match the plan name
    const client = await db.clients.get(membershipData.client_id);
    if (client) {
      await db.clients.save({
        ...client,
        membership_tier: membershipData.plan_name,
        is_active: true
      });
    }

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/billing");
    return { success: true, membership: saved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to assign membership" };
  }
}

// 4. Class Type Actions
export async function saveClassTypeAction(classTypeData: Omit<ClassType, "id"> & { id?: string }) {
  try {
    const saved = await db.classTypes.save(classTypeData);
    revalidatePath("/dashboard/classes");
    return { success: true, classType: saved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save class type" };
  }
}

// 5. Class Schedule Actions
export async function saveClassScheduleAction(scheduleData: Omit<ClassSchedule, "id"> & { id?: string }) {
  try {
    // Check for instructor shift overlap
    if (scheduleData.instructor_id) {
      const allSchedules = await db.classSchedule.list();
      const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      
      const newStart = timeToMinutes(scheduleData.start_time);
      const newEnd = timeToMinutes(scheduleData.end_time);

      const conflicts = allSchedules.filter(s => 
        s.instructor_id === scheduleData.instructor_id &&
        Number(s.day_of_week) === Number(scheduleData.day_of_week) &&
        s.id !== scheduleData.id
      );

      for (const conf of conflicts) {
        const confStart = timeToMinutes(conf.start_time);
        const confEnd = timeToMinutes(conf.end_time);
        if (newStart < confEnd && confStart < newEnd) {
          throw new Error("Instructor has an overlapping class schedule");
        }
      }
    }

    const saved = await db.classSchedule.save(scheduleData);
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");
    return { success: true, schedule: saved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save class schedule" };
  }
}

// 6. Booking Actions (with double-booking check & capacity limit)
export async function bookClassAction(bookingData: { client_id: string; class_instance_id: string }) {
  try {
    // 1. Get the class instance and schedule
    const instance = await db.classInstances.get(bookingData.class_instance_id);
    if (!instance) throw new Error("Class instance not found");

    const schedule = await db.classSchedule.get(instance.class_schedule_id);
    if (!schedule) throw new Error("Schedule not found");

    const classType = await db.classTypes.get(schedule.class_type_id);
    if (!classType) throw new Error("Class type not found");

    // 2. Check for double booking (is this client already booked in this instance?)
    const bookings = await db.bookings.list();
    const isDoubleBooked = bookings.some(
      b => b.client_id === bookingData.client_id && 
           b.class_instance_id === bookingData.class_instance_id && 
           b.status !== "cancelled"
    );
    if (isDoubleBooked) throw new Error("Client is already booked for this class");

    // 3. Check capacity
    const activeBookings = bookings.filter(
      b => b.class_instance_id === bookingData.class_instance_id && b.status === "booked"
    );

    let status: "booked" | "waitlist" = "booked";
    if (activeBookings.length >= classType.capacity) {
      status = "waitlist";
    }

    // 4. Save booking
    const saved = await db.bookings.save({
      client_id: bookingData.client_id,
      class_instance_id: bookingData.class_instance_id,
      status,
      booked_at: new Date().toISOString()
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/booking-portal");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");

    return { success: true, booking: saved, status };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to book class" };
  }
}

// 7. Cancel Booking Action (triggers waitlist promotion)
export async function cancelBookingAction(bookingId: string) {
  try {
    const booking = await db.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    // Update status to cancelled
    booking.status = "cancelled";
    await db.bookings.save(booking);

    // Trigger waitlist promotion: find the oldest waitlisted booking for this instance
    const allBookings = await db.bookings.list();
    const waitlisted = allBookings
      .filter(b => b.class_instance_id === booking.class_instance_id && b.status === "waitlist")
      .sort((a, b) => new Date(a.booked_at).getTime() - new Date(b.booked_at).getTime());

    let promotedClient = null;
    if (waitlisted.length > 0) {
      const topWaitlist = waitlisted[0];
      topWaitlist.status = "booked";
      await db.bookings.save(topWaitlist);
      promotedClient = topWaitlist.client_id;
    }

    revalidatePath("/dashboard/classes");
    revalidatePath("/booking-portal");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");

    return { success: true, promotedClient };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel booking" };
  }
}

// 8. Check-In Action
export async function checkInBookingAction(bookingId: string, checkedIn: boolean) {
  try {
    const booking = await db.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    booking.checked_in_at = checkedIn ? new Date().toISOString() : undefined;
    await db.bookings.save(booking);

    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard/clients");
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to check in booking" };
  }
}

// 9. Staff Actions
export async function saveStaffAction(staffData: Omit<Staff, "id"> & { id?: string }) {
  try {
    const saved = await db.staff.save(staffData);
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true, staff: saved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save staff member" };
  }
}
