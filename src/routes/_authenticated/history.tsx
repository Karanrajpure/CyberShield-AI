import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link2, MailWarning, Search, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/workspace-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RiskBadge, RiskHero, IndicatorList } from "@/components/app/risk";

type Item = { kind: "url" | "message"; id: string; title: string; sub: string; risk: string; score: number | null; at: string; raw: Record<string, any> };

const historyQuery = (uid: string) => queryOptions({
  queryKey: ["history", uid],
  queryFn: async (): Promise<Item[]> => {
    const [u, m] = await Promise.all([
      getSupabase().from("url_scans").select("*").order("scanned_at", { ascending: false }).limit(500),
      getSupabase().from("email_scans").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (u.error) throw u.error; if (m.error) throw m.error;
    return [
      ...u.data.map((r): Item => ({ kind: "url", id: r.id, title: r.domain, sub: r.submitted_url, risk: r.risk_level, score: r.risk_score, at: r.scanned_at, raw: r })),
      ...m.data.map((r): Item => ({ kind: "message", id: r.id, title: r.content_type.toUpperCase() + " message", sub: r.submitted_content.slice(0, 120), risk: r.risk_level, score: r.risk_score, at: r.created_at, raw: r })),
    ];
  },
});

type S = { q?: string | undefined; type?: "all" | "url" | "message" | undefined; risk?: string | undefined; sort?: "newest" | "oldest" | "risk" | undefined };

export const Route = createFileRoute("/_authenticated/history")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" ? s["q"].slice(0, 100) : undefined,
    type: s["type"] === "url" || s["type"] === "message" ? s["type"] : undefined,
    risk: ["low", "suspicious", "high", "unknown"].includes(String(s["risk"])) ? String(s["risk"]) : undefined,
    sort: s["sort"] === "oldest" || s["sort"] === "risk" ? s["sort"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Scan History – CyberShield AI" }, { name: "description", content: "All your URL scans and message analyses." },
    { property: "og:title", content: "Scan History – CyberShield AI" }, { property: "og:description", content: "Your scan history." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(historyQuery(context.user.id)),
  component: History,
});

const sel = "h-10 rounded-xl border border-input bg-background px-3 text-sm";

function History() {
  const { user } = Route.useRouteContext();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/history" });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(historyQuery(user.id));
  const [open, setOpen] = useState<Item | null>(null);
  const [del, setDel] = useState<Item | null>(null);
  const set = (patch: Partial<S>) => navigate({ search: (p) => ({ ...p, ...patch }), replace: true });

  const items = useMemo(() => {
    const q = (s.q ?? "").toLowerCase();
    let r = data.filter((i) => (!s.type || i.kind === s.type) && (!s.risk || i.risk === s.risk) && (!q || i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)));
    r = [...r].sort((a, b) => s.sort === "risk" ? (b.score ?? -1) - (a.score ?? -1) : s.sort === "oldest" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at));
    return r;
  }, [data, s]);

  async function confirmDelete() {
    if (!del) return;
    const { error } = await getSupabase().from(del.kind === "url" ? "url_scans" : "email_scans").delete().eq("id", del.id);
    setDel(null);
    if (error) { toast.error("Couldn't delete this record."); return; }
    toast.success("Deleted.");
    qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["url_scans"] });
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Scan History</h1><p className="mt-1 text-muted-foreground">{data.length} records · only visible to you</p></div>
      <div className="surface flex flex-col gap-3 rounded-2xl p-4 md:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input defaultValue={s.q} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search domains or messages" className="h-10 pl-9" aria-label="Search" /></div>
        <div className="grid grid-cols-3 gap-2">
          <select className={sel} value={s.type ?? "all"} onChange={(e) => set({ type: e.target.value === "all" ? undefined : (e.target.value as S["type"]) })} aria-label="Type"><option value="all">All types</option><option value="url">URL scans</option><option value="message">Messages</option></select>
          <select className={sel} value={s.risk ?? ""} onChange={(e) => set({ risk: e.target.value || undefined })} aria-label="Risk"><option value="">All risks</option><option value="high">High Risk</option><option value="suspicious">Suspicious</option><option value="low">Low Risk</option><option value="unknown">Unknown</option></select>
          <select className={sel} value={s.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value === "newest" ? undefined : (e.target.value as S["sort"]) })} aria-label="Sort"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="risk">Highest risk</option></select>
        </div>
      </div>

      <div className="surface overflow-hidden rounded-3xl">
        {items.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No records match.</p> : (
          <ul className="divide-y divide-border">{items.map((i) => (
            <li key={i.kind + i.id} className="flex items-center gap-3 p-4">
              <button onClick={() => setOpen(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">{i.kind === "url" ? <Link2 className="h-4 w-4 text-electric" /> : <MailWarning className="h-4 w-4 text-primary" />}</span>
                <span className="min-w-0"><span className="block truncate font-medium">{i.title}</span><span className="block truncate text-xs text-muted-foreground">{new Date(i.at).toLocaleString()} · {i.sub}</span></span>
              </button>
              <RiskBadge level={i.risk} />
              <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDel(i)}><Trash2 className="text-muted-foreground" /></Button>
            </li>))}</ul>)}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {open && <>
            <DialogHeader><DialogTitle>{open.title}</DialogTitle></DialogHeader>
            <RiskHero level={open.risk} score={open.score} subtitle={new Date(open.at).toLocaleString()} />
            {open.kind === "url" ? <>
              <p className="break-all text-sm">{open.raw["submitted_url"]}</p>
              <p className="text-sm text-muted-foreground">{open.raw["provider_result"]?.explanation}</p>
              <IndicatorList items={open.raw["indicators"] ?? []} />
              <h3 className="font-semibold">Threat intelligence</h3>
              <ul className="space-y-2 text-sm">{(open.raw["provider_result"]?.providers ?? []).map((p: { name: string; status: string; detail?: string }) => <li key={p.name} className="break-words">{p.name}: {p.status === "unavailable" ? "Unavailable" : p.status === "clean" ? "No known threats" : p.status === "match" ? "Threat found" : "Suspicious"}{p.detail ? ` · ${p.detail}` : ""}</li>)}</ul>
              <h3 className="font-semibold">Recommended actions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">{(open.raw["provider_result"]?.actions ?? []).map((action: string) => <li key={action}>{action}</li>)}</ul>
            </> : <>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-muted p-3 text-sm">{open.raw["submitted_content"]}</p>
              <p className="text-sm text-muted-foreground">{open.raw["ai_explanation"]}</p>
              <IndicatorList items={open.raw["indicators"]?.items ?? []} />
              <p className="text-xs text-muted-foreground">{open.raw["indicators"]?.ai_available ? "Combined AI and pattern analysis" : "Pattern analysis only — AI unavailable"}</p>
              <h3 className="font-semibold">Recommended actions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">{(open.raw["indicators"]?.actions ?? []).map((action: string) => <li key={action}>{action}</li>)}</ul>
            </>}
          </>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this record?</AlertDialogTitle><AlertDialogDescription>This permanently removes it from your history.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
