## StudioPilot Build Plan

## PHASE 1: STABILIZE
- [x] Build passes clean, auth works, middleware protects dashboard

## PHASE 2: CLIENT MANAGEMENT
- [x] Landing page: hero, features (class scheduling, client profiles, payments, staff), vs Mindbody comparison
- [x] Client list: searchable, with tags (active/inactive/vip), membership status, last visit
- [x] Add/edit client: name, email, phone, emergency contact, medical notes, membership tier
- [x] Client profile: visit history, class attendance, payment history, notes timeline
- [x] Membership plans: create plans (monthly flat, per-class, drop-in), assign to clients

## PHASE 3: CLASS SCHEDULING
- [x] Class types: create (yoga, spin, HIIT etc.) with duration, capacity, price
- [x] Class schedule: weekly recurring schedule (Mon 9am Yoga, etc.)
- [x] Class detail: who's booked, waitlist, check-in button
- [x] Client booking: clients can book classes via their portal link
- [x] Waitlist: automatic promotion when spot opens
- [x] Class cancellation: notify booked clients via email

## PHASE 4: PAYMENTS
- [x] Payment recording: log cash/card/M-Pesa payment per client
- [x] Membership billing: Stripe subscriptions for monthly members
- [x] Outstanding balance: flag clients with overdue payments
- [x] Revenue dashboard: daily/weekly/monthly revenue chart

## PHASE 5: STAFF
- [x] Staff profiles: name, specialties, schedule
- [x] Staff assignment to classes
- [x] Staff hours log

## PHASE 6: TESTING & POLISH
- [x] Unit tests for booking logic (no double-booking, capacity enforcement)
- [x] E2e: book a class flow
- [x] Mobile responsive (owners check stats on phone)
- [x] Lighthouse ≥85

## PHASE 7: ADVANCED
- [x] Automated birthday emails to clients
- [x] Class series packages (10-class pack)
- [ ] AI class description generator
- [ ] Retention alerts: flag clients who haven't visited in 30 days
- [ ] Digital waiver signing: clients sign liability waiver online before first class
