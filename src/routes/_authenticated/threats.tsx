import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { getSupabase } from "@/lib/workspace-client";
import { refreshThreatIntel } from "@/lib/intel.functions";
import { Button } from "@/components/ui/button";

const alertsQuery = queryOptions({
  queryKey: ["threat_alerts"],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("threat_alerts").select("*").order("published_at", { ascending: false }).limit(40);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/threats")({
  head: () => ({ meta: [
    { title: "Threat Intelligence – CyberShield AI" }, { name: "description", content: "Actively exploited vulnerabilities and security advisories from trusted sources." },
    { property: "og:title", content: "Threat Intelligence – CyberShield AI" }, { property: "og:description", content: "Real security advisories." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(alertsQuery),
  component: Threats,
});

const SEV: Record<string, string> = { critical: "var(--destructive)", high: "var(--warning)", medium: "var(--electric)", low: "var(--success)", unknown: "var(--muted-foreground)" };

function Threats() {
  const qc = useQueryClient();
  const refresh = useServerFn(refreshThreatIntel);
  const { data: alerts } = useSuspenseQuery(alertsQuery);
  const [state, setState] = useState<"idle" | "loading" | "unavailable">("idle");

  async function run() {
    setState("loading");
    try {
      const r = await refresh();
      setState(r.status === "unavailable" ? "unavailable" : "idle");
    } catch { setState("unavailable"); }
    qc.invalidateQueries({ queryKey: ["threat_alerts"] });
  }
  useEffect(() => { void run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lastSync = alerts.reduce<string | null>((m, a) => (!m || a.fetched_at > m ? a.fetched_at : m), null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Threat Intelligence</h1>
          <p className="mt-1 text-muted-foreground">Actively exploited vulnerabilities from the U.S. CISA catalogue.{lastSync && ` Synced ${new Date(lastSync).toLocaleString()}.`}</p></div>
        <Button variant="glass" onClick={run} disabled={state === "loading"}><RefreshCw className={state === "loading" ? "animate-spin" : ""} /> Refresh</Button>
      </div>

      {state === "unavailable" && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p>The threat feed is unavailable right now. {alerts.length ? "Showing the last alerts we received." : "No alerts can be shown until it's reachable again."}</p>
        </div>
      )}

      <div className="surface rounded-3xl p-5">
        <h2 className="font-semibold">Everyday protection tips</h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• Turn on automatic updates for your phone, browser and apps.</li>
          <li>• Restart devices weekly so security patches install.</li>
          <li>• Remove apps and browser extensions you no longer use.</li>
          <li>• Treat unexpected "urgent" messages as suspicious until verified.</li>
        </ul>
      </div>

      {alerts.length === 0 && state !== "unavailable" && <p className="surface rounded-3xl p-10 text-center text-sm text-muted-foreground">{state === "loading" ? "Loading the latest alerts…" : "No alerts yet."}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {alerts.map((a) => (
          <article key={a.id} className="surface flex flex-col rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide" style={{ color: SEV[a.severity] ?? SEV["unknown"], background: `color-mix(in oklab, ${SEV[a.severity] ?? SEV["unknown"]} 15%, transparent)` }}><ShieldAlert className="h-3.5 w-3.5" />{a.severity}</span>
              <span className="text-xs text-muted-foreground">{a.published_at ? new Date(a.published_at).toLocaleDateString() : "Date unknown"}</span>
            </div>
            <h3 className="mt-3 font-semibold leading-snug">{a.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
            {a.recommended_action && <p className="mt-3 rounded-xl bg-primary/10 p-3 text-sm"><span className="font-medium text-primary">What to do: </span>{a.recommended_action}</p>}
            <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
              <span>{a.source_name}</span>
              <a href={a.source_url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-electric hover:underline">Reference <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
