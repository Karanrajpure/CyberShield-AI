import type { Indicator, Risk } from "./url-analysis";

type Rule = { id: string; label: string; severity: Indicator["severity"]; pts: number; re: RegExp };
const RULES: Rule[] = [
  { id: "urgency", label: "Urgent or threatening language", severity: "warning", pts: 15, re: /\b(urgent|immediately|within 24 hours|act now|final (notice|warning)|suspended|will be (closed|blocked|deactivated)|expires? today|last chance)\b/i },
  { id: "otp_request", label: "Asks for a one-time code (OTP)", severity: "danger", pts: 30, re: /\b(otp|one[- ]time (pass(word|code)|code)|verification code|6[- ]digit code|share (the|your) code)\b/i },
  { id: "password_request", label: "Asks for a password or PIN", severity: "danger", pts: 30, re: /\b(password|passcode|\bpin\b|login details|credentials)\b/i },
  { id: "payment", label: "Payment, gift card or crypto request", severity: "danger", pts: 20, re: /\b(gift ?cards?|wire transfer|bitcoin|crypto|usdt|western union|pay (a|the) (fee|fine)|processing fee|refund|bank details|card number|cvv)\b/i },
  { id: "prize", label: "Too-good-to-be-true prize or offer", severity: "warning", pts: 15, re: /\b(you('ve| have) won|winner|congratulations|lottery|claim your (prize|reward)|free iphone|selected for)\b/i },
  { id: "impersonation", label: "Claims to be a bank, delivery firm or well-known brand", severity: "warning", pts: 10, re: /\b(bank|paypal|amazon|apple|microsoft|netflix|dhl|fedex|ups|post office|tax (office|department)|irs|hmrc|police|customs|whatsapp support|instagram support)\b/i },
  { id: "verify_account", label: "Asks you to verify or unlock your account", severity: "warning", pts: 15, re: /\b(verify your (account|identity)|confirm your (account|details|identity)|unlock your account|update your (details|information|account))\b/i },
  { id: "secrecy", label: "Asks you to keep it secret or not tell anyone", severity: "warning", pts: 15, re: /\b(don'?t tell|keep (this|it) (secret|confidential)|do not share this with)\b/i },
  { id: "remote_access", label: "Asks you to install an app or allow remote access", severity: "danger", pts: 25, re: /\b(anydesk|teamviewer|remote access|install (this|the) app|download (this|the) (app|apk))\b/i },
];

export function extractLinks(text: string): string[] {
  return Array.from(new Set(text.match(/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi) ?? [])).slice(0, 20);
}

export function analyseMessageHeuristics(text: string) {
  const indicators: Indicator[] = [];
  const phrases: string[] = [];
  let score = 0;
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) { indicators.push({ id: r.id, label: r.label, severity: r.severity }); phrases.push(m[0]); score += r.pts; }
  }
  const links = extractLinks(text);
  if (links.length) { indicators.push({ id: "links", label: `Contains ${links.length} link${links.length > 1 ? "s" : ""}`, severity: "info" }); score += 5; }
  return { indicators, phrases: Array.from(new Set(phrases)).slice(0, 15), links, score: Math.min(100, score) };
}

export function riskFromScore(score: number): Risk {
  if (score >= 60) return "high";
  if (score >= 25) return "suspicious";
  return "low";
}
