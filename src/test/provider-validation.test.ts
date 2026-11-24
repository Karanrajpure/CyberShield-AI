import { describe, expect, it } from "vitest";
import { virusTotalVerdict, phishingAiSchema } from "@/lib/provider-validation";
import { classify, parseUserUrl } from "@/lib/url-analysis";

const report = (stats: object) => ({ data: { attributes: { last_analysis_stats: stats } } });
describe("provider verdicts", () => {
  it("does not consider suspicious engines clean", () => {
    const verdict = virusTotalVerdict(report({ malicious: 0, suspicious: 2, harmless: 50, undetected: 10 }));
    expect(verdict.status).toBe("suspicious");
    expect(classify(0, [verdict]).risk).toBe("suspicious");
  });
  it("does not consider missing or empty engine results verified", () => {
    expect(virusTotalVerdict({}).status).toBe("unavailable");
    const verdict = virusTotalVerdict(report({ malicious: 0, suspicious: 0, harmless: 0, undetected: 0 }));
    expect(classify(0, [verdict]).risk).toBe("unknown");
  });
  it("keeps confirmed malicious results high risk", () => {
    expect(classify(0, [virusTotalVerdict(report({ malicious: 1, suspicious: 0, harmless: 0, undetected: 0 }))]).risk).toBe("high");
  });
  it("rejects embedded credentials before sending a URL to providers", () => {
    expect(parseUserUrl("https://user:password@example.com").ok).toBe(false);
  });
  it("rejects malformed AI results rather than substituting a zero risk score", () => {
    expect(phishingAiSchema.safeParse({ risk_score: "bad" }).success).toBe(false);
    expect(phishingAiSchema.safeParse({ risk_score: -1, category: "likely_safe", warning_signs: [], suspicious_phrases: [], explanation: "test", actions: [] }).success).toBe(false);
  });
});