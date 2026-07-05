Build the Client Retention System for StudioPilot.

You are a senior fullstack engineer. Read existing code patterns and build exactly what follows.

═══ CURRENT STATE ═══
Build passes. Client management, class scheduling, payments, staff management all complete.

═══ TASKS ═══

Task 1: Retention score calculator
File: src/lib/retention.ts (new)
Function: calculateRetentionScore(clientId, visitsLast30d, avgVisitsPer30d) → score 0-100. Formula: (visits_last_30d / avg_visits_per_30d) × 100. Clamp to 0-100. Add client retention_score field via migration SQL comment.

Task 2: Client retention dashboard section
File: src/app/dashboard/retention/page.tsx (new page)
Server component. Fetches all clients with their visit stats. Shows:
- Header: "Client Retention" with at-risk count badge (red)
- Cards grid: each client card shows name, retention score as progress bar (red <40, amber 40-70, green >70), last visit date, "At Risk" badge if score <40
- Sortable: by retention score ascending (worst first)

Task 3: Win-back email system
File: src/app/api/retention/win-back/route.ts (new API route)
POST handler. Takes contactId. Generates personalized win-back email using AI or template: "Hi {name}, we've missed you! Come back and book a class." Sends via Resend. Returns {sent: true}. Also creates activity log entry.

Task 4: Birthday tracker
File: src/app/dashboard/retention/_components/birthday-tracker.tsx (new)
"use client". Shows "X clients have birthdays this week" with list of names + dates. "Send Birthday Email" button per client sends a birthday greeting via Resend. Clean card design with 🎂 emoji in the header.

═══ DESIGN ═══
Blue primary (#3b82f6), amber for medium retention, red for at-risk.
Card components per section. Mobile-first CSS.
Use existing shadcn components.

═══ RULES ═══
Output COMPLETE file contents. npm run build must pass. Create all 4 files.
