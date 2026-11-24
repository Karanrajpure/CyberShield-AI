import { MAX_URL_LENGTH } from "./limits";

export type Risk = "low" | "suspicious" | "high" | "unknown";
export type Indicator = { id: string; label: string; severity: "info" | "warning" | "danger" };

export type ParsedUrl = { normalized: string; domain: string; protocol: string; url: URL };

/** Validate and normalise a user URL. Never fetches it. */
export function parseUserUrl(input: string): { ok: true; value: ParsedUrl } | { ok: false; error: string } {
  let raw = input.trim();
  if (!raw) return { ok: false, error: "Please enter a URL." };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, error: "That URL is too long." };
  if (/[\s<>"'`]/.test(raw)) return { ok: false, error: "The URL contains invalid characters." };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = "https://" + raw;
  let url: URL;
  try { url = new URL(raw); } catch { return { ok: false, error: "That doesn't look like a valid URL." }; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, error: "Only http and https links can be scanned." };
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || (!host.includes(".") && !host.startsWith("["))) return { ok: false, error: "Please enter a full domain like example.com." };
  if (url.username || url.password) return { ok: false, error: "Remove any username or password from the URL before scanning." };
  url.hash = "";
  url.hostname = host;
  return { ok: true, value: { normalized: url.toString(), domain: host, protocol: url.protocol, url } };
}

const SUSPICIOUS_TLDS = ["zip", "mov", "xyz", "top", "click", "country", "gq", "tk", "ml", "cf", "ga", "work", "rest", "cam", "monster"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rebrand.ly", "shorturl.at"];
const BRANDS = ["paypal", "apple", "microsoft", "google", "amazon", "netflix", "facebook", "instagram", "whatsapp", "bank", "binance", "coinbase", "outlook", "office365", "dhl", "fedex"];
const LURE_WORDS = ["login", "verify", "secure", "account", "update", "confirm", "wallet", "password", "signin", "unlock", "suspend"];

export function isPrivateOrLocalHost(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (h.includes(":")) return h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80");
  return false;
}

/** Structural heuristics only — the URL is never opened. Returns indicators and a 0-100 score. */
export function analyseUrlStructure(p: ParsedUrl): { indicators: Indicator[]; score: number } {
  const ind: Indicator[] = [];
  const host = p.domain;
  const full = p.normalized.toLowerCase();
  const labels = host.split(".");
  const tld = labels.at(-1) ?? "";
  const registrable = labels.slice(-2).join(".");
  let score = 0;
  const add = (i: Indicator, pts: number) => { ind.push(i); score += pts; };

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) add({ id: "ip_host", label: "Uses a raw IP address instead of a domain name", severity: "danger" }, 30);
  if (isPrivateOrLocalHost(host)) add({ id: "private_host", label: "Points to a private or local network address", severity: "danger" }, 30);
  if (p.protocol === "http:") add({ id: "no_https", label: "Not encrypted (http instead of https)", severity: "warning" }, 10);
  if (host.split(".").some((l) => l.startsWith("xn--"))) add({ id: "punycode", label: "Uses look-alike international characters (punycode)", severity: "danger" }, 30);
  if (p.url.username || p.url.password || full.includes("@")) add({ id: "at_sign", label: "Contains an @ sign that can hide the real destination", severity: "danger" }, 25);
  if (SUSPICIOUS_TLDS.includes(tld)) add({ id: "risky_tld", label: `Uses the .${tld} ending, often abused by scammers`, severity: "warning" }, 15);
  if (SHORTENERS.includes(host)) add({ id: "shortener", label: "Link shortener hides the final destination", severity: "warning" }, 15);
  if (labels.length >= 5) add({ id: "many_subdomains", label: "Unusually many subdomains", severity: "warning" }, 10);
  if ((host.match(/-/g) ?? []).length >= 3) add({ id: "many_hyphens", label: "Domain contains many hyphens", severity: "warning" }, 10);
  if (full.length > 150) add({ id: "long_url", label: "Very long URL, which can hide its purpose", severity: "info" }, 5);
  if (p.url.port && !["80", "443"].includes(p.url.port)) add({ id: "odd_port", label: `Uses unusual port ${p.url.port}`, severity: "warning" }, 10);
  const brand = BRANDS.find((b) => host.includes(b) && !registrable.startsWith(b + "."));
  if (brand) add({ id: "brand_impersonation", label: `Mentions "${brand}" but isn't on ${brand}'s own domain`, severity: "danger" }, 30);
  const lures = LURE_WORDS.filter((w) => full.includes(w));
  if (lures.length >= 2) add({ id: "lure_words", label: `Contains login/verification wording (${lures.slice(0, 3).join(", ")})`, severity: "warning" }, 10);
  if (/\.(exe|apk|scr|bat|msi|js|vbs)(\?|$)/.test(p.url.pathname.toLowerCase())) add({ id: "executable", label: "Links directly to a downloadable program", severity: "danger" }, 25);

  return { indicators: ind, score: Math.min(100, score) };
}

export type ProviderStatus = { name: string; status: "match" | "suspicious" | "clean" | "unavailable"; detail?: string | undefined };

/** Combine provider verdicts and heuristics. Unknown never means safe. */
export function classify(heuristicScore: number, providers: ProviderStatus[]): { risk: Risk; score: number } {
  if (providers.some((p) => p.status === "match")) return { risk: "high", score: Math.max(90, heuristicScore) };
  if (heuristicScore >= 50) return { risk: "high", score: heuristicScore };
  if (providers.some((p) => p.status === "suspicious")) return { risk: "suspicious", score: Math.max(40, heuristicScore) };
  if (heuristicScore >= 20) return { risk: "suspicious", score: heuristicScore };
  const anyClean = providers.some((p) => p.status === "clean");
  if (!anyClean) return { risk: "unknown", score: heuristicScore };
  return { risk: "low", score: heuristicScore };
}

export function recommendedActions(risk: Risk): string[] {
  switch (risk) {
    case "high": return ["Do not open this link or enter any information.", "Delete the message it came in and block the sender.", "If you already entered a password, change it now and enable two-factor authentication."];
    case "suspicious": return ["Avoid opening this link unless you can verify the sender another way.", "Type the official website address yourself instead of clicking.", "Never enter passwords, OTPs or card details on this page."];
    case "low": return ["No known threats were found, but no scan can guarantee safety.", "Still check the address bar before entering personal details."];
    default: return ["We couldn't verify this link with a threat intelligence service — treat it with caution.", "Unknown does not mean safe. Verify the sender before opening."];
  }
}
