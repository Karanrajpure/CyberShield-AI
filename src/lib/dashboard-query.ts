import { queryOptions } from "@tanstack/react-query";
import { getSupabase } from "@/lib/workspace-client";

export const dashboardQuery = (userId: string) =>
  queryOptions({
    queryKey: ["dashboard", userId],
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 864e5).toISOString();
      const [urls, msgs, scores, recs, urlCount, msgCount, flaggedCount, doneCount] = await Promise.all([
        getSupabase().from("url_scans").select("id, submitted_url, domain, risk_level, scanned_at").gte("scanned_at", since).order("scanned_at", { ascending: false }).limit(500),
        getSupabase().from("email_scans").select("id, content_type, risk_level, risk_score, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
        getSupabase().from("security_scores").select("score, created_at").order("created_at", { ascending: false }).limit(30),
        getSupabase().from("recommendations").select("id, title, priority, completed, created_at").order("created_at", { ascending: false }).limit(20),
        getSupabase().from("url_scans").select("id", { count: "exact", head: true }),
        getSupabase().from("email_scans").select("id", { count: "exact", head: true }),
        getSupabase().from("url_scans").select("id", { count: "exact", head: true }).in("risk_level", ["suspicious", "high"]),
        getSupabase().from("recommendations").select("id", { count: "exact", head: true }).eq("completed", true),
      ]);
      for (const r of [urls, msgs, scores, recs, urlCount, msgCount, flaggedCount, doneCount]) if (r.error) throw r.error;
      return {
        urls: urls.data ?? [], msgs: msgs.data ?? [], scores: (scores.data ?? []).reverse(), recs: recs.data ?? [],
        totals: { urls: urlCount.count ?? 0, suspicious: flaggedCount.count ?? 0, messages: msgCount.count ?? 0, done: doneCount.count ?? 0 },
      };
    },
  });
