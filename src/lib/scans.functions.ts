import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireWorkspaceAuth } from "./workspace-auth";
import { LIMITS, MAX_MESSAGE_LENGTH, MAX_URL_LENGTH } from "./limits";
import { parseUserUrl, analyseUrlStructure, classify, recommendedActions, type ProviderStatus, type Risk } from "./url-analysis";
import { analyseMessageHeuristics, riskFromScore } from "./message-analysis";
import { virusTotalVerdict } from "./provider-validation";

type SB = { from: (t: string) => any };

async function countSince(sb: SB, table: string, col: string, userId: string) {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await sb.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId).gte(col, since);
  if (error) throw new Error("Could not check usage limits.");
  return count ?? 0;
}

async function virusTotalLookup(url: string): Promise<ProviderStatus> {
  const key = process.env["VIRUSTOTAL_API_KEY"];
  const name = "VirusTotal";
  if (!key) return { name, status: "unavailable", detail: "Not configured" };
  try {
    const id = btoa(Array.from(new TextEncoder().encode(url), (byte) => String.fromCharCode(byte)).join("")).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, { headers: { "x-apikey": key }, redirect: "manual", signal: AbortSignal.timeout(6000) });
    if (res.status === 404) return await virusTotalSubmit(url, key);
    if (!res.ok) return { name, status: "unavailable", detail: "Service error" };
    return virusTotalVerdict(await res.json());
  } catch {
    return { name, status: "unavailable", detail: "Service unreachable" };
  }
}

// No existing report: ask VirusTotal (not us) to analyse the URL, then poll briefly.
async function virusTotalSubmit(url: string, key: string): Promise<ProviderStatus> {
  const name = "VirusTotal";
  const sub = await fetch("https://www.virustotal.com/api/v3/urls", {
    method: "POST", redirect: "manual", signal: AbortSignal.timeout(6000),
    headers: { "x-apikey": key, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ url }).toString(),
  });
  if (!sub.ok) return { name, status: "unavailable", detail: "Could not submit for analysis" };
  const analysisId = ((await sub.json()) as { data?: { id?: unknown } })?.data?.id;
  if (typeof analysisId !== "string" || !/^[\w=-]+$/.test(analysisId)) return { name, status: "unavailable", detail: "Invalid provider response" };
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const r = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, { headers: { "x-apikey": key }, redirect: "manual", signal: AbortSignal.timeout(6000) });
    if (!r.ok) continue;
    const j = (await r.json()) as { data?: { attributes?: { status?: string; stats?: unknown } } };
    if (j?.data?.attributes?.status === "completed") return virusTotalVerdict({ data: { attributes: { last_analysis_stats: j.data.attributes.stats } } });
  }
  return { name, status: "unavailable", detail: "Analysis still running — scan again in a minute" };
}

export const scanUrl = createServerFn({ method: "POST" })
  .middleware([requireWorkspaceAuth])
  .inputValidator((d) => z.object({ url: z.string().min(1).max(MAX_URL_LENGTH) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as SB;
    const parsed = parseUserUrl(data.url);
    if (!parsed.ok) return { ok: false as const, error: parsed.error };
    if ((await countSince(sb, "url_scans", "scanned_at", context.userId)) >= LIMITS.urlScansPerHour)
      return { ok: false as const, error: `You've reached ${LIMITS.urlScansPerHour} URL scans this hour. Please try again later.` };

    const p = parsed.value;
    const { indicators, score } = analyseUrlStructure(p);
    const providers: ProviderStatus[] = await Promise.all([virusTotalLookup(p.normalized)]);
    for (const pr of providers) if (pr.status === "match") indicators.unshift({ id: "provider_" + pr.name, label: `${pr.name} reports this link as dangerous${pr.detail ? ` (${pr.detail})` : ""}`, severity: "danger" });
    for (const pr of providers) if (pr.status === "suspicious") indicators.unshift({ id: "provider_" + pr.name, label: `${pr.name} reports suspicious activity${pr.detail ? ` (${pr.detail})` : ""}`, severity: "warning" });
    const { risk, score: finalScore } = classify(score, providers);
    const allUnavailable = providers.every((x) => x.status === "unavailable");
    const explanation =
      risk === "high" ? "This link shows strong signs of being dangerous." :
      risk === "suspicious" ? "This link has characteristics commonly seen in scams." :
      risk === "low" ? "No known threats were found for this link. This does not guarantee it is safe." :
      "We couldn't confirm this link with a threat intelligence service, and its structure didn't raise major red flags. Unknown does not mean safe.";

    const row = {
      user_id: context.userId, submitted_url: p.normalized, domain: p.domain, risk_level: risk, risk_score: finalScore,
      indicators, provider_result: { providers, explanation, actions: recommendedActions(risk) },
      scan_status: allUnavailable ? "partial" : "completed",
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin.from("url_scans").insert(row).select().single();
    if (error) { console.error(error); return { ok: false as const, error: "Could not save the scan. Please try again." }; }
    return { ok: true as const, scan: { id: saved.id, scanned_at: saved.scanned_at, submitted_url: p.normalized, domain: p.domain, risk_level: risk, risk_score: finalScore, scan_status: row.scan_status, indicators, provider_result: { providers, explanation, actions: recommendedActions(risk) } } };
  });

export const analyseMessage = createServerFn({ method: "POST" })
  .middleware([requireWorkspaceAuth])
  .inputValidator((d) => z.object({
    content: z.string().trim().min(10, "Paste at least a sentence.").max(MAX_MESSAGE_LENGTH),
    contentType: z.enum(["email", "sms", "whatsapp", "social", "other"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as SB;
    if ((await countSince(sb, "email_scans", "created_at", context.userId)) >= LIMITS.messageScansPerHour)
      return { ok: false as const, error: `You've reached ${LIMITS.messageScansPerHour} message analyses this hour. Please try again later.` };

    const h = analyseMessageHeuristics(data.content);
    const { aiPhishingAssessment } = await import("./ai.server");
    const ai = await aiPhishingAssessment(data.content, data.contentType);
    const score = ai ? Math.round(ai.risk_score * 0.6 + h.score * 0.4) : h.score;
    const risk: Risk = ai || h.score > 0 ? riskFromScore(score) : "unknown";
    const indicators = [
      ...h.indicators,
      ...(ai?.warning_signs ?? []).map((s, i) => ({ id: "ai_" + i, label: s, severity: "warning" as const })),
    ];
    const phrases = Array.from(new Set([...h.phrases, ...(ai?.suspicious_phrases ?? [])])).slice(0, 15);
    const explanation = ai?.explanation ?? "AI analysis is temporarily unavailable, so this result is based on pattern checks only.";
    const actions = ai?.actions?.length ? ai.actions : risk === "low"
      ? ["No strong warning signs found, but stay cautious.", "Never share passwords or OTPs, even if the sender seems genuine."]
      : ["Don't click links or reply.", "Contact the company through its official app or website.", "Never share OTPs, passwords or card details."];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin.from("email_scans").insert({
      user_id: context.userId, content_type: data.contentType, submitted_content: data.content,
      risk_level: risk, risk_score: score,
      indicators: { items: indicators, phrases, links: h.links, actions, ai_available: !!ai },
      ai_explanation: explanation,
    }).select().single();
    if (error) { console.error(error); return { ok: false as const, error: "Could not save the analysis. Please try again." }; }
    return { ok: true as const, scan: { id: saved.id, risk_level: risk, risk_score: score, created_at: saved.created_at, content_type: data.contentType, ai_explanation: explanation, indicators: { items: indicators, phrases, links: h.links, actions, ai_available: !!ai } } };
  });
