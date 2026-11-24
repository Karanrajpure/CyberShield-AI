import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LockKeyhole, ShieldCheck, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PRIVACY_QUESTIONS, ANSWER_OPTIONS, privacySchema, assessPrivacy, type PrivacyAnswers } from "@/lib/privacy";
import { savePrivacyAssessment } from "@/lib/education.functions";
import { assessmentsQuery } from "@/lib/education-queries";
import { scoreStatus } from "@/lib/dashboard-stats";

export const Route = createFileRoute("/_authenticated/privacy")({
  head: () => ({ meta: [
    { title: "Digital Privacy – CyberShield AI" }, { name: "description", content: "Assess your security habits and track your personal security and privacy scores." },
    { property: "og:title", content: "Digital Privacy – CyberShield AI" }, { property: "og:description", content: "Your personal privacy assessment and improvement plan." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(assessmentsQuery(context.user.id)),
  errorComponent: PrivacyError,
  component: Privacy,
});
function PrivacyError() { const router = useRouter(); return <div className="py-12 text-center"><p>We couldn't load your assessments.</p><Button className="mt-4" onClick={() => router.invalidate()}>Try again</Button></div>; }

function Privacy() {
  const { user } = Route.useRouteContext();
  const { data: history } = useSuspenseQuery(assessmentsQuery(user.id));
  const qc = useQueryClient();
  const save = useServerFn(savePrivacyAssessment);
  const [answers, setAnswers] = useState<Partial<PrivacyAnswers>>({});
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(history.length === 0);
  const assessment = history.find((h) => h.id === selected) ?? history[0];
  const parsed = privacySchema.safeParse(assessment?.assessment_data && typeof assessment.assessment_data === "object" && !Array.isArray(assessment.assessment_data) ? assessment.assessment_data["answers"] : null);
  const result = parsed.success ? assessPrivacy(parsed.data) : null;
  const answered = Object.keys(answers).length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const validated = privacySchema.safeParse(answers);
    if (!validated.success) { toast.error("Please answer all seven questions."); return; }
    setBusy(true);
    try {
      const response = await save({ data: validated.data });
      if (!response.ok) { toast.error(response.error); return; }
      await Promise.all([qc.invalidateQueries({ queryKey: ["assessments", user.id] }), qc.invalidateQueries({ queryKey: ["dashboard", user.id] })]);
      setSelected(response.assessment.id); setShowForm(false);
      if (response.warning) toast.warning(response.warning); else toast.success("Your assessment has been saved.");
    } catch { toast.error("Could not save your assessment. Please try again."); } finally { setBusy(false); }
  }

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-sm text-electric"><LockKeyhole className="h-4 w-4" /> YOUR DIGITAL HABITS</p><h1 className="text-3xl font-bold">Digital Privacy</h1><p className="mt-2 text-muted-foreground">A clearer picture of your everyday protection.</p></div>{!showForm && <Button variant="hero" onClick={() => { setAnswers({}); setShowForm(true); }}><RotateCcw /> New assessment</Button>}</header>
    <p className="border-l-2 border-electric pl-4 text-sm text-muted-foreground">Scores reflect your own answers, not a device scan or a guarantee of safety. Never enter passwords, login codes or account credentials.</p>
    {showForm ? <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4"><h2 className="font-semibold">Your privacy check</h2><span className="text-sm text-muted-foreground">{answered} / 7 answered</span></div>
      <div className="divide-y divide-border">{PRIVACY_QUESTIONS.map((q, index) => <fieldset key={q.id} className="py-6 first:pt-0"><legend className="sr-only">{q.question}</legend><p id={`question-${q.id}`} className="mb-4 font-medium"><span className="mr-3 text-electric">0{index + 1}</span>{q.question}</p><RadioGroup aria-labelledby={`question-${q.id}`} value={answers[q.id] ?? ""} onValueChange={(value) => setAnswers((previous) => ({ ...previous, [q.id]: value }))} className="grid grid-cols-2 gap-3 sm:grid-cols-4">{ANSWER_OPTIONS.map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${answers[q.id] === option.value ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}><RadioGroupItem value={option.value} />{option.label}</label>)}</RadioGroup></fieldset>)}</div>
      <div className="flex flex-wrap gap-3"><Button type="submit" variant="hero" disabled={answered !== 7 || busy}>{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} {busy ? "Saving…" : "Get my scores"}</Button>{history.length > 0 && <Button type="button" variant="ghost" disabled={busy} onClick={() => setShowForm(false)}>Cancel</Button>}</div>
      <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">How scores are calculated</summary><p className="mt-3">Yes earns full credit, Sometimes earns half; No and Not sure earn none. Security weights: unique passwords 20, 2FA 20, updates 15, permissions 10, Wi-Fi 15, social privacy 5, password manager 15. Privacy weights: permissions and social privacy 25 each; the other five habits 10 each. Each total is rounded out of 100.</p></details>
    </form> : assessment && <section className="space-y-6" aria-label="Assessment result">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Your assessment</h2><p className="text-sm text-muted-foreground">{new Date(assessment.created_at).toLocaleString()}</p></div>
      <div className="grid gap-5 sm:grid-cols-2">{[{ label: "Security score", score: assessment.score, icon: ShieldCheck }, { label: "Privacy score", score: result?.privacyScore ?? null, icon: LockKeyhole }].map((item) => <div key={item.label} className="rounded-lg border border-border bg-card p-6"><item.icon className="mb-4 h-6 w-6 text-electric" /><p className="text-sm text-muted-foreground">{item.label}</p><p className="my-2 font-display text-5xl font-bold">{item.score ?? "—"}<span className="ml-2 text-base font-normal text-muted-foreground">/100</span></p><p className="text-sm text-primary">{scoreStatus(item.score).label}</p></div>)}</div>
      <h3 className="font-semibold">Your improvement plan</h3>{result?.areas.length ? <ul className="divide-y divide-border">{result.areas.map((area) => <li key={area.id} className="flex gap-3 py-4"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-electric" /><div><p className="font-medium">{area.title}<span className={`ml-3 text-xs ${area.priority === "high" ? "text-warning" : "text-muted-foreground"}`}>{area.priority} priority</span></p><p className="mt-1 text-sm text-muted-foreground">{area.advice}</p></div></li>)}</ul> : <p className="text-sm text-muted-foreground">{result ? "Your answers show strong habits across all seven areas. Keep reviewing them as your digital life changes." : "Detailed answers are unavailable for this older assessment."}</p>}
    </section>}
    {history.length > 0 && <section className="border-t border-border pt-6"><h2 className="mb-4 text-lg font-semibold">Assessment history <span className="text-sm font-normal text-muted-foreground">· latest 50</span></h2><ul className="divide-y divide-border">{history.map((entry) => <li key={entry.id}><Button variant="ghost" className="h-auto w-full flex-wrap justify-between gap-2 px-2 py-4 text-left" onClick={() => { setSelected(entry.id); setShowForm(false); }}><span>{new Date(entry.created_at).toLocaleString()}</span><span className="text-electric">Security {entry.score}/100 <ArrowRight className="ml-2 inline h-4 w-4" /></span></Button></li>)}</ul></section>}
  </div>;
}