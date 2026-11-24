import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/workspace-client";
import { dashboardQuery } from "@/lib/dashboard-query";
import { profileQuery } from "@/lib/profile";
import { LIMITS, CHAT_LIMITS } from "@/lib/limits";
import { buildReportPdf } from "@/lib/report-pdf";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const reportsQuery = (userId: string) => queryOptions({
  queryKey: ["reports", userId],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("reports").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});
const usageQuery = (userId: string) => queryOptions({
  queryKey: ["usage", userId],
  queryFn: async () => {
    const since = new Date(Date.now() - 3600000).toISOString();
    const [u, m, c] = await Promise.all([
      getSupabase().from("url_scans").select("id", { count: "exact", head: true }).gte("scanned_at", since),
      getSupabase().from("email_scans").select("id", { count: "exact", head: true }).gte("created_at", since),
      getSupabase().from("messages").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", since),
    ]);
    return { urls: u.count ?? 0, msgs: m.count ?? 0, chat: c.count ?? 0 };
  },
});

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [
    { title: "Security Reports – CyberShield AI" },
    { name: "description", content: "Download PDF security reports and track your usage." },
    { property: "og:title", content: "Security Reports – CyberShield AI" },
    { property: "og:description", content: "Download PDF security reports built from your saved activity." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(reportsQuery(context.user.id)), context.queryClient.ensureQueryData(usageQuery(context.user.id))]),
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: reports } = useSuspenseQuery(reportsQuery(user.id));
  const { data: usage } = useSuspenseQuery(usageQuery(user.id));
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const [d, profile, latest] = await Promise.all([
        qc.fetchQuery(dashboardQuery(user.id)), qc.fetchQuery(profileQuery(user.id)),
        getSupabase().from("security_scores").select("score, assessment_data").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const ad = latest.data?.assessment_data as { privacy_score?: number } | null;
      const now = new Date();
      const blob = buildReportPdf({ name: profile?.full_name || user.email || "you", generatedAt: now, score: latest.data?.score ?? null, privacy: ad?.privacy_score ?? null, totals: d.totals, urls: d.urls, msgs: d.msgs, recs: d.recs });
      const path = `${user.id}/${now.getTime()}.pdf`;
      const up = await getSupabase().storage.from("reports").upload(path, blob, { contentType: "application/pdf" });
      if (up.error) throw up.error;
      const ins = await getSupabase().from("reports").insert({ user_id: user.id, report_name: `Security report ${now.toLocaleDateString()}`, storage_path: path });
      if (ins.error) throw ins.error;
      await qc.invalidateQueries({ queryKey: ["reports", user.id] });
      toast.success("Report created.");
    } catch (e) { console.error(e); toast.error("Could not create your report. Please try again."); } finally { setBusy(false); }
  }
  async function download(path: string) {
    const { data, error } = await getSupabase().storage.from("reports").createSignedUrl(path, 60, { download: true });
    if (error) { toast.error("Could not open this report."); return; }
    window.location.assign(data.signedUrl);
  }
  async function remove(id: string, path: string) {
    await getSupabase().storage.from("reports").remove([path]);
    const { error } = await getSupabase().from("reports").delete().eq("id", id);
    if (error) { toast.error("Could not delete this report."); return; }
    await qc.invalidateQueries({ queryKey: ["reports", user.id] });
  }
  const meters = [
    { label: "URL scans", used: usage.urls, max: LIMITS.urlScansPerHour },
    { label: "Message analyses", used: usage.msgs, max: LIMITS.messageScansPerHour },
    { label: "Assistant messages", used: usage.chat, max: CHAT_LIMITS.messagesPerHour },
  ];
  return <div className="max-w-3xl space-y-6">
    <div><h1 className="text-3xl font-bold">Security Reports</h1><p className="mt-2 text-muted-foreground">PDF reports built only from your saved scans, assessments and recommendations. Stored privately.</p></div>
    <Button variant="hero" disabled={busy} onClick={generate}>{busy ? <Loader2 className="animate-spin" /> : <FileText />}Generate PDF report</Button>
    <section className="surface rounded-3xl p-6"><h2 className="mb-4 text-lg font-semibold">Your reports</h2>
      {!reports.length ? <p className="text-sm text-muted-foreground">No reports yet.</p> : <ul className="divide-y divide-border">{reports.map((r) => <li key={r.id} className="flex items-center justify-between gap-2 py-3"><div><p className="font-medium">{r.report_name}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Download report" onClick={() => download(r.storage_path)}><Download /></Button><Button size="icon" variant="ghost" aria-label="Delete report" onClick={() => remove(r.id, r.storage_path)}><Trash2 /></Button></div></li>)}</ul>}
    </section>
    <section className="surface rounded-3xl p-6"><h2 className="text-lg font-semibold">Usage this hour</h2><p className="mb-4 text-sm text-muted-foreground">Current plan limits. Paid plans aren't available yet.</p>
      <div className="grid gap-4">{meters.map((m) => <div key={m.label}><div className="mb-1 flex justify-between text-sm"><span>{m.label}</span><span>{m.used} / {m.max}</span></div><Progress value={Math.min(100, (m.used / m.max) * 100)} /></div>)}</div>
    </section>
  </div>;
}
