import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { Variant } from "./BackgroundCanvas";

const BackgroundCanvas = lazy(() => import("./BackgroundCanvas"));

function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/** Real-time 3D shield + neural network behind page content; static gradient when WebGL is unavailable. */
export function CyberSecurityBackground({ variant = "subtle", className = "" }: { variant?: Variant; className?: string }) {
  const fallback = <div className="h-full w-full bg-glow" aria-hidden />;
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(hasWebGL()), []);
  const fixed = variant === "subtle" ? "fixed inset-0 -z-10" : variant === "mini" ? "relative" : "absolute inset-0";
  return (
    <div className={`pointer-events-none overflow-hidden ${fixed} ${className}`} aria-hidden>
      <ClientOnly fallback={fallback}>
        {ok ? <Suspense fallback={fallback}><BackgroundCanvas variant={variant} /></Suspense> : fallback}
      </ClientOnly>
    </div>
  );
}
