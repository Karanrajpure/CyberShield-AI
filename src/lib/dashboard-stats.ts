export type RiskLevel = "low" | "suspicious" | "high" | "unknown";
export type ScanRow = { risk_level: string; at: string };

export const RISK_LABEL: Record<RiskLevel, string> = { low: "Low Risk", suspicious: "Suspicious", high: "High Risk", unknown: "Unknown" };

export function riskDistribution(rows: ScanRow[]) {
  const counts: Record<RiskLevel, number> = { low: 0, suspicious: 0, high: 0, unknown: 0 };
  for (const r of rows) if (r.risk_level in counts) counts[r.risk_level as RiskLevel]++;
  return (Object.keys(counts) as RiskLevel[]).map((k) => ({ level: k, name: RISK_LABEL[k], value: counts[k] }));
}

/** Counts per day for the 7 days ending `now` (inclusive), oldest first. */
export function weeklyActivity(urls: ScanRow[], msgs: ScanRow[], now = new Date()) {
  const days: { key: string; day: string; urls: number; messages: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    days.push({ key: d.toDateString(), day: d.toLocaleDateString(undefined, { weekday: "short" }), urls: 0, messages: 0 });
  }
  const idx = new Map(days.map((d, i) => [d.key, i]));
  for (const r of urls) { const i = idx.get(new Date(r.at).toDateString()); if (i !== undefined) days[i]!.urls++; }
  for (const r of msgs) { const i = idx.get(new Date(r.at).toDateString()); if (i !== undefined) days[i]!.messages++; }
  return days.map(({ key: _k, ...rest }) => rest);
}

export function scoreStatus(score: number | null) {
  if (score === null) return { label: "Not assessed yet", tone: "muted" as const };
  if (score >= 80) return { label: "Strong", tone: "success" as const };
  if (score >= 50) return { label: "Needs attention", tone: "warning" as const };
  return { label: "At risk", tone: "destructive" as const };
}

export const isFlagged = (l: string) => l === "suspicious" || l === "high";
