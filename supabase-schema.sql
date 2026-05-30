-- StudioPilot Database Schema
-- Run this in Supabase SQL Editor to set up your tables

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL DEFAULT '',
  emergency_contact text,
  medical_notes text,
  membership_tier text NOT NULL CHECK (membership_tier IN ('monthly', 'per_class', 'drop_in')),
  membership_plan_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vip')),
  tags text[] DEFAULT '{}',
  last_visit timestamptz,
  birth_date date,
  class_credits integer NOT NULL DEFAULT 0
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage clients" ON clients
  FOR ALL USING (true);

-- Membership plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('monthly', 'per_class', 'drop_in')),
  price_cents integer NOT NULL DEFAULT 0,
  interval text NOT NULL CHECK (interval IN ('month', 'per_class', 'one_time')),
  description text,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage plans" ON membership_plans
  FOR ALL USING (true);

-- Client notes
CREATE TABLE IF NOT EXISTS client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL
);

ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage notes" ON client_notes
  FOR ALL USING (true);

-- Class types
CREATE TABLE IF NOT EXISTS class_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  capacity integer NOT NULL DEFAULT 20,
  price_cents integer NOT NULL DEFAULT 0,
  description text,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage class types" ON class_types
  FOR ALL USING (true);

-- Scheduled classes
CREATE TABLE IF NOT EXISTS scheduled_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  class_type_id uuid NOT NULL REFERENCES class_types(id),
  staff_id uuid,
  recurring_schedule_id uuid REFERENCES recurring_schedules(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed'))
);

ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage classes" ON scheduled_classes
  FOR ALL USING (true);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_class_id uuid NOT NULL REFERENCES scheduled_classes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'waitlisted', 'checked_in', 'cancelled')),
  UNIQUE(client_id, scheduled_class_id)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage bookings" ON bookings
  FOR ALL USING (true);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  method text NOT NULL CHECK (method IN ('cash', 'card', 'mpesa', 'stripe', 'bank')),
  description text NOT NULL DEFAULT '',
  paid_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage payments" ON payments
  FOR ALL USING (true);

-- Memberships (Stripe subscriptions + manual)
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due'))
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage memberships" ON memberships
  FOR ALL USING (true);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL DEFAULT '',
  specialties text[] DEFAULT '{}',
  bio text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage staff" ON staff
  FOR ALL USING (true);

-- Add phone and bio columns to staff table if they don't exist (migration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'phone') THEN
    ALTER TABLE staff ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'bio') THEN
    ALTER TABLE staff ADD COLUMN bio text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Recurring schedules (weekly class patterns)
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  class_type_id uuid NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(class_type_id, day_of_week, start_time)
);

ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage recurring schedules" ON recurring_schedules
  FOR ALL USING (true);

-- Staff hours log
CREATE TABLE IF NOT EXISTS staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours numeric(4,1) NOT NULL CHECK (hours > 0),
  rate_kes integer NOT NULL DEFAULT 0,
  notes text DEFAULT ''
);

ALTER TABLE staff_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners can manage staff hours" ON staff_hours
  FOR ALL USING (true);

-- Digital waivers signed by clients before first class
CREATE TABLE IF NOT EXISTS waivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  signed_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  waiver_text text NOT NULL DEFAULT 'I hereby release the studio from any liability for injuries sustained during classes. I confirm I am physically able to participate and will inform the instructor of any limitations.',
  accepted boolean NOT NULL DEFAULT true,
  UNIQUE(client_id)
);

ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert waivers" ON waivers
  FOR INSERT USING (true);
CREATE POLICY "Studio owners can view waivers" ON waivers
  FOR SELECT USING (true);
