You are continuing StudioPilot. Staff assignment to classes is built but uncommitted.

═══ FIRST: COMMIT EXISTING WORK ═══
Run: git status --short
If staff assignment photos/filters are uncommitted:
  git add -A && git commit -m "done: Staff assignment - photo URL, instructor filter on schedule"
Then read PLAN.md and mark [x] for:
- Staff assignment to classes (if built)
Then recount: grep -c '\[x\]' PLAN.md

═══ CURRENT STATE ═══
Should be 17 done / 11 remaining after commit.
PHASE 5: STAFF — 1 left (hours log)
PHASE 6: TESTING & POLISH — 4 left
PHASE 7: ADVANCED — 6 left

═══ REMAINING TASKS (build in order) ═══

Task 1: Staff hours log
- Page at /dashboard/staff (hours log section or separate page)
- Table: date, hours worked, rate (KES), notes
- Add hours form: date picker, hours input, rate, notes
- Monthly total hours card

Task 2: Unit tests for booking logic
- npm install -D vitest if not installed
- Tests: no double-booking, capacity enforcement, waitlist
- tests/booking.test.ts

Task 3: E2E — book a class flow
- npm install -D cypress if not installed
- cypress/e2e/booking-flow.cy.ts

Task 4: Mobile responsive
- All pages at 375px: tables → cards, sidebar → bottom nav

Task 5: Lighthouse ≥85 — meta tags, aria, semantic HTML, contrast

Task 6: Advanced features
- AI class description generator at /api/ai/class-description
- Retention alerts: 30+ day inactive clients, "Send Reminder"
- Birthday automation
- Class series packages
- Digital waiver signing

═══ RULES ═══
npm run build after every task. Must pass.
git add -A && git commit -m "done: [task]" per task.
Mark [x] in PLAN.md + PROGRESS.md. Skip after 2 failures.

Start: git status → commit → update PLAN.md → Task 1: Staff hours log.
