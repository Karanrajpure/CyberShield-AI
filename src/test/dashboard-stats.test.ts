import { describe, expect, it } from "vitest";
import { riskDistribution, weeklyActivity, scoreStatus } from "@/lib/dashboard-stats";

describe("dashboard stats", () => {
  it("counts risk levels and ignores unknown values", () => {
    const d = riskDistribution([{ risk_level: "high", at: "" }, { risk_level: "high", at: "" }, { risk_level: "x", at: "" }]);
    expect(d.find((x) => x.level === "high")?.value).toBe(2);
    expect(d.reduce((s, x) => s + x.value, 0)).toBe(2);
  });
  it("buckets the last 7 days only", () => {
    const now = new Date("2026-11-19T12:00:00");
    const w = weeklyActivity([{ risk_level: "low", at: "2026-11-19T08:00:00" }, { risk_level: "low", at: "2026-11-01T08:00:00" }], [], now);
    expect(w).toHaveLength(7);
    expect(w[6]!.urls).toBe(1);
    expect(w.reduce((s, x) => s + x.urls, 0)).toBe(1);
  });
  it("labels score bands; no score means not assessed", () => {
    expect(scoreStatus(null).label).toBe("Not assessed yet");
    expect(scoreStatus(80).label).toBe("Strong");
    expect(scoreStatus(49).label).toBe("At risk");
  });
});
