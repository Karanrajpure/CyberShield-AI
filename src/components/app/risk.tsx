import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";
import { RISK_LABEL, type RiskLevel } from "@/lib/dashboard-stats";

export const RISK_COLOR: Record<RiskLevel, string> = { low: "var(--success)", suspicious: "var(--warning)", high: "var(--destructive)", unknown: "var(--muted-foreground)" };
const ICON = { low: ShieldCheck, suspicious: ShieldAlert, high: ShieldX, unknown: ShieldQuestion };
export const asRisk = (l: string): RiskLevel => (l in RISK_LABEL ? (l as RiskLevel) : "unknown");

export function RiskBadge({ level }: { level: string }) {
  const l = asRisk(level);
  return <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: RISK_COLOR[l], background: `color-mix(in oklab, ${RISK_COLOR[l]} 15%, transparent)` }}>{RISK_LABEL[l]}</span>;
}

export function RiskHero({ level, score, subtitle }: { level: string; score: number | null; subtitle: string }) {
  const l = asRisk(level);
  const Icon = ICON[l];
  const c = RISK_COLOR[l];
  return (
    <div className="flex items-center gap-4 rounded-2xl p-5" style={{ background: `color-mix(in oklab, ${c} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${c} 35%, transparent)` }}>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${c} 20%, transparent)`, color: c }}><Icon className="h-7 w-7" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold" style={{ color: c }}>{RISK_LABEL[l]}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {score !== null && <div className="text-right"><p className="font-display text-3xl font-bold">{score}</p><p className="text-xs text-muted-foreground">risk / 100</p></div>}
    </div>
  );
}

export function IndicatorList({ items }: { items: { id: string; label: string; severity: string }[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No warning signs detected.</p>;
  const col = (s: string) => (s === "danger" ? "var(--destructive)" : s === "warning" ? "var(--warning)" : "var(--electric)");
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.id} className="flex items-start gap-2.5 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: col(i.severity) }} />{i.label}</li>
      ))}
    </ul>
  );
}
