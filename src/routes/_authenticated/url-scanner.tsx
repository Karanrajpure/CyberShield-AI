import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link2, Loader2, ScanLine, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { getSupabase } from "@/lib/workspace-client";
import { scanUrl } from "@/lib/scans.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge, RiskHero, IndicatorList } from "@/components/app/risk";
import type { ProviderStatus } from "@/lib/url-analysis";
import { parseUserUrl } from "@/lib/url-analysis";

const recentQuery = (uid: string) => queryOptions({
  queryKey: ["url_scans", "recent", uid],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("url_scans").select("id, domain, submitted_url, risk_level, scanned_at").order("scanned_at", { ascending: false }).limit(8);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/url-scanner")({
  head: () => ({ meta: [
    { title: "URL Scanner – CyberShield AI" }, { name: "description", content: "Check whether a link is dangerous before you open it." },
    { property: "og:title", content: "URL Scanner – CyberShield AI" }, { property: "og:description", content: "Check links safely." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(recentQuery(context.user.id)),
  component: UrlScanner,
});

type Result = Extract<Awaited<ReturnType<typeof scanUrl>>, { ok: true }>["scan"];

function ProviderRow({ p }: { p: ProviderStatus }) {
  const map = { match: { I: XCircle, c: "text-destructive", t: "Threat found" }, suspicious: { I: XCircle, c: "text-warning", t: "Suspicious" }, clean: { I: CheckCircle2, c: "text-success", t: "No known threats" }, unavailable: { I: MinusCircle, c: "text-muted-foreground", t: "Unavailable" } }[p.status];
  return <li className="flex items-center justify-between gap-3 text-sm"><span>{p.name}</span><span className={`flex items-center gap-1.5 ${map.c}`}><map.I className="h-4 w-4" />{map.t}{p.detail ? ` · ${p.detail}` : ""}</span></li>;
}

function UrlScanner() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const run = useServerFn(scanUrl);
  const { data: recent } = useSuspenseQuery(recentQuery(user.id));
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const validated = parseUserUrl(url);
    if (!validated.ok) { toast.error(validated.error); return; }
    setBusy(true); setResult(null);
    try {
      const r = await run({ data: { url } });
      if (!r.ok) { toast.error(r.error); return; }
      setResult(r.scan);
      qc.invalidateQueries({ queryKey: ["url_scans"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["history"] });
    } catch { toast.error("Scan failed. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">URL Scanner</h1><p className="mt-1 text-muted-foreground">Check a link before you click it. We never open the link.</p></div>

      <form onSubmit={submit} className="surface relative overflow-hidden rounded-3xl p-5 sm:p-6">
        {busy && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-primary/20 to-transparent animate-scan" />}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/login" inputMode="url" autoComplete="off" spellCheck={false} maxLength={2048} className="h-14 rounded-2xl pl-12 text-base" aria-label="URL to scan" required />
          </div>
          <Button type="submit" variant="hero" size="xl" className="h-14" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ScanLine />}{busy ? "Scanning…" : "Scan URL"}</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{busy ? "Checking threat intelligence and analysing link structure…" : "Results are guidance only — no scan can guarantee a website is safe."}</p>
      </form>

      {result && (
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="surface space-y-5 rounded-3xl p-6 lg:col-span-2">
            <RiskHero level={result.risk_level} score={result.risk_score} subtitle={result.provider_result.explanation} />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="min-w-0"><dt className="text-muted-foreground">Submitted URL</dt><dd className="break-all font-medium">{result.submitted_url}</dd></div>
              <div><dt className="text-muted-foreground">Domain</dt><dd className="font-medium">{result.domain}</dd></div>
              <div><dt className="text-muted-foreground">Scanned</dt><dd className="font-medium">{new Date(result.scanned_at).toLocaleString()}</dd></div>
            </dl>
            <div><h3 className="mb-2 font-semibold">Threat indicators</h3><IndicatorList items={result.indicators} /></div>
          </section>
          <section className="space-y-5">
            <div className="surface rounded-3xl p-6"><h3 className="mb-3 font-semibold">Threat intelligence</h3><ul className="space-y-2">{result.provider_result.providers.map((p) => <ProviderRow key={p.name} p={p} />)}</ul></div>
            <div className="surface rounded-3xl p-6"><h3 className="mb-3 font-semibold">Recommended actions</h3><ul className="list-disc space-y-1.5 pl-5 text-sm">{result.provider_result.actions.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </section>
        </div>
      )}

      <section className="surface rounded-3xl p-6">
        <h2 className="font-semibold">Recent scans</h2>
        {recent.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No scans yet.</p> : (
          <ul className="mt-4 divide-y divide-border">{recent.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{s.domain}</p><p className="truncate text-xs text-muted-foreground">{s.submitted_url}</p></div>
              <RiskBadge level={s.risk_level} />
            </li>))}</ul>)}
      </section>
    </div>
  );
}
