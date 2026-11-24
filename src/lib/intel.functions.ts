import { createServerFn } from "@tanstack/react-start";
import { requireWorkspaceAuth } from "./workspace-auth";
import { THREAT_REFRESH_MINUTES } from "./limits";
import { kevToAlerts, type KevItem } from "./kev";

const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

/** Refresh alerts from CISA's public feed (throttled). Returns status; never fabricates alerts. */
export const refreshThreatIntel = createServerFn({ method: "POST" })
  .middleware([requireWorkspaceAuth])
  .handler(async ({ context }) => {
    const { data: latest } = await context.supabase.from("threat_alerts").select("fetched_at").order("fetched_at", { ascending: false }).limit(1).maybeSingle();
    if (latest && Date.now() - new Date(latest.fetched_at).getTime() < THREAT_REFRESH_MINUTES * 60_000) return { status: "fresh" as const };
    try {
      const res = await fetch(KEV_URL, { redirect: "manual", signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = (await res.json()) as { vulnerabilities?: KevItem[] };
      if (!Array.isArray(j.vulnerabilities)) throw new Error("Bad feed");
      const rows = kevToAlerts(j.vulnerabilities).map((r) => ({ ...r, fetched_at: new Date().toISOString() }));
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("threat_alerts").upsert(rows, { onConflict: "source_url" });
      if (error) throw error;
      return { status: "updated" as const };
    } catch (e) {
      console.error("Threat feed refresh failed", e);
      return { status: "unavailable" as const };
    }
  });
