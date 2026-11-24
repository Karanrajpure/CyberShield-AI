export type KevItem = { cveID: string; vendorProject: string; product: string; vulnerabilityName: string; dateAdded: string; shortDescription: string; requiredAction: string; knownRansomwareCampaignUse?: string };

/** Map CISA KEV entries to alert rows. Severity is grounded in the feed: all are actively exploited; ransomware use raises it to critical. */
export function kevToAlerts(items: KevItem[], limit = 40) {
  return [...items]
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, limit)
    .map((v) => ({
      title: `${v.cveID}: ${v.vulnerabilityName}`.slice(0, 300),
      description: `${v.vendorProject} ${v.product} — ${v.shortDescription}`.slice(0, 2000),
      severity: v.knownRansomwareCampaignUse === "Known" ? "critical" : "high",
      source_name: "CISA Known Exploited Vulnerabilities",
      source_url: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(v.cveID)}`,
      published_at: new Date(v.dateAdded + "T00:00:00Z").toISOString(),
      recommended_action: `If you use ${v.vendorProject} ${v.product}, install the latest update now. If no fix is available, stop using it until one is released.`.slice(0, 1000),
      category: "Vulnerability",
    }));
}
