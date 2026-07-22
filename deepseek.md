# studiopilot — DeepSeek Audit

**Date:** 2026-07-13
**Path:** `C:\Users\TATI\Desktop\DEV\studiopilot\`
**Stack:** TypeScript / Next.js 16 + Supabase + Stripe
**Tier:** 2 — High
**Dependencies:** None installed

---

## 🔴 Security Vulnerabilities

| Severity | File | Line(s) | Vulnerability | Exact Fix |
|----------|------|---------|---------------|-----------|
| 🟡 MEDIUM | `src/lib/supabase/server.ts` | — | Service-role key used as fallback when anon key not present — could accidentally expose admin privileges. | Remove fallback. Require explicit service role key only where admin access is needed. |
| ✅ | `src/app/api/stripe/webhook/route.ts` | — | Stripe webhook with signature verification. Good. | — |
| ✅ | `src/app/api/cron/class-reminders/route.ts` | — | CRON_SECRET protected. Good. | — |
| ✅ | `src/app/api/cron/birthday-emails/route.ts` | — | CRON_SECRET protected. Good. | — |

---

## 🟠 Performance Issues

| Severity | File | Line(s) | Issue | Exact Fix |
|----------|------|---------|-------|-----------|
| 🔴 CRITICAL | `src/lib/db.ts` | 147, 168 | `readFileSync` / `writeFileSync` on every DB operation. In serverless (Vercel), writes to filesystem are ephemeral and LOST. Also blocks the Node event loop. | Remove sync file I/O. Use Supabase as primary store even in dev. If mock is needed, use in-memory store (`Map`) with optional periodic async flush. |
| 🟠 HIGH | `src/app/dashboard/actions.ts` | 128-134 | `bookClassAction`: 3 sequential DB lookups (instance → schedule → class type). | Add `getClassContext(instanceId)` that joins all 3 in one query. |
| 🟠 HIGH | `src/app/dashboard/actions.ts` | 178-184 | `cancelBookingAction`: fetches ALL bookings for all classes, then filters in memory for one class instance's waitlist. | Add `listByInstance(classInstanceId)` method with server-side filter. |
| 🟠 HIGH | `src/app/api/payments/outstanding-report/route.ts` | 59-69 | O(n×m): `.filter()` inside a loop over memberships. | Pre-group payments by `client_id` in a `Map` before the loop. |
| 🟡 MEDIUM | `src/app/api/payments/outstanding-report/route.ts` | — | All queries use `select()` — may need pagination for large studios. | Add pagination if studio has 100+ clients. |

---

## 🟡 UI/UX Improvements

| Severity | File | Line(s) | Issue | Exact Fix |
|----------|------|---------|-------|-----------|
| 🟠 HIGH | `src/app/page.tsx` | 18-305 | **62 hardcoded `#14b8a6` / `#09100f` / `#1a2e2b` color values** — brand color and surface colors not tokenized. | Define CSS custom properties: `--color-brand: #14b8a6; --color-bg: #09100f; --color-surface: #1a2e2b; --color-surface-alt: #111a19;`. |
| 🟠 HIGH | `src/app/booking-portal/booking-client.tsx` | 156-340 | Same hardcoded colors repeated. | Use same tokens. |
| 🟠 HIGH | `src/app/dashboard/page.tsx` | 78-229 | Same hardcoded colors. | Use same tokens. |
| 🟡 MEDIUM | `src/components/receipt-pdf.tsx` | 4-15 | Hardcoded colors in receipt PDF. | Reference design tokens. |
| 🟡 MEDIUM | `src/components/outstanding-report-pdf.tsx` | 4-21 | Hardcoded colors in report PDF. | Reference design tokens. |
| ✅ | EVERY route | — | `loading.tsx` + `error.tsx` on EVERY route segment. Dedicated `loading-skeleton` component. **Best in portfolio.** | — |
| ✅ | UI components | — | Skip-to-content link (via shadcn), focus-visible rings. Good. | — |

---

## 🟢 Dependency Audit

| Category | Package | Issue | Fix |
|----------|---------|-------|-----|
| 🟡 MEDIUM | `next 16.2.6`, `react 19.0.0` | Pinned — good. | — |
| 🟡 MEDIUM | `stripe ^22.3.0` | Loose caret — could pull breaking changes. | Pin to exact: `22.3.0` or add upper bound: `^22.3.0 <23`. |
| 🟡 MEDIUM | `supabase ^2.48.0` | Loose caret. | Pin. |
| 🟡 MEDIUM | Dev deps | `^4` on tailwindcss, `^9` on eslint, `^5` on typescript — loose. | Pin to exact. |

### Missing Dev Tooling
- **No test framework** — no vitest, no jest, no @testing-library/react
- **No test script** — has `tsx` but no test runner configured
- No `typecheck` script
- No `.nvmrc`

---

## 📋 Priority Fix Queue

1. **[CRITICAL — Sync I/O]** `src/lib/db.ts:147,168` — Replace `readFileSync`/`writeFileSync` with Supabase client or in-memory `Map` store.
2. **[HIGH — N+1 Booking]** `src/app/dashboard/actions.ts:128-134` — Create `getClassContext(instanceId)` method for joined query.
3. **[HIGH — Memory Filter]** `src/app/dashboard/actions.ts:178-184` — Add `listByInstance(classInstanceId)` with server-side filter instead of fetching all.
4. **[HIGH — O(n×m)]** `src/app/api/payments/outstanding-report/route.ts:59-69` — Pre-group payments in `Map` before loop.
5. **[HIGH — Design Tokens]** Extract 62 hardcoded colors to CSS custom properties in a `theme.css` file.
6. **[MEDIUM — Dependencies]** Pin `stripe` and `supabase` to exact versions. Add vitest + @testing-library/react. Add `typecheck` script.

---

## 🔧 Session: 2026-07-14 — Multi-Agent Deep Audit Sweep (Round 1)

### Security fixes applied

| Severity | Issue | Fix | Files |
|----------|-------|-----|-------|
| 🔴 CRITICAL | Entirely open RLS — all 12 tables used `FOR ALL USING (true)`, any authenticated user could read/write/delete every row | Split into separate policies: SELECT for `auth.role() = 'authenticated'`, INSERT/UPDATE/DELETE restricted to service role. Added comments noting `user_id`/`studio_id` columns needed for proper multi-tenant scoping. | `supabase-schema.sql` (12 tables: studios, clients, membership_plans, client_notes, class_types, scheduled_classes, bookings, payments, memberships, staff, recurring_schedules, staff_hours, waivers) |
| 🟠 HIGH | No security headers configured | Added HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy | `next.config.ts` |

### Artifacts created
- `AUDIT_LOG.md` — full audit trail

---

## 🔧 Session: 2026-07-14 — Round 2: Adversarial, Reduction & Cross-Angle Sweep

### Infrastructure
- Created `src/middleware.ts` — orphaned `proxy.ts` now wired. Auth guard was dead code since project creation.
- Added `@supabase/ssr` to package.json (was imported but undeclared)
- Updated `@supabase/supabase-js` from `^2.48.0` → `^2.106.2` (was 2 generations behind cluster)

---

## 🔧 Session: 2026-07-14 — Round 3: Static Analysis

- **Fixed:** `.gitignore` had unresolved merge conflict (`<<<<<<< HEAD` markers) — rewrote clean.
