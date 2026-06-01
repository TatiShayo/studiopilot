/**
 * Retention Score Formula:
 * (visits_last_30d / avg_visits_per_30d) * 100
 * Clamped to 0-100.
 *
 * SQL Migration:
 * ALTER TABLE clients ADD COLUMN retention_score INTEGER DEFAULT 0;
 */

export function calculateRetentionScore(
  clientId: string,
  visitsLast30d: number,
  avgVisitsPer30d: number
): number {
  if (avgVisitsPer30d <= 0) {
    return visitsLast30d > 0 ? 100 : 0;
  }
  const score = (visitsLast30d / avgVisitsPer30d) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}
