export type MembershipTier = "monthly" | "per_class" | "drop_in";

export interface Client {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  emergency_contact: string | null;
  medical_notes: string | null;
  membership_tier: MembershipTier;
  membership_plan_id: string | null;
  status: "active" | "inactive" | "vip";
  tags: string[];
  last_visit: string | null;
}

export interface MembershipPlan {
  id: string;
  created_at: string;
  name: string;
  tier: MembershipTier;
  price_cents: number;
  interval: "month" | "per_class" | "one_time";
  description: string | null;
  active: boolean;
}

export interface ClientNote {
  id: string;
  created_at: string;
  client_id: string;
  author_id: string;
  content: string;
}

export interface ClassType {
  id: string;
  created_at: string;
  name: string;
  duration_minutes: number;
  capacity: number;
  price_cents: number;
  description: string | null;
  active: boolean;
}

export interface RecurringSchedule {
  id: string;
  created_at: string;
  class_type_id: string;
  staff_id: string | null;
  day_of_week: number;
  start_time: string;
  active: boolean;
}

export interface ScheduledClass {
  id: string;
  created_at: string;
  class_type_id: string;
  staff_id: string | null;
  recurring_schedule_id: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "cancelled" | "completed";
}

export interface Booking {
  id: string;
  created_at: string;
  client_id: string;
  scheduled_class_id: string;
  status: "booked" | "waitlisted" | "checked_in" | "cancelled";
}

export interface Payment {
  id: string;
  created_at: string;
  client_id: string;
  amount_cents: number;
  method: "cash" | "card" | "mpesa" | "stripe" | "bank";
  description: string;
  paid_at: string;
}

export interface Membership {
  id: string;
  created_at: string;
  client_id: string;
  plan_name: string;
  price: number;
  billing_cycle: "monthly" | "quarterly" | "yearly";
  start_date: string;
  end_date: string | null;
  stripe_subscription_id: string | null;
  status: "active" | "canceled" | "expired" | "past_due";
}

export interface Staff {
  id: string;
  created_at: string;
  name: string;
  email: string;
  specialties: string[];
  active: boolean;
}
