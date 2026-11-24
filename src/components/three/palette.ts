// Brand colours for WebGL materials (canvas can't read Tailwind tokens); keep in sync with styles.css.
export const CYBER = { blue: "#1677FF", glow: "#00A3FF", red: "#FF1744", redGlow: "#FF003C", green: "#22C55E", bg: "#050505", metal: "#111318" } as const;

/** Shared pointer position (-1..1), written by a window listener because the canvas ignores pointer events. */
export const pointer = { x: 0, y: 0 };
let bound = false;
export function bindPointer() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
}
