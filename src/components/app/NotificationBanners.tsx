import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Lock } from "lucide-react";
import { getSupabase } from "@/lib/workspace-client";
import { parsePrefs, privacyReminderDue } from "@/lib/notifications";

export function NotificationBanners({ prefs, lastAssessed }: { prefs: unknown; lastAssessed: string | null }) {
  const p = parsePrefs(prefs);
  const { data: newAlerts = 0 } = useQuery({
    queryKey: ["threat_alerts", "new-week"],
    enabled: p.threat_alerts,
    queryFn: async () => {
      const { count } = await getSupabase().from("threat_alerts").select("id", { count: "exact", head: true }).gte("published_at", new Date(Date.now() - 7 * 864e5).toISOString());
      return count ?? 0;
    },
  });
  const remind = p.privacy_reminder && privacyReminderDue(lastAssessed);
  if (!(p.threat_alerts && newAlerts > 0) && !remind) return null;
  return <div className="grid gap-3">
    {p.threat_alerts && newAlerts > 0 && <Link to="/threats" className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm"><Bell className="h-5 w-5 text-warning" /><span>{newAlerts} new actively exploited {newAlerts === 1 ? "vulnerability was" : "vulnerabilities were"} reported by CISA this week. Review them</span></Link>}
    {remind && <Link to="/privacy" className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm"><Lock className="h-5 w-5 text-primary" /><span>{lastAssessed ? "It's been over 30 days since your last privacy check. Retake it to keep your score current." : "Take the privacy check to get your first security score."}</span></Link>}
  </div>;
}
