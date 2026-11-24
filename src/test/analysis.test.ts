import { describe, expect, it } from "vitest";
import { parseUserUrl, analyseUrlStructure, classify, isPrivateOrLocalHost } from "@/lib/url-analysis";
import { analyseMessageHeuristics, riskFromScore } from "@/lib/message-analysis";
import { LIMITS } from "@/lib/limits";

const parse = (s: string) => { const r = parseUserUrl(s); if (!r.ok) throw new Error(r.error); return r.value; };

describe("URL scanning", () => {
  it("normalises and extracts the domain", () => {
    const p = parse("Example.COM/path#frag");
    expect(p.normalized).toBe("https://example.com/path");
    expect(p.domain).toBe("example.com");
  });
  it("rejects non-http schemes", () => {
    expect(parseUserUrl("javascript:alert(1)").ok).toBe(false);
    expect(parseUserUrl("file:///etc/passwd").ok).toBe(false);
  });
  it("flags private network addresses", () => {
    expect(isPrivateOrLocalHost("192.168.1.1")).toBe(true);
    expect(isPrivateOrLocalHost("169.254.169.254")).toBe(true);
    expect(isPrivateOrLocalHost("example.com")).toBe(false);
  });
  it("flags brand impersonation", () => {
    expect(analyseUrlStructure(parse("https://paypal-login-verify.xyz")).indicators.map((i) => i.id)).toContain("brand_impersonation");
  });
  it("never calls a link low risk when no provider could check it", () => {
    expect(classify(0, [{ name: "VirusTotal", status: "unavailable" }]).risk).toBe("unknown");
  });
  it("a provider match is always high risk", () => {
    expect(classify(0, [{ name: "VirusTotal", status: "match" }]).risk).toBe("high");
  });
});

describe("message analysis", () => {
  it("detects OTP and urgency", () => {
    const r = analyseMessageHeuristics("URGENT: your account will be suspended. Share your OTP now.");
    expect(r.indicators.map((i) => i.id)).toEqual(expect.arrayContaining(["urgency", "otp_request"]));
    expect(riskFromScore(r.score)).not.toBe("low");
  });
  it("free plan limits", () => {
    expect(LIMITS.urlScansPerHour).toBe(20);
    expect(LIMITS.messageScansPerHour).toBe(10);
  });
});
