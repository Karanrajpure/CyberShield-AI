import { z } from "zod";
import type { ProviderStatus } from "./url-analysis";

const statsSchema = z.object({ malicious: z.number().int().nonnegative(), suspicious: z.number().int().nonnegative(), harmless: z.number().int().nonnegative(), undetected: z.number().int().nonnegative() });
export const virusTotalResponseSchema = z.object({ data: z.object({ attributes: z.object({ last_analysis_stats: statsSchema }) }) });

export function virusTotalVerdict(payload: unknown): ProviderStatus {
  const parsed = virusTotalResponseSchema.safeParse(payload);
  const name = "VirusTotal";
  if (!parsed.success) return { name, status: "unavailable", detail: "Invalid or incomplete analysis data" };
  const s = parsed.data.data.attributes.last_analysis_stats;
  if (s.malicious > 0) return { name, status: "match", detail: `${s.malicious} engines flagged as malicious` };
  if (s.suspicious > 0) return { name, status: "suspicious", detail: `${s.suspicious} engines flagged as suspicious` };
  if (s.harmless + s.undetected === 0) return { name, status: "unavailable", detail: "No completed engine checks" };
  return { name, status: "clean" };
}

export const phishingAiSchema = z.object({
  risk_score: z.number().int().min(0).max(100),
  category: z.enum(["likely_safe", "suspicious", "likely_phishing"]),
  warning_signs: z.array(z.string().min(1).max(500)).max(8),
  suspicious_phrases: z.array(z.string().min(1).max(500)).max(8),
  explanation: z.string().trim().min(1).max(4000),
  actions: z.array(z.string().min(1).max(1000)).max(5),
});