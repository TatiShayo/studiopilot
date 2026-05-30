You are continuing StudioPilot. Outstanding balance is built. 13 tasks remain.

═══ CURRENT STATE ═══
15 of 28 tasks done. 13 remaining.
PHASE 4: PAYMENTS — 1 task left
PHASE 5: STAFF — 3 tasks
PHASE 6: TESTING & POLISH — 3 tasks
PHASE 7: ADVANCED — 6 tasks

═══ REMAINING TASKS (build in order) ═══

Task 1: Revenue dashboard at /dashboard/payments
- Add chart section: recharts bar chart showing revenue by month (last 6 months)
- Cards: Today's Revenue, This Week, This Month, This Year (queried from payments table)
- Format: new Intl.NumberFormat('en-KE', {style:'currency', currency:'KES'})

Task 2: Staff profiles at /dashboard/staff
- Grid of staff cards: photo/initials, name, specialties badges, active/inactive toggle
- Add/Edit staff: name, email, phone, specialties (multi-select chips), bio textarea
- Staff schedule: list of classes they're assigned to this week

Task 3: Staff assignment to classes
- When creating/editing class schedule, add instructor_id dropdown (from staff table)
- Class detail page shows instructor name and photo
- Filter schedule by instructor

Task 4: Staff hours log
- Record worked hours: date, hours, rate, notes per staff member
- Table on staff detail page showing hours worked this month

Task 5: Testing & polish
- Unit test: booking logic (no double-book, capacity, waitlist)
- Mobile responsive: all pages work at 375px
- Lighthouse ≥85

═══ RULES ═══
npm run build after every task. Must pass.
git add -A && git commit -m "done: [task]" per task.
Mark [x] in PLAN.md + PROGRESS.md.
Skip after 2 failures. Keep building.

Start with Task 1: Revenue dashboard — last 6 months chart + revenue cards.
