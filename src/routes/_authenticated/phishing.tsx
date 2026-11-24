import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, MailWarning, Sparkles } from "lucide-react";
import { analyseMessage } from "@/lib/scans.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RiskHero, IndicatorList } from "@/components/app/risk";
import { MAX_MESSAGE_LENGTH } from "@/lib/limits";

export const Route = createFileRoute("/_authenticated/phishing")({
  head: () => ({ meta: [
    { title: "Phishing Detector – CyberShield AI" }, { name: "description", content: "Paste a suspicious message and get an AI-powered risk breakdown." },
    { property: "og:title", content: "Phishing Detector – CyberShield AI" }, { property: "og:description", content: "AI-powered phishing analysis." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Phishing,
});

const TYPES = [["email", "Email"], ["sms", "SMS"], ["whatsapp", "WhatsApp"], ["social", "Social media"], ["other", "Other"]] as const;
type Result = Extract<Awaited<ReturnType<typeof analyseMessage>>, { ok: true }>["scan"];

function Phishing() {
  const qc = useQueryClient();
  const run = useServerFn(analyseMessage);
  const [type, setType] = useState<(typeof TYPES)[number][0]>("email");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<Result | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setR(null);
    try {
      const res = await run({ data: { content, contentType: type } });
      if (!res.ok) { toast.error(res.error); return; }
      setR(res.scan);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["history"] });
    } catch (err) { toast.error(err instanceof Error && err.message.includes("at least") ? "Paste at least a sentence." : "Analysis failed. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Phishing Detector</h1><p className="mt-1 text-muted-foreground">Paste a suspicious email or message. Links and attachments are never opened.</p></div>
      <form onSubmit={submit} className="surface space-y-4 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Message type">
          {TYPES.map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={type === v} onClick={() => setType(v)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${type === v ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} rows={9} placeholder="Paste the full message here…" className="rounded-2xl text-base" required />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{content.length}/{MAX_MESSAGE_LENGTH} · Remove personal details you don't want stored.</p>
          <Button type="submit" variant="hero" size="lg" disabled={busy || content.trim().length < 10}>{busy ? <Loader2 className="animate-spin" /> : <MailWarning />}{busy ? "Analysing…" : "Analyse message"}</Button>
        </div>
      </form>

      {r && (
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="surface space-y-5 rounded-3xl p-6 lg:col-span-2">
            <RiskHero level={r.risk_level} score={r.risk_score} subtitle={r.indicators.ai_available ? "Combined AI and pattern analysis" : "Pattern analysis only — AI unavailable"} />
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />Explanation</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.ai_explanation}</p>
              <p className="mt-2 text-xs text-muted-foreground">AI analysis can't prove a message is malicious or legitimate. Use it as guidance.</p>
            </div>
            <div><h3 className="mb-2 font-semibold">Warning signs</h3><IndicatorList items={r.indicators.items} /></div>
          </section>
          <section className="space-y-5">
            <div className="surface rounded-3xl p-6"><h3 className="mb-3 font-semibold">Suspicious phrases</h3>
              {r.indicators.phrases.length ? <div className="flex flex-wrap gap-2">{r.indicators.phrases.map((p) => <span key={p} className="rounded-lg bg-warning/15 px-2 py-1 text-xs text-warning">"{p}"</span>)}</div> : <p className="text-sm text-muted-foreground">None found.</p>}
              {r.indicators.links.length > 0 && <><h4 className="mb-1 mt-4 text-sm font-medium">Links found (not opened)</h4><ul className="space-y-1 text-xs text-muted-foreground">{r.indicators.links.map((l) => <li key={l} className="break-all">{l}</li>)}</ul></>}
            </div>
            <div className="surface rounded-3xl p-6"><h3 className="mb-3 font-semibold">Recommended actions</h3><ul className="list-disc space-y-1.5 pl-5 text-sm">{r.indicators.actions.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </section>
        </div>
      )}
    </div>
  );
}
