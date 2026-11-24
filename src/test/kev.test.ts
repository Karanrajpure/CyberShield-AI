import { describe, expect, it } from "vitest";
import { kevToAlerts } from "@/lib/kev";
const base = { vendorProject: "V", product: "P", vulnerabilityName: "N", shortDescription: "d", requiredAction: "Apply patch." };
describe("threat feed mapping", () => {
  it("newest first, ransomware is critical, links to the CVE source", () => {
    const a = kevToAlerts([{ ...base, cveID: "CVE-1", dateAdded: "2026-01-01" }, { ...base, cveID: "CVE-2", dateAdded: "2026-02-01", knownRansomwareCampaignUse: "Known" }]);
    expect(a[0]!.title.startsWith("CVE-2")).toBe(true);
    expect(a[0]!.severity).toBe("critical");
    expect(a[1]!.severity).toBe("high");
    expect(a[0]!.source_url).toBe("https://nvd.nist.gov/vuln/detail/CVE-2");
  });
});
