     1|## StudioPilot Build Plan
     2|
     3|## PHASE 1: STABILIZE
     4|- [x] Build passes clean, auth works, middleware protects dashboard
     5|
     6|## PHASE 2: CLIENT MANAGEMENT
     7|- [x] Landing page: hero, features (class scheduling, client profiles, payments, staff), vs Mindbody comparison
     8|- [x] Client list: searchable, with tags (active/inactive/vip), membership status, last visit
     9|- [x] Add/edit client: name, email, phone, emergency contact, medical notes, membership tier
    10|- [x] Client profile: visit history, class attendance, payment history, notes timeline
    11|- [x] Membership plans: create plans (monthly flat, per-class, drop-in), assign to clients
    12|
    13|## PHASE 3: CLASS SCHEDULING
    14|- [x] Class types: create (yoga, spin, HIIT etc.) with duration, capacity, price
    15|- [x] Class schedule: weekly recurring schedule (Mon 9am Yoga, etc.)
    16|- [x] Class detail: who's booked, waitlist, check-in button
    17|- [x] Client booking: clients can book classes via their portal link
    18|- [x] Waitlist: automatic promotion when spot opens
    19|- [x] Class cancellation: notify booked clients via email
    20|
    21|## PHASE 4: PAYMENTS
    22|- [x] Payment recording: log cash/card/M-Pesa payment per client
    23|- [x] Membership billing: Stripe subscriptions for monthly members
    24|- [x] Outstanding balance: flag clients with overdue payments
    25|- [x] Revenue dashboard: daily/weekly/monthly revenue chart
    26|
    27|## PHASE 5: STAFF
    28|- [x] Staff profiles: name, specialties, schedule
    29|- [x] Staff assignment to classes
    30|- [x] Staff hours log
    31|
    32|## PHASE 6: TESTING & POLISH
    33|- [x] Unit tests for booking logic (no double-booking, capacity enforcement)
    34|- [x] E2e: book a class flow
    35|- [x] Mobile responsive (owners check stats on phone)
    36|- [x] Lighthouse ≥85
    37|
    38|## PHASE 7: ADVANCED
    39|- [x] Automated birthday emails to clients
    40|- [x] Class series packages (10-class pack)
    41|- [x] AI class description generator
    42|- [x] Retention alerts: flag clients who haven't visited in 30 days
    43|- [x] Digital waiver signing: clients sign liability waiver online before first class
    44|

## PHASE 7: PRODUCTION HARDENING
- [x] npm run build: zero errors, zero warnings
- [x] npx tsc --noEmit: zero errors
- [x] Add loading.tsx to every dashboard route
- [x] Add error.tsx to every dashboard route with a helpful "Something went wrong" UI
- [x] Add robots.txt and sitemap.xml
- [x] All API routes: add Zod validation on request bodies
- [x] All money amounts: use Intl.NumberFormat KES formatting consistently (never raw numbers)
- [x] Mobile audit: test every page at 375px — the schedule and check-in pages MUST work on phone
- [x] Add Open Graph tags to landing page

## PHASE 8: CLASS BOOKING ENGINE COMPLETION
- [x] Public client portal /portal/[studioSlug]: finish and test full booking flow end-to-end
- [x] Waitlist promotion: when a booking is cancelled, auto-promote first waitlisted client and send email
- [ ] Booking confirmation email (Resend): sends to client immediately after booking — include class name, date, time, instructor, location, cancel link
- [ ] Class reminder email: 24 hours before class, send reminder to all booked clients
  Implement as: API route /api/cron/class-reminders that queries class_instances WHERE instance_date = tomorrow
- [ ] Class cancellation flow: cancel button on class detail → emails ALL booked clients with apology + reschedule link
- [ ] Add to Calendar link in booking confirmation: Google Calendar URL + .ics download

## PHASE 9: PAYMENT SYSTEM COMPLETION
- [ ] Stripe membership subscriptions: create Stripe Products for each membership tier in dashboard
- [ ] Membership billing: when client signs up for monthly membership → create Stripe Subscription → webhook updates memberships table
- [ ] Failed payment handling: webhook on invoice.payment_failed → mark membership as overdue → alert in dashboard
- [ ] M-Pesa payment recording: manual entry with phone number field, transaction reference — store payment_method='mpesa' in payments table
- [ ] Receipt generation: "Send Receipt" button on any payment → generates PDF receipt via react-pdf → emails to client
- [ ] Outstanding balance report: PDF of all clients with unpaid dues — print-ready for collections

## PHASE 10: CLIENT RETENTION SYSTEM
- [ ] Retention score per client: formula = (visits_last_30d / avg_visits_per_30d) * 100
- [ ] "At Risk" badge: clients with retention score < 40 automatically tagged
- [ ] Automated win-back email: one-click "Send win-back email" on at-risk client → AI generates personalized message → sends via Resend
- [ ] Birthday tracker: clients.date_of_birth field → dashboard shows "3 clients have birthdays this week" → one-click birthday email
- [ ] Visit milestone badges: 10th visit, 50th visit, 100th visit → automatic congratulations email

## PHASE 11: STAFF AND REPORTING
- [ ] Staff performance: bookings per instructor per month (bar chart)
- [ ] Class fill rate: avg % capacity used per class type (shows which classes to add more of)
- [ ] Peak hours heatmap: 7-day x 24-hour grid colored by booking density
- [ ] Monthly revenue report PDF: cover page + revenue chart + top classes + top clients — exportable
- [ ] Staff payroll stub: hours logged x hourly rate = payout amount per staff member per month

## PHASE 12: LAUNCH PREP
- [ ] Seed data makes immediate sense: "Amani Wellness Studio" demo with real-looking data
- [ ] Write unit tests: booking capacity check (no overbooking), waitlist promotion logic
- [ ] Write e2e: signup → create class type → set schedule → book via client portal
- [ ] README.md + DEPLOY.md (setup, Supabase, Stripe, deploy to Vercel)
- [ ] Pricing page: make sure Stripe checkout links work for all 3 tiers
- [ ] Add "Import from Mindbody" notice on landing: "Migration assistance available — contact us"

## PHASE 8: CLASS BOOKING ENGINE COMPLETION
- [ ] Public client portal /portal/[studioSlug]: finish and test full booking flow end-to-end
- [ ] Waitlist promotion: when a booking is cancelled, auto-promote first waitlisted client and send email
- [ ] Booking confirmation email (Resend): sends to client immediately after booking — include class name, date, time, instructor, location, cancel link
- [ ] Class reminder email: 24 hours before class, send reminder to all booked clients
  Implement as: API route /api/cron/class-reminders that queries class_instances WHERE instance_date = tomorrow
- [ ] Class cancellation flow: cancel button on class detail → emails ALL booked clients with apology + reschedule link
- [ ] Add to Calendar link in booking confirmation: Google Calendar URL + .ics download

## PHASE 9: PAYMENT SYSTEM COMPLETION
- [ ] Stripe membership subscriptions: create Stripe Products for each membership tier in dashboard
- [ ] Membership billing: when client signs up for monthly membership → create Stripe Subscription → webhook updates memberships table
- [ ] Failed payment handling: webhook on invoice.payment_failed → mark membership as overdue → alert in dashboard
- [ ] M-Pesa payment recording: manual entry with phone number field, transaction reference — store payment_method='mpesa' in payments table
- [ ] Receipt generation: "Send Receipt" button on any payment → generates PDF receipt via @react-pdf/renderer → emails to client
- [ ] Outstanding balance report: PDF of all clients with unpaid dues — print-ready for collections

## PHASE 10: CLIENT RETENTION SYSTEM
- [ ] Retention score per client: formula = (visits_last_30d / avg_visits_per_30d) × 100
- [ ] "At Risk" badge: clients with retention score < 40 automatically tagged
- [ ] Automated win-back email: one-click "Send win-back email" on at-risk client → AI generates personalized message → sends via Resend
- [ ] Birthday tracker: clients.date_of_birth field → dashboard shows "3 clients have birthdays this week" → one-click birthday email
- [ ] Visit milestone badges: 10th visit, 50th visit, 100th visit → automatic congratulations email

## PHASE 11: STAFF & REPORTING
- [ ] Staff performance: bookings per instructor per month (bar chart)
- [ ] Class fill rate: avg % capacity used per class type (shows which classes to add more of)
- [ ] Peak hours heatmap: 7-day × 24-hour grid colored by booking density
- [ ] Monthly revenue report PDF: cover page + revenue chart + top classes + top clients — exportable
- [ ] Staff payroll stub: hours logged × hourly rate = payout amount per staff member per month

## PHASE 12: LAUNCH PREP
- [ ] Seed data makes immediate sense: "Amani Wellness Studio" demo with real-looking data
- [ ] Write unit tests: booking capacity check (no overbooking), waitlist promotion logic
- [ ] Write e2e: signup → create class type → set schedule → book via client portal
- [ ] README.md + DEPLOY.md (setup, Supabase, Stripe, deploy to Vercel)
- [ ] Pricing page: make sure Stripe checkout links work for all 3 tiers
- [ ] Add "Import from Mindbody" notice on landing: "Migration assistance available — contact us"
