import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, MailWarning, Lock, ArrowRight, ShieldQuestion } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GoogleSignIn } from "@/components/app/GoogleSignIn";
import { checkGuestUrl, checkGuestMessage, type GuestResult } from "@/lib/guest-analysis";
import { assessPrivacy, privacySchema, PRIVACY_QUESTIONS, ANSWER_OPTIONS, type PrivacyAnswers } from "@/lib/privacy";
import { MAX_URL_LENGTH, MAX_MESSAGE_LENGTH } from "@/lib/limits";

export const Route = createFileRoute("/try")({
  head: () => ({ meta: [
    { title: "Try Security Checks – CyberShield AI" },
    { name: "description", content: "Check link patterns, suspicious messages and privacy habits without signing in." },
    { property: "og:title", content: "Try Security Checks – CyberShield AI" },
    { property: "og:description", content: "Instant security pattern checks, with no account required." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: GuestTools,
});

function GuestTools() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<Partial<PrivacyAnswers>>({});
  const [result, setResult] = useState<GuestResult | null>(null);
  const [privacy, setPrivacy] = useState<ReturnType<typeof assessPrivacy> | null>(null);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState(false);
  function check(e: FormEvent, kind: "url" | "message" | "privacy") {
    e.preventDefault(); setError("");
    try {
      if (kind === "privacy") {
        const parsed = privacySchema.safeParse(answers);
        if (!parsed.success) throw new Error("Answer all seven questions to calculate your score.");
        setPrivacy(assessPrivacy(parsed.data)); setResult(null);
      } else { setResult(kind === "url" ? checkGuestUrl(url) : checkGuestMessage(message)); setPrivacy(null); }
      setPrompt(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not check this input."); }
  }
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4"><Logo /><Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button></div></header>
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-primary">CyberShield AI</p>
      <h1 className="mt-2 text-3xl font-bold">Check before you trust.</h1>
      <p className="mt-3 text-sm text-muted-foreground">Guest checks stay on this device and aren't saved. VirusTotal and AI analysis are available after sign-in.</p>
      <Tabs defaultValue="url" className="mt-8" onValueChange={() => { setError(""); setResult(null); setPrivacy(null); }}>
        <TabsList className="grid h-12 w-full grid-cols-3"><TabsTrigger value="url" className="gap-2"><Link2 className="size-4"/>Links</TabsTrigger><TabsTrigger value="message" className="gap-2"><MailWarning className="size-4"/>Messages</TabsTrigger><TabsTrigger value="privacy" className="gap-2"><Lock className="size-4"/>Privacy</TabsTrigger></TabsList>
        <TabsContent value="url"><form className="mt-6 space-y-4" onSubmit={e => check(e, "url")}><Label htmlFor="guest-url">Website link</Label><Input id="guest-url" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} maxLength={MAX_URL_LENGTH} required/><Button variant="hero" type="submit">Check link <ArrowRight/></Button></form></TabsContent>
        <TabsContent value="message"><form className="mt-6 space-y-4" onSubmit={e => check(e, "message")}><Label htmlFor="guest-message">Suspicious message</Label><Textarea id="guest-message" placeholder="Paste the message, without passwords or personal details" className="min-h-40" value={message} onChange={e => setMessage(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} required/><Button variant="hero" type="submit">Check message <ArrowRight/></Button></form></TabsContent>
        <TabsContent value="privacy"><form className="mt-6 space-y-6" onSubmit={e => check(e, "privacy")}>
          {PRIVACY_QUESTIONS.map(q => <fieldset key={q.id} className="border-b border-border pb-5"><legend className="mb-3 text-sm font-medium">{q.question}</legend><div className="flex flex-wrap gap-3">{ANSWER_OPTIONS.map(a => <label key={a.value} className="flex items-center gap-2 text-sm"><input type="radio" name={q.id} value={a.value} checked={answers[q.id] === a.value} onChange={() => setAnswers(old => ({ ...old, [q.id]: a.value }))} required/>{a.label}</label>)}</div></fieldset>)}
          <Button variant="hero" type="submit">Calculate score <ArrowRight/></Button>
        </form></TabsContent>
      </Tabs>
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
      {result && <section aria-label="Check result" className="mt-8 border-t border-border pt-6">
        <div className="flex items-center gap-2"><ShieldQuestion className="size-5 text-primary"/><h2 className="text-xl font-semibold">{result.risk === "high" ? "High risk" : result.risk === "suspicious" ? "Suspicious" : "Unverified"}</h2></div>
        <p className="mt-3 text-sm text-muted-foreground">{result.explanation}</p>
        {result.indicators.length ? <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">{result.indicators.map(i => <li key={i.id}>{i.label}</li>)}</ul> : <p className="mt-4 text-sm">No major pattern warnings found. This is not a safety guarantee.</p>}
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm">{result.actions.map(a => <li key={a}>{a}</li>)}</ul>
      </section>}
      {privacy && <section aria-label="Privacy result" className="mt-8 border-t border-border pt-6"><h2 className="text-xl font-semibold">Your security score: {privacy.securityScore}/100</h2><p className="mt-2 text-muted-foreground">Privacy score: {privacy.privacyScore}/100 · Based on your answers · Not saved</p><ul className="mt-4 space-y-3">{privacy.areas.map(a => <li key={a.id}><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.advice}</p></li>)}</ul></section>}
      {(result || privacy) && <div className="mt-8 max-w-sm"><GoogleSignIn/><p className="mt-2 text-xs text-muted-foreground">Continue for private scan history and full checks. Guest results aren't transferred.</p></div>}
    </main>
    <Dialog open={prompt} onOpenChange={setPrompt}><DialogContent className="max-w-sm"><DialogTitle>Your result is ready</DialogTitle><DialogDescription>Continue with Google for private history, VirusTotal checks and AI analysis.</DialogDescription><GoogleSignIn/><Button variant="ghost" onClick={() => setPrompt(false)}>Not now — see my result</Button></DialogContent></Dialog>
  </div>;
}