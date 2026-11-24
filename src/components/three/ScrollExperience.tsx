import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { ScrollSection } from "./ScrollSection";
import type { Tier } from "./ScrollStoryCanvas";

const ScrollStoryCanvas = lazy(() => import("./ScrollStoryCanvas"));

function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

const chapters = [
  { eyebrow: "01 · Cyber Shield", title: "Your Personal Digital Security Center.", text: "One shield for your links, messages, privacy habits and accounts.", align: "left" },
  { eyebrow: "02 · Digital protection", title: "Your Digital World. Protected.", text: "Layers of checks wrap around everything you share and open online.", align: "left" },
  { eyebrow: "03 · Neural network", title: "Intelligence Behind Every Protection.", text: "Pattern analysis and AI work together to explain risk in plain language.", align: "center" },
  { eyebrow: "04 · Threat detection", title: "Detect Threats Before They Reach You.", text: "Suspicious links and scam messages are flagged before you click — never opened by us.", align: "right" },
  { eyebrow: "05 · Complete protection", title: "Stay Safe. Stay Protected.", text: "Scan, learn and improve your security score — all in one place.", align: "left" },
] as const;

/** Pinned 3D scene whose story follows scroll progress (GSAP ScrollTrigger, scrubbed both ways). */
export function ScrollExperience() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [ok, setOk] = useState<boolean | null>(null);
  const [tier, setTier] = useState<Tier>("desktop");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setOk(hasWebGL());
    const w = window.innerWidth;
    setTier(w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => { progress.current = self.progress; },
        });
      }, root);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  const fallback = <div className="h-full w-full bg-glow" aria-hidden />;
  return (
    <section ref={root} aria-label="How CyberShield AI protects you" className="relative">
      {/* Sticky pin: the one canvas stays put while the chapters scroll over it, then releases at the end. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden><div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-glow" />
        <ClientOnly fallback={fallback}>
          {ok ? <Suspense fallback={fallback}><ScrollStoryCanvas progress={progress} tier={tier} reduced={reduced} /></Suspense> : fallback}
        </ClientOnly>
      </div></div>
      <div className="relative mx-auto max-w-7xl">
        {chapters.map((c) => (
          <ScrollSection key={c.eyebrow} eyebrow={c.eyebrow} title={c.title} align={c.align}>{c.text}</ScrollSection>
        ))}
      </div>
    </section>
  );
}
