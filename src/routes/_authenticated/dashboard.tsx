import { NotificationBanners } from "@/components/app/NotificationBanners";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link2, MailWarning, Bot, Lock, FileText, ShieldQuestion, Settings, AlertTriangle, MessageSquareText, CheckCircle2, Circle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { getSupabase } from "@/lib/workspace-client";
import { profileQuery } from "@/lib/profile";
import { dashboardQuery } from "@/lib/dashboard-query";
import { riskDistribution, weeklyActivity, scoreStatus, RISK_LABEL, type RiskLevel } from "@/lib/dashboard-stats";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – CyberShield AI" },
      { name: "description", content: "Your personal security overview." },
      { property: "og:title", content: "Dashboard – CyberShield AI" },
      { property: "og:description", content: "Your personal security overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(profileQuery(context.user.id)),
    context.queryClient.ensureQueryData(dashboardQuery(context.user.id)),
  ]),
  errorComponent: DashError,
  component: Dashboard,
});

function DashError() {
  const router = useRouter();
  return (
    <div className="surface rounded-3xl p-8 text-center">
      <p className="font-semibold">We couldn't load your dashboard.</p>
      <Button variant="hero" className="mt-4" onClick={() => router.invalidate()}>Try again</Button>
    </div>
  );
}

const RISK_COLOR: Record<RiskLevel, string> = { low: "var(--success)", suspicious: "var(--warning)", high: "var(--destructive)", unknown: "var(--muted-foreground)" };
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
const fmt = (s: string) => new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function RiskBadge({ level }: { level: string }) {
  const l = (level in RISK_LABEL ? level : "unknown") as RiskLevel;
  return <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: RISK_COLOR[l], background: `color-mix(in oklab, ${RISK_COLOR[l]} 15%, transparent)` }}>{RISK_LABEL[l]}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full min-h-40 place-items-center rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const { data } = useSuspenseQuery(dashboardQuery(user.id));
  const name = profile?.full_name?.split(" ")[0] || user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const latest = data.scores.at(-1)?.score ?? null;
  const status = scoreStatus(latest);
  const toneColor = { success: "var(--success)", warning: "var(--warning)", destructive: "var(--destructive)", muted: "var(--muted-foreground)" }[status.tone];
  const allScans = [...data.urls.map((u) => ({ risk_level: u.risk_level, at: u.scanned_at })), ...data.msgs.map((m) => ({ risk_level: m.risk_level, at: m.created_at }))];
  const dist = riskDistribution(allScans);
  const distTotal = dist.reduce((s, d) => s + d.value, 0);
  const weekly = weeklyActivity(data.urls.map((u) => ({ risk_level: u.risk_level, at: u.scanned_at })), data.msgs.map((m) => ({ risk_level: m.risk_level, at: m.created_at })));
  const weeklyTotal = weekly.reduce((s, d) => s + d.urls + d.messages, 0);
  const history = data.scores.map((s) => ({ date: new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), score: s.score }));
  const openRecs = data.recs.filter((r) => !r.completed);

  const stats = [
    { label: "Total URLs scanned", value: data.totals.urls, icon: Link2, c: "text-electric" },
    { label: "Suspicious URLs found", value: data.totals.suspicious, icon: AlertTriangle, c: "text-warning" },
    { label: "Messages analysed", value: data.totals.messages, icon: MessageSquareText, c: "text-primary" },
    { label: "Recommendations completed", value: data.totals.done, icon: CheckCircle2, c: "text-success" },
  ];
  const actions = [
    { icon: Link2, label: "Scan a URL", to: "/url-scanner" as const }, { icon: MailWarning, label: "Analyse an email", to: "/phishing" as const },
    { icon: Bot, label: "Ask AI", to: "/assistant" as const }, { icon: Lock, label: "Check privacy", to: "/privacy" as const }, { icon: FileText, label: "Security report", to: "/reports" as const },
  ];

  async function toggleRec(id: string, completed: boolean) {
    const { error } = await getSupabase().from("recommendations").update({ completed }).eq("id", id);
    if (error) { toast.error("Couldn't update recommendation."); return; }
    await qc.invalidateQueries({ queryKey: ["dashboard", user.id] });
  }

  const circ = 2 * Math.PI * 42;

  return (
    <div className="space-y-6">
      <NotificationBanners prefs={profile?.notification_prefs} lastAssessed={data.scores.at(-1)?.created_at ?? null} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{greeting()}, <span className="text-gradient-brand">{name}</span></h1>
          </div>
        </div>
        <Link to="/settings" className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm hover:bg-accent">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-brand font-semibold text-primary-foreground">
            {(name ?? "U")[0]?.toUpperCase()}
          </span>
          <span className="max-w-40 truncate">{user.email}</span>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="surface rounded-3xl p-6">
          <p className="text-sm text-muted-foreground">Security score</p>
          <div className="relative mx-auto my-5 grid h-40 w-40 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="9" />
              {latest !== null && <circle cx="50" cy="50" r="42" fill="none" stroke={toneColor} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - latest / 100)} className="transition-all duration-700" />}
            </svg>
            {latest === null ? <ShieldQuestion className="h-10 w-10 text-muted-foreground" /> :
              <div className="text-center"><span className="font-display text-4xl font-bold">{latest}</span><span className="text-sm text-muted-foreground">/100</span></div>}
          </div>
          <p className="text-center font-semibold" style={{ color: toneColor }}>{status.label}</p>
          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {latest === null ? <p className="text-center">Your score comes from your own privacy assessment — never estimated.</p>
              : openRecs.length ? openRecs.slice(0, 3).map((r) => <p key={r.id}>• {r.title}</p>)
              : <p className="text-center">No open suggestions. Keep it up.</p>}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:col-span-2">
          {stats.map((s) => (
            <div key={s.label} className="surface rounded-2xl p-5">
              <s.icon className={`h-5 w-5 ${s.c}`} />
              <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface rounded-3xl p-6">
          <h2 className="font-semibold">Weekly security activity</h2>
          <div className="mt-4 h-56">
            {weeklyTotal === 0 ? <Empty>No scans in the last 7 days.</Empty> : (
              <ResponsiveContainer><BarChart data={weekly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="urls" name="URL scans" stackId="a" fill="var(--electric)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="messages" name="Messages" stackId="a" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart></ResponsiveContainer>)}
          </div>
        </section>

        <section className="surface rounded-3xl p-6">
          <h2 className="font-semibold">Risk distribution <span className="text-xs font-normal text-muted-foreground">· last 90 days</span></h2>
          <div className="mt-4 h-56">
            {distTotal === 0 ? <Empty>No scan results yet.</Empty> : (
              <div className="flex h-full items-center gap-4">
                <ResponsiveContainer width="55%"><PieChart>
                  <Pie data={dist} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} stroke="none">
                    {dist.map((d) => <Cell key={d.level} fill={RISK_COLOR[d.level]} />)}
                  </Pie><Tooltip contentStyle={tooltipStyle} />
                </PieChart></ResponsiveContainer>
                <ul className="space-y-2 text-sm">{dist.map((d) => <li key={d.level} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR[d.level] }} />{d.name}<span className="text-muted-foreground">{d.value}</span></li>)}</ul>
              </div>)}
          </div>
        </section>

        <section className="surface rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-semibold">Security score history</h2>
          <div className="mt-4 h-56">
            {history.length < 2 ? <Empty>{history.length ? "Complete another assessment to see your trend." : "No assessments yet."}</Empty> : (
              <ResponsiveContainer><AreaChart data={history}>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area dataKey="score" stroke="var(--primary)" strokeWidth={2} fill="url(#sg)" />
              </AreaChart></ResponsiveContainer>)}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="surface rounded-3xl p-6">
          <h2 className="font-semibold">Latest URL scans</h2>
          <ul className="mt-4 space-y-3">
            {data.urls.length === 0 ? <Empty>No URLs scanned yet.</Empty> : data.urls.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{u.domain}</p><p className="text-xs text-muted-foreground">{fmt(u.scanned_at)}</p></div>
                <RiskBadge level={u.risk_level} />
              </li>))}
          </ul>
        </section>
        <section className="surface rounded-3xl p-6">
          <h2 className="font-semibold">Latest phishing analyses</h2>
          <ul className="mt-4 space-y-3">
            {data.msgs.length === 0 ? <Empty>No messages analysed yet.</Empty> : data.msgs.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <div><p className="font-medium capitalize">{m.content_type}</p><p className="text-xs text-muted-foreground">{fmt(m.created_at)}</p></div>
                <RiskBadge level={m.risk_level} />
              </li>))}
          </ul>
        </section>
        <section className="surface rounded-3xl p-6">
          <h2 className="font-semibold">Recommendations</h2>
          <ul className="mt-4 space-y-2">
            {data.recs.length === 0 ? <Empty>Recommendations appear after your first assessment.</Empty> : data.recs.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Button variant="ghost" onClick={() => toggleRec(r.id, !r.completed)} className="h-auto w-full items-start justify-start whitespace-normal rounded-xl p-2 text-left text-sm">
                  {r.completed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className={r.completed ? "text-muted-foreground line-through" : ""}>{r.title}</span>
                </Button>
              </li>))}
          </ul>
        </section>
      </div>

      <section className="surface rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map((a) => (
            <Link key={a.label} to={a.to} className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-primary/5 p-4 text-sm transition hover:border-primary/50 hover:bg-primary/10">
              <a.icon className="h-5 w-5 text-primary" />{a.label}<span className="text-[10px] uppercase tracking-wide text-muted-foreground">Open</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
