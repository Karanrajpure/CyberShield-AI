// Pure keyframes for the landing scroll story (no React/three), so it stays unit-tested.
export const STAGES = 5;

/** Smoothstep from 0 at a to 1 at b. */
export function ramp(p: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Index (0-4) of the story section for a scroll progress 0..1. */
export function stageAt(p: number) {
  return Math.min(STAGES - 1, Math.max(0, Math.floor(p * STAGES)));
}

export function storyFrame(p: number) {
  const forward = ramp(p, 0, 0.18);
  const toNetwork = ramp(p, 0.4, 0.58);
  const finale = ramp(p, 0.8, 0.98);
  return {
    shieldZ: forward * 1.4 - toNetwork * 2.5 + finale * 1.1, // ends at 0: original position
    shieldScale: 1 + forward * 0.25 - toNetwork * 0.55 + finale * 0.3,
    shieldRotY: ramp(p, 0.18, 0.4) * Math.PI + finale * Math.PI,
    rings: ramp(p, 0.2, 0.34) * (1 - toNetwork * 0.6) + finale * 0.6,
    energy: ramp(p, 0.24, 0.4),
    cameraZ: 7 - toNetwork * 2.5 + finale * 2.5,
    cameraX: Math.sin(toNetwork * Math.PI) * 1.2 * (1 - finale),
    threats: ramp(p, 0.58, 0.66) * (1 - ramp(p, 0.8, 0.86)),
    threatApproach: ramp(p, 0.6, 0.74), // 0 far away → 1 at barrier
    barrier: ramp(p, 0.64, 0.72) * (1 - finale),
    spread: finale,
  };
}
