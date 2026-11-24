import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck, Link2, MailWarning, Bot, Radar, Lock, GraduationCap, FileText,
  Check, ArrowRight, Sparkles, Eye, Zap, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/Logo";
import { CyberSecurityBackground } from "@/components/three/CyberSecurityBackground";
import { getPublicViewer } from "@/lib/public-viewer";
import { ScrollExperience } from "@/components/three/ScrollExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberShield AI – Your Personal Digital Security Center" },
      { name: "description", content: "Stay ahead of cyber threats with AI-powered phishing detection, URL scanning and real-time security insights." },
      { property: "og:title", content: "CyberShield AI – Your Personal Digital Security Center" },
      { property: "og:description", content: "Intelligent protection for everyday internet users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getPublicViewer(),
  component: Landing,
});

const features = [
  { icon: Link2, title: "URL Scanner", text: "Check links against threat intelligence and suspicious-pattern analysis before you click." },
  { icon: MailWarning, title: "Phishing Detector", text: "Paste an email, SMS or WhatsApp message and get a plain-language risk breakdown." },
  { icon: Bot, title: "AI Security Assistant", text: "Ask anything — from 2FA to hacked accounts — and get clear, practical answers." },
  { icon: Radar, title: "Threat Intelligence", text: "Follow real advisories and scam campaigns from trusted public sources." },
  { icon: Lock, title: "Privacy Checker", text: "A quick assessment that scores your habits and shows exactly what to fix." },
  { icon: GraduationCap, title: "Security Academy", text: "Bite-sized lessons and quizzes that make you harder to fool." },
];

const steps = [
  { n: "01", title: "Try a check", text: "Start with a link, a message or your privacy habits — no sign-in required." },
  { n: "02", title: "Scan & assess", text: "Check links, messages and your privacy habits." },
  { n: "03", title: "Save your progress", text: "Continue with Google for private history, VirusTotal checks and AI analysis." },
];

const plans = [
  { name: "Pro", items: ["Higher scan limits", "Advanced AI analysis", "Extended scan history", "PDF security reports", "Advanced recommendations"] },
];

const faqs = [
  { q: "Does CyberShield AI open the links I scan?", a: "No. Submitted links are never opened or executed. We check them against reputation services and analyse their structure only." },
  { q: "Can a scan guarantee a website is safe?", a: "No tool can. A low-risk result means no known threats were found — always stay cautious, especially with login or payment pages." },
  { q: "Will you ever ask for my passwords?", a: "Never. CyberShield AI never asks for passwords, OTPs or account credentials — and neither should anyone else." },
  { q: "Who can see my scan history?", a: "Only you. Every record is isolated to your account with strict access rules." },
  { q: "Is payment active?", a: "Not yet. Pro is not currently available for purchase." },
];

function Landing() {
  const user = Route.useLoaderData();
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pro</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
             <Button asChild variant="ghost" size="sm"><Link to={user ? "/dashboard" : "/auth"}>{user ? "Dashboard" : "Sign in"}</Link></Button>
             <Button asChild variant="hero" size="sm"><Link to={user ? "/dashboard" : "/try"}>Get Started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-glow" />
        <CyberSecurityBackground variant="hero" />
        <div className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Your Digital World. Protected by Intelligence.
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Your Personal <span className="text-gradient-brand">Digital Security</span> Center.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Stay ahead of cyber threats with intelligent protection, AI-powered phishing detection and real-time security insights.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
               <Button asChild variant="hero" size="xl"><Link to={user ? "/dashboard" : "/try"}>Get Started <ArrowRight /></Link></Button>
              <Button asChild variant="glass" size="xl"><a href="#features">Explore Features</a></Button>
               <Button asChild variant="ghost" size="xl"><Link to={user ? "/dashboard" : "/try"}>{user ? "Dashboard" : "Try tools"}</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No credit card", "Links never opened", "Private by design"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" />{t}</span>
              ))}
            </div>
          </div>
          {/* The 3D shield renders in the background canvas; this keeps its space in the layout. */}
          <div className="h-72 sm:h-96 lg:h-[30rem]" aria-hidden />
        </div>
      </section>

      {/* Scroll-driven 3D story */}
      <ScrollExperience />

      {/* Dashboard preview */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="surface overflow-hidden rounded-3xl p-3 sm:p-5">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <span className="ml-3 text-xs text-muted-foreground">Dashboard preview</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-background/60 p-5 md:row-span-2">
              <p className="text-sm text-muted-foreground">Security score</p>
              <div className="relative mx-auto my-6 grid h-36 w-36 place-items-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                  <circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" className="fill-none stroke-primary" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="70" />
                </svg>
                <span className="font-display text-3xl font-bold">Score</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">Calculated from your own assessments</p>
            </div>
            {[
              { icon: Link2, label: "URLs scanned", c: "text-electric" },
              { icon: MailWarning, label: "Messages analysed", c: "text-primary" },
              { icon: Eye, label: "Suspicious found", c: "text-warning" },
              { icon: Check, label: "Tips completed", c: "text-success" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-background/60 p-5">
                <s.icon className={`h-5 w-5 ${s.c}`} />
                <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
                <div className="mt-2 h-2 w-2/3 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Features" title="Everything you need to stay safe online" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="surface group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-gradient-brand group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How it works" title="Protection in three simple steps" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border p-6">
              <span className="font-display text-4xl font-bold text-gradient-brand">{s.n}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why + benefits */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="surface grid gap-10 rounded-3xl p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">Why CyberShield AI</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Honest security. No scare tactics.</h2>
            <p className="mt-4 text-muted-foreground">
              We never invent threats or fake scores. Every result comes from real checks, and when a service is unavailable we tell you — because "unknown" never means "safe".
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, t: "Privacy first", d: "Your records are isolated to your account." },
              { icon: Zap, t: "Instant insights", d: "Results in seconds, explained simply." },
              { icon: FileText, t: "Clear reports", d: "Download your security overview as PDF." },
              { icon: Users, t: "Built for everyone", d: "No technical knowledge required." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl bg-background/50 p-5">
                <b.icon className="h-5 w-5 text-electric" />
                <p className="mt-3 font-semibold">{b.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Pro" title="CyberShield AI Pro" />
        <div className="mx-auto mt-12 grid max-w-md gap-5">
          {plans.map((p) => (
            <div key={p.name} className="relative rounded-3xl border border-primary/50 bg-primary/10 p-7 shadow-glow">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <ul className="mt-6 space-y-3 text-sm">
                {p.items.map((i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" />{i}</li>)}
              </ul>
              <Button asChild variant="hero" className="mt-8 w-full" size="lg">
                 <Link to={user ? "/dashboard" : "/try"}>Get Started</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Pro is not yet available for purchase.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="FAQ" title="Questions, answered" />
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CyberShield AI. Your Digital World. Protected by Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
    </div>
  );
}
