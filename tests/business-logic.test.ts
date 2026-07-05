import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { describe, it, before, after } from 'node:test';

// Import our system components
import { db, readMockDB, writeMockDB, MockDBStore, ClassInstance, ClassSchedule, ClassType } from '../src/lib/db';
import { 
  bookClassAction, 
  cancelBookingAction, 
  saveClassScheduleAction
} from '../src/app/dashboard/actions';
import { POST as stripeWebhookPOST } from '../src/app/api/stripe/webhook/route';
import { GET as stripeCheckoutGET } from '../src/app/api/stripe/checkout/route';
import { NextRequest } from 'next/server';

const MOCK_DB_PATH = path.join(process.cwd(), 'src', 'lib', 'mock_db_store.json');
const BACKUP_DB_PATH = path.join(process.cwd(), 'src', 'lib', 'mock_db_store.json.backup');

// Clear environment variables that might trigger Supabase integration so we test purely local database
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

let backupExists = false;

// Helper to calculate hours taught from DB arrays, mirroring staff-client.tsx
function calculateHoursTaught(
  instances: ClassInstance[],
  schedules: ClassSchedule[],
  classTypes: ClassType[],
  instructorId: string
): string {
  const staffInstances = instances.filter(inst => {
    if (inst.is_cancelled) return false;
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    return sched?.instructor_id === instructorId;
  });

  const totalMinutesTaught = staffInstances.reduce((total, inst) => {
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;
    return total + (classType?.duration_minutes || 60);
  }, 0);
  
  return (totalMinutesTaught / 60).toFixed(1);
}

before(() => {
  if (fs.existsSync(MOCK_DB_PATH)) {
    fs.copyFileSync(MOCK_DB_PATH, BACKUP_DB_PATH);
    backupExists = true;
  }
});

after(() => {
  if (backupExists) {
    fs.copyFileSync(BACKUP_DB_PATH, MOCK_DB_PATH);
    fs.unlinkSync(BACKUP_DB_PATH);
  } else if (fs.existsSync(MOCK_DB_PATH)) {
    fs.unlinkSync(MOCK_DB_PATH);
  }
});

function clearDB() {
  const emptyStore: MockDBStore = {
    profiles: [],
    locations: [],
    clients: [],
    class_types: [],
    staff: [],
    class_schedule: [],
    class_instances: [],
    bookings: [],
    payments: [],
    memberships: []
  };
  writeMockDB(emptyStore);
}

describe('StudioPilot Critical Business Logic', () => {

  describe('Booking Logic & Waitlists', () => {
    before(() => {
      clearDB();
    });

    it('should successfully book a class and block double booking', async () => {
      // 1. Setup mock data
      const client = await db.clients.save({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        membership_tier: 'None',
        join_date: '2026-06-30',
        is_active: true
      });

      const classType = await db.classTypes.save({
        name: 'Yoga Basic',
        duration_minutes: 60,
        capacity: 2,
        price: 20,
        color: '#14b8a6'
      });

      const location = await db.locations.save({
        name: 'Studio Room A',
        timezone: 'UTC'
      });

      const schedule = await db.classSchedule.save({
        class_type_id: classType.id,
        location_id: location.id,
        start_time: '10:00',
        end_time: '11:00',
        is_recurring: true,
        day_of_week: 1
      });

      const instance = await db.classInstances.save({
        class_schedule_id: schedule.id,
        date: '2026-06-29', // Monday
        is_cancelled: false
      });

      // 2. Book client first time
      const res1 = await bookClassAction({
        client_id: client.id,
        class_instance_id: instance.id
      });
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.status, 'booked');

      // Verify booking exists in DB
      const allBookings = await db.bookings.list();
      assert.strictEqual(allBookings.length, 1);
      assert.strictEqual(allBookings[0].client_id, client.id);
      assert.strictEqual(allBookings[0].status, 'booked');

      // 3. Try to book again (double booking check)
      const res2 = await bookClassAction({
        client_id: client.id,
        class_instance_id: instance.id
      });
      assert.strictEqual(res2.success, false);
      assert.match(res2.error || '', /already booked/i);
    });

    it('should enforce capacity limits by placing overflow bookings on waitlist', async () => {
      clearDB();

      // 1. Setup Class Type with capacity 2
      const classType = await db.classTypes.save({
        name: 'HIIT Extreme',
        duration_minutes: 45,
        capacity: 2,
        price: 30,
        color: '#f43f5e'
      });

      const location = await db.locations.save({ name: 'Cardio Area', timezone: 'UTC' });
      const schedule = await db.classSchedule.save({
        class_type_id: classType.id,
        location_id: location.id,
        start_time: '18:00',
        end_time: '18:45',
        is_recurring: true,
        day_of_week: 2
      });
      const instance = await db.classInstances.save({
        class_schedule_id: schedule.id,
        date: '2026-06-30',
        is_cancelled: false
      });

      // 2. Create 3 clients
      const c1 = await db.clients.save({ first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com', membership_tier: 'Pro', join_date: '2026-06-30', is_active: true });
      const c2 = await db.clients.save({ first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com', membership_tier: 'Pro', join_date: '2026-06-30', is_active: true });
      const c3 = await db.clients.save({ first_name: 'Charlie', last_name: 'Brown', email: 'charlie@example.com', membership_tier: 'Pro', join_date: '2026-06-30', is_active: true });

      // 3. Book client 1 (Capacity 1/2)
      const r1 = await bookClassAction({ client_id: c1.id, class_instance_id: instance.id });
      assert.strictEqual(r1.success, true);
      assert.strictEqual(r1.status, 'booked');

      // 4. Book client 2 (Capacity 2/2)
      const r2 = await bookClassAction({ client_id: c2.id, class_instance_id: instance.id });
      assert.strictEqual(r2.success, true);
      assert.strictEqual(r2.status, 'booked');

      // 5. Book client 3 (Capacity 3/2 -> Waitlist)
      const r3 = await bookClassAction({ client_id: c3.id, class_instance_id: instance.id });
      assert.strictEqual(r3.success, true);
      assert.strictEqual(r3.status, 'waitlist');

      // Verify statuses in database
      const bookings = await db.bookings.list();
      assert.strictEqual(bookings.filter(b => b.status === 'booked').length, 2);
      assert.strictEqual(bookings.filter(b => b.status === 'waitlist').length, 1);
    });

    it('should promote the first person on waitlist when a booking is cancelled', async () => {
      clearDB();

      // 1. Setup class with capacity 1
      const classType = await db.classTypes.save({
        name: 'Pilates Reformer',
        duration_minutes: 50,
        capacity: 1,
        price: 40,
        color: '#3b82f6'
      });

      const location = await db.locations.save({ name: 'Pilates Room', timezone: 'UTC' });
      const schedule = await db.classSchedule.save({
        class_type_id: classType.id,
        location_id: location.id,
        start_time: '12:00',
        end_time: '12:50',
        is_recurring: true,
        day_of_week: 3
      });
      const instance = await db.classInstances.save({
        class_schedule_id: schedule.id,
        date: '2026-07-01',
        is_cancelled: false
      });

      // 2. Create 3 clients
      const c1 = await db.clients.save({ first_name: 'Client1', last_name: 'Test', email: 'c1@test.com', membership_tier: 'Starter', join_date: '2026-06-30', is_active: true });
      const c2 = await db.clients.save({ first_name: 'Client2', last_name: 'Test', email: 'c2@test.com', membership_tier: 'Starter', join_date: '2026-06-30', is_active: true });
      const c3 = await db.clients.save({ first_name: 'Client3', last_name: 'Test', email: 'c3@test.com', membership_tier: 'Starter', join_date: '2026-06-30', is_active: true });

      // 3. Book client 1 (gets 'booked')
      const r1 = await bookClassAction({ client_id: c1.id, class_instance_id: instance.id });
      assert.strictEqual(r1.status, 'booked');

      // 4. Book client 2 (gets 'waitlist')
      const r2 = await bookClassAction({ client_id: c2.id, class_instance_id: instance.id });
      assert.strictEqual(r2.status, 'waitlist');

      // 5. Book client 3 (gets 'waitlist')
      const r3 = await bookClassAction({ client_id: c3.id, class_instance_id: instance.id });
      assert.strictEqual(r3.status, 'waitlist');

      // Retrieve bookings
      const bookingsBefore = await db.bookings.list();
      const b1 = bookingsBefore.find(b => b.client_id === c1.id)!;
      const b2 = bookingsBefore.find(b => b.client_id === c2.id)!;
      const b3 = bookingsBefore.find(b => b.client_id === c3.id)!;

      assert.strictEqual(b1.status, 'booked');
      assert.strictEqual(b2.status, 'waitlist');
      assert.strictEqual(b3.status, 'waitlist');

      // 6. Cancel Client 1's booking
      const cancelRes = await cancelBookingAction(b1.id);
      assert.strictEqual(cancelRes.success, true);
      // It should promote Client 2 (first on waitlist)
      assert.strictEqual(cancelRes.promotedClient, c2.id);

      // Verify final states in DB
      const b1_after = await db.bookings.get(b1.id);
      const b2_after = await db.bookings.get(b2.id);
      const b3_after = await db.bookings.get(b3.id);

      assert.strictEqual(b1_after?.status, 'cancelled');
      assert.strictEqual(b2_after?.status, 'booked'); // Promoted!
      assert.strictEqual(b3_after?.status, 'waitlist'); // Still waitlisted
    });
  });

  describe('Staff Hours Log Logic', () => {
    it('should correctly calculate taught class hours (filtering cancelled ones)', () => {
      const instructorId = 'instructor-elena';

      // 1. Set up Class Types
      const ctYoga: ClassType = { id: 'ct-yoga', name: 'Yoga', duration_minutes: 60, capacity: 10, price: 15, color: 'blue' };
      const ctPilates: ClassType = { id: 'ct-pilates', name: 'Pilates', duration_minutes: 45, capacity: 10, price: 15, color: 'red' };

      // 2. Set up Class Schedules taught by Elena
      const schedYoga: ClassSchedule = { id: 's-yoga', class_type_id: ctYoga.id, instructor_id: instructorId, start_time: '09:00', end_time: '10:00', location_id: 'loc-1', is_recurring: true, day_of_week: 1 };
      const schedPilates: ClassSchedule = { id: 's-pilates', class_type_id: ctPilates.id, instructor_id: instructorId, start_time: '11:00', end_time: '11:45', location_id: 'loc-1', is_recurring: true, day_of_week: 2 };

      // 3. Set up Class Instances
      const instances: ClassInstance[] = [
        { id: 'inst-1', class_schedule_id: schedYoga.id, date: '2026-06-29', is_cancelled: false }, // Elena taught (60m)
        { id: 'inst-2', class_schedule_id: schedYoga.id, date: '2026-07-06', is_cancelled: false }, // Elena taught (60m)
        { id: 'inst-3', class_schedule_id: schedPilates.id, date: '2026-06-30', is_cancelled: false }, // Elena taught (45m)
        { id: 'inst-4', class_schedule_id: schedYoga.id, date: '2026-07-13', is_cancelled: true, cancellation_reason: 'Holiday' }, // Cancelled (0m)
        { id: 'inst-other', class_schedule_id: 'other-instructor-sched', date: '2026-06-29', is_cancelled: false } // Other instructor (0m)
      ];

      const schedules = [schedYoga, schedPilates];
      const classTypes = [ctYoga, ctPilates];

      // 4. Calculate total hours Elena taught
      const elenaHours = calculateHoursTaught(instances, schedules, classTypes, instructorId);
      
      // Expected non-cancelled Elena instances: inst-1 (60), inst-2 (60), inst-3 (45) = 165 minutes.
      // 165 / 60 = 2.75 hours, which formatted with toFixed(1) is "2.8".
      assert.strictEqual(elenaHours, '2.8');
    });
  });

  describe('Stripe Billing & Webhook integration', () => {
    it('should fallback to success redirect in checkout GET when API key is missing', async () => {
      // Clear STRIPE_SECRET_KEY to test local/fallback redirection logic
      const originalStripeKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const req = new NextRequest('http://localhost:3000/api/stripe/checkout?lookup_key=price_pro');
      const response = await stripeCheckoutGET(req);

      // Restore key
      if (originalStripeKey) process.env.STRIPE_SECRET_KEY = originalStripeKey;

      assert.strictEqual(response.status, 307);
      const redirectUrl = response.headers.get('Location');
      assert.match(redirectUrl || '', /\/dashboard\/billing\?checkout=success/);
    });

    it('should successfully parse and respond to webhook event type', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            amount_total: 9900
          }
        }
      };

      const req = new Request('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      });

      const response = await stripeWebhookPOST(req);
      assert.strictEqual(response.status, 200);

      const json = await response.json();
      assert.deepStrictEqual(json, { received: true });
    });
  });

  describe('Instructor Shift Overlapping Validation', () => {
    before(() => {
      clearDB();
    });

    it('should enforce schedule conflicts and prevent overlapping schedules', async () => {
      const instructorId = 'inst-alex';
      const classType = await db.classTypes.save({ name: 'Spinning', duration_minutes: 50, capacity: 10, price: 20, color: 'rose' });
      const location = await db.locations.save({ name: 'Main Room', timezone: 'UTC' });

      // 1. Save initial schedule: Monday, 09:00 - 10:00
      const s1 = await saveClassScheduleAction({
        class_type_id: classType.id,
        instructor_id: instructorId,
        location_id: location.id,
        start_time: '09:00',
        end_time: '10:00',
        day_of_week: 1,
        is_recurring: true
      });
      assert.strictEqual(s1.success, true);

      // 2. Try to schedule overlapping slot: Monday, 09:30 - 10:30 (should overlap & fail)
      const s2 = await saveClassScheduleAction({
        class_type_id: classType.id,
        instructor_id: instructorId,
        location_id: location.id,
        start_time: '09:30',
        end_time: '10:30',
        day_of_week: 1,
        is_recurring: true
      });
      assert.strictEqual(s2.success, false);
      assert.match(s2.error || '', /overlapping class schedule/i);

      // 3. Try to schedule back-to-back: Monday, 10:00 - 11:00 (no overlap, should succeed)
      const s3 = await saveClassScheduleAction({
        class_type_id: classType.id,
        instructor_id: instructorId,
        location_id: location.id,
        start_time: '10:00',
        end_time: '11:00',
        day_of_week: 1,
        is_recurring: true
      });
      assert.strictEqual(s3.success, true);

      // 4. Try to schedule same time, but different day: Tuesday, 09:30 - 10:30 (no overlap, should succeed)
      const s4 = await saveClassScheduleAction({
        class_type_id: classType.id,
        instructor_id: instructorId,
        location_id: location.id,
        start_time: '09:30',
        end_time: '10:30',
        day_of_week: 2,
        is_recurring: true
      });
      assert.strictEqual(s4.success, true);

      // 5. Try to schedule same time, same day, but different instructor: Monday, 09:30 - 10:30 (no overlap, should succeed)
      const s5 = await saveClassScheduleAction({
        class_type_id: classType.id,
        instructor_id: 'inst-different',
        location_id: location.id,
        start_time: '09:30',
        end_time: '10:30',
        day_of_week: 1,
        is_recurring: true
      });
      assert.strictEqual(s5.success, true);
    });
  });

});
