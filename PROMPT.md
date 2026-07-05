You are a senior fullstack engineer. Build StudioPilot — a gym/yoga/salon management SaaS — in this Next.js project. YOLO MODE.

PRODUCT: StudioPilot replaces Mindbody at $29/mo flat. Full class scheduling, client management, payments.

READ PLAN.md FIRST. Start with Phase 1. Complete every [ ] task in order. Git commit after each.

DESIGN: Dark theme. Teal accent #14b8a6. Background #09100f. Surface #111a19. Border #1a2e2b.

KEY DB SCHEMA (create supabase/schema.sql):
  profiles, subscriptions (standard)
  locations: id, user_id, name, address, timezone
  clients: id, user_id, first_name, last_name, email, phone, membership_tier, join_date, notes, is_active
  class_types: id, user_id, name, description, duration_minutes, capacity, price, color
  class_schedule: id, class_type_id, instructor_id, start_time, end_time, location_id, is_recurring, day_of_week
  class_instances: id, class_schedule_id, date, is_cancelled, cancellation_reason
  bookings: id, client_id, class_instance_id, status, booked_at, checked_in_at
  staff: id, user_id, name, email, specialties, is_active
  payments: id, client_id, user_id, amount, currency, method, description, paid_at
  memberships: id, client_id, plan_name, price, billing_cycle, start_date, end_date, stripe_subscription_id

Seed: 2 fake locations, 3 class types, 1 week of class schedule, 15 fake clients. Makes the demo immediately useful.

NEVER STOP. PLAN.md drives the work.
