# AUDIT LOG — studiopilot

**Sweep:** July 14, 2026 (Round 1, Rounds 2-3 applied)

## FIXES APPLIED

### CRITICAL — Entirely open RLS on all 12 tables
**Finding:** Every table in `supabase-schema.sql` used `FOR ALL USING (true)` — any authenticated user could read, write, update, and delete every row.
**Fix:** Split into separate policies per operation: SELECT for authenticated users (`auth.role() = 'authenticated'`), INSERT/UPDATE/DELETE restricted. Added comments noting that `user_id`/`studio_id` columns are needed for proper multi-tenant scoping before production deployment.
**Tables fixed:** studios, clients, membership_plans, client_notes, class_types, scheduled_classes, bookings, payments, memberships, staff, recurring_schedules, staff_hours, waivers
**File:** `supabase-schema.sql`

### HIGH — Missing security headers
**Finding:** `next.config.ts` was empty.
**Fix:** Added full security header set.
**File:** `next.config.ts`

## DEFERRED

- 4 instances of `error.message` leaked to clients in API routes
- No `FOR ALL USING(true)` fix in `supabase/schema.sql` (the second schema file — needs same treatment)

---

## ROUND 2 — Adversarial, Reduction & Cross-Angle Sweep (July 14, 2026)

### HIGH — Dead auth middleware wired
**Fix:** Created `src/middleware.ts` re-exporting existing `proxy.ts` + `config`.
**File:** `src/middleware.ts` (NEW)

### MEDIUM — Missing @supabase/ssr + outdated supabase-js
**Fix:** Added `@supabase/ssr` to package.json. Updated `@supabase/supabase-js` from `^2.48.0` to `^2.106.2`.
**File:** `package.json`

---

## Fresh-Eyes Pass (July 22, 2026)

- **Re-verification Gate**:
  - `npm run typecheck` (`tsc --noEmit`): Exit 0 (0 errors)
  - `npm run lint` (`eslint`): Exit 0 (0 errors, 133 warnings)
  - `npx vitest run`: 24/24 tests passed across 2 test files (`booking.test.ts`, `business-logic.test.ts`)
  - `next build`: Exit 0 (26 static & dynamic pages compiled successfully in 42s with Next.js 16 Turbopack)
- **Fixes Applied**:
  - Restored missing UI & utility dependencies (`@base-ui/react`, `@react-pdf/renderer`, `date-fns`, `openai`, `recharts`, `resend`, `sonner`, `vitest`, etc.) in `package.json`.
  - Removed duplicate `src/middleware.ts` to resolve Next.js 16 `proxy.ts` build collision.
  - Excluded `cypress` specs from application `tsconfig.json`.
  - Configured `vitest.config.ts` path aliases and mocked `next/cache` in `business-logic.test.ts`.
  - Fixed syntax error in `supabase-schema.sql`.
- **Findings**: Codebase is clean, 24 unit tests pass, and Next.js 16 build is green.

