You are continuing StudioPilot. Payment recording page is built. 15 tasks remain.

═══ CURRENT STATE ═══
13 of 28 tasks done. 15 remaining.
PHASE 4: PAYMENTS — 3 tasks left
PHASE 5: STAFF — 3 tasks
PHASE 6: TESTING & POLISH — 3 tasks
PHASE 7: ADVANCED — 6 tasks

═══ REMAINING TASKS (build in order) ═══

Task 1: Membership billing — Stripe subscriptions for monthly members
- Create memberships table if not exists: id, client_id, plan_name, price, billing_cycle, start_date, end_date, stripe_subscription_id, status
- Create /api/stripe/checkout route: POST {priceId, clientId} → creates Stripe Checkout Session
- Create /api/webhooks/stripe route: handle checkout.session.completed, subscription.updated/deleted
- Add "Add Membership" button on /dashboard/payments: client selector, plan name, price, billing cycle (Monthly/Quarterly/Yearly), start date
- Memberships tab on payments page: list active memberships, status badges, renewal dates
- Note: in .env.local, STRIPE_SECRET_KEY may be empty — guard the route so build passes (if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({error: 'not configured'}))

Task 2: Outstanding balance — flag clients with overdue payments
- Query: for each client with memberships that have past end_date but status='active', flag as overdue
- Dashboard card: "X clients with overdue payments" with list, "Send Reminder" button per client
- Client detail page: shows outstanding balance, payment history

Task 3: Revenue dashboard at /dashboard/payments
- Add chart section: recharts bar chart showing revenue by month (last 6 months)
- Cards: Today's Revenue, This Week, This Month, This Year (queried from payments table)
- Format: new Intl.NumberFormat('en-KE', {style:'currency', currency:'KES'})

Task 4: Staff profiles at /dashboard/staff
- Grid of staff cards: photo/initials, name, specialties badges, active/inactive toggle
- Add/Edit staff: name, email, phone, specialties (multi-select chips), bio textarea
- Staff schedule: list of classes they're assigned to this week

Task 5: Staff assignment to classes
- When creating/editing class schedule, add instructor_id dropdown (from staff table)
- Class detail page shows instructor name and photo
- Filter schedule by instructor

Task 6: Staff hours log
- Record worked hours: date, hours, rate, notes per staff member
- Table on staff detail page showing hours worked this month

Task 7: Testing & polish
- Unit test: booking logic (no double-book, capacity, waitlist)
- Mobile responsive: all pages work at 375px
- Lighthouse ≥85

═══ RULES ═══
npm run build after every task. Must pass.
git add -A && git commit -m "done: [task]" per task.
Mark [x] in PLAN.md + PROGRESS.md.
Skip after 2 failures. Keep building.

Start with Task 1: Membership billing with Stripe subscriptions.
