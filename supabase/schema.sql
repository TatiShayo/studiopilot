-- StudioPilot Supabase Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (linking to auth.users if needed)
create table if not exists public.profiles (
    id uuid primary key,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    website text
);

-- 2. Locations Table
create table if not exists public.locations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    name text not null,
    address text,
    timezone text default 'UTC' not null,
    created_at timestamp with time zone default now()
);

-- 3. Clients Table
create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    first_name text not null,
    last_name text not null,
    email text not null,
    phone text,
    membership_tier text default 'None' not null, -- 'None', 'Starter', 'Pro', 'Studio', 'VIP'
    join_date timestamp with time zone default now() not null,
    notes text,
    is_active boolean default true not null
);

-- 4. Class Types Table
create table if not exists public.class_types (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    name text not null,
    description text,
    duration_minutes integer default 60 not null,
    capacity integer default 15 not null,
    price numeric(10,2) default 0.00 not null,
    color text default '#14b8a6' not null
);

-- 5. Staff Table
create table if not exists public.staff (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    name text not null,
    email text,
    specialties text, -- e.g., 'Yoga, Pilates, HIIT'
    is_active boolean default true not null,
    created_at timestamp with time zone default now()
);

-- 6. Class Schedule Table (weekly templates)
create table if not exists public.class_schedule (
    id uuid primary key default gen_random_uuid(),
    class_type_id uuid references public.class_types(id) on delete cascade not null,
    instructor_id uuid references public.staff(id) on delete set null,
    start_time text not null, -- e.g., '09:00'
    end_time text not null, -- e.g., '10:00'
    location_id uuid references public.locations(id) on delete cascade not null,
    is_recurring boolean default true not null,
    day_of_week integer not null -- 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
);

-- 7. Class Instances Table (actual schedule dates)
create table if not exists public.class_instances (
    id uuid primary key default gen_random_uuid(),
    class_schedule_id uuid references public.class_schedule(id) on delete cascade not null,
    date date not null, -- e.g., '2026-06-29'
    is_cancelled boolean default false not null,
    cancellation_reason text
);

-- 8. Bookings Table
create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade not null,
    class_instance_id uuid references public.class_instances(id) on delete cascade not null,
    status text default 'booked' not null, -- 'booked', 'waitlist', 'cancelled'
    booked_at timestamp with time zone default now() not null,
    checked_in_at timestamp with time zone
);

-- 9. Payments Table
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade not null,
    user_id uuid,
    amount numeric(10,2) not null,
    currency text default 'USD' not null,
    method text not null, -- 'cash', 'card', 'M-Pesa'
    description text,
    paid_at timestamp with time zone default now() not null
);

-- 10. Memberships Table
create table if not exists public.memberships (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade not null,
    plan_name text not null, -- 'Starter', 'Pro', 'Studio'
    price numeric(10,2) not null,
    billing_cycle text default 'monthly' not null, -- 'monthly', 'yearly'
    start_date date not null,
    end_date date,
    stripe_subscription_id text
);
