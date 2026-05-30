You are a senior fullstack engineer finishing StudioPilot — a gym/yoga/salon studio management SaaS for East Africa.

═══ CURRENT STATE ═══
12 of 28 tasks done. In PHASE 4: PAYMENTS.
16 tasks remaining. Schedule view, class types, clients, check-in, and payments are partially built. Need payment recording, membership billing, revenue dashboard, staff management, testing, and polish.

═══ REMAINING TASKS (build in this order) ═══

Task 1: Payment recording at /dashboard/payments
- Form: client selector (dropdown from clients table), amount, currency (KES default), method (Cash/M-Pesa/Card/Bank), description text field, date picker
- Insert into payments table on submit
- Show recent transactions table below: date, client, amount, method, description
- Running total: "Total Revenue This Month: KES X" card at top

Task 2: Membership billing
- Memberships tab on /dashboard/payments: list of all active memberships, client name, plan_name, price, start/end dates, status badge
- Create memberships table if missing: id, client_id, plan_name, price, billing_cycle, start_date, end_date, stripe_subscription_id, status
- "Add Membership" button: client selector, plan name, price, billing cycle (Monthly/Quarterly/Yearly), start date
- Stripe subscription integration: create /api/stripe/checkout with price IDs, webhook for subscription events

Task 3: Revenue dashboard
- /dashboard/payments gets chart section: bar chart (recharts) showing revenue by month for last 6 months
- Cards: Today's Revenue, This Week, This Month, This Year (all calculated from payments table)
- Currency format: new Intl.NumberFormat('en-KE', {style:'currency', currency:'KES'})

Task 4: Staff management at /dashboard/staff
- Staff cards grid: photo/initials, full_name, specialties badges, active/inactive toggle
- Add/edit staff: name, email, phone, specialties (multi-select chips), bio textarea
- Staff schedule view: list of classes they're assigned to this week
- Hours log: record worked hours per staff member (date, hours, rate, notes)

Task 5: Staff assignment to classes
- When creating/editing class schedule, add instructor_id dropdown (from staff table)
- Class detail page shows instructor name and photo
- Filter schedule by instructor

Task 6: Testing & polish
- Unit test for booking logic: test that you can't double-book a client, capacity is enforced, waitlist works
- Mobile responsive: all dashboard pages must work at 375px width (use tailwind responsive classes)
- Lighthouse audit: fix to ≥85 performance/accessibility/best-practices

Task 7: Additional features
- AI class description generator at /api/ai/class-description: input className, duration, level → output engaging 2-3 sentence description
- Retention alerts: query clients who haven't booked in 30+ days, show in dashboard card with "Send Reminder" buttons
- Birthday automation: check clients whose birthday is today, send automated email via Resend
- Class series packages: "10-class pack" membership type with expiry date

Task 8: Digital waiver signing
- Waiver page at /waiver/[clientId]: liability waiver text, "I agree" signature (type name as signature)
- Store signed_at timestamp on clients table

═══ DESIGN ═══
Dark theme: bg #09100f, surface #111a19, border #1a2e2b, teal accent #14b8a6.
Class colors: stored per class_type (teal, orange, purple, blue, pink, red).
Client status: green dot=active, yellow=at risk, gray=inactive.
All amounts in KES format. /dashboard uses sidebar nav.

═══ RULES ═══
npm run build after every task — must pass. Fix all tsc errors.
git add -A && git commit -m "done: [task]" per task.
Mark [x] in PLAN.md + append to PROGRESS.md.
Skip any task that fails twice, write to LEARNINGS.md, move on.
No questions. Keep building.

Start with Task 1: Payment recording page.
