export type Theme = "dark" | "light";
const KEY = "cs-theme";
export function readTheme(): Theme { try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch { return "dark"; } }
export function applyTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch { /* storage blocked */ }
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(t);
}
