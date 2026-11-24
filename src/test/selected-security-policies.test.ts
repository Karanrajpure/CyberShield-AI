import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("drizzle/migrations/0006_scope_selected_security_policies.sql", "utf8");

describe("selected security policy regressions", () => {
  it.each(["messages", "learning_progress", "security_scores"])("limits %s client policies to owner reads and deletes", (table) => {
    expect(sql).toContain(`DROP POLICY IF EXISTS "own rows" ON public.${table}`);
    const policies = sql.split(";").filter((statement) => statement.includes("CREATE POLICY") && statement.includes(`ON public.${table} `));
    expect(policies).toHaveLength(2);
    expect(policies.some((statement) => statement.includes("FOR SELECT"))).toBe(true);
    expect(policies.some((statement) => statement.includes("FOR DELETE"))).toBe(true);
    for (const policy of policies) expect(policy).toContain("TO authenticated USING (auth.uid() = user_id)");
    expect(sql).toContain("REVOKE INSERT, UPDATE ON public.messages, public.learning_progress, public.security_scores FROM authenticated, anon");
  });

  it("restricts shared alerts to public CISA vulnerability references", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "signed-in read" ON public.threat_alerts');
    expect(sql).toContain("source_name = 'CISA Known Exploited Vulnerabilities'");
    expect(sql).toContain("category = 'Vulnerability'");
    expect(sql).toContain("source_url ~ '^https://nvd[.]nist[.]gov/vuln/detail/CVE-[0-9]{4}-[0-9]{4,}$'");
    expect(sql).not.toMatch(/USING\s*\(true\)/i);
  });
});