import { analyseUrlStructure, classify, parseUserUrl, recommendedActions, type Indicator, type Risk } from "./url-analysis";
import { analyseMessageHeuristics, riskFromScore } from "./message-analysis";
import { MAX_MESSAGE_LENGTH } from "./limits";

export type GuestResult = { risk: Risk; indicators: Indicator[]; actions: string[]; explanation: string };

/** Local checks only: no requests, no history writes, no invented provider verdict. */
export function checkGuestUrl(input: string): GuestResult {
  const parsed = parseUserUrl(input);
  if (!parsed.ok) throw new Error(parsed.error);
  const { score, indicators } = analyseUrlStructure(parsed.value);
  const { risk } = classify(score, []);
  return { risk, indicators, actions: recommendedActions(risk), explanation: "Pattern checks only. This link has not been verified with VirusTotal. Unknown never means safe." };
}

export function checkGuestMessage(input: string): GuestResult {
  const text = input.trim();
  if (text.length < 10) throw new Error("Paste at least a sentence.");
  if (text.length > MAX_MESSAGE_LENGTH) throw new Error("That message is too long.");
  const { score, indicators } = analyseMessageHeuristics(text);
  const risk = score >= 25 ? riskFromScore(score) : "unknown";
  return { risk, indicators, explanation: "Pattern checks only, without AI analysis. An absence of warning signs does not confirm this message is genuine.", actions: ["Never share passwords, OTPs or payment details.", "Verify the sender through an official app or a known phone number.", "Avoid clicking links in unexpected messages."] };
}