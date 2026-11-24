export type NotificationPrefs = { threat_alerts: boolean; privacy_reminder: boolean };
export const DEFAULT_PREFS: NotificationPrefs = { threat_alerts: true, privacy_reminder: true };
export const PRIVACY_REMINDER_DAYS = 30;

export function parsePrefs(raw: unknown): NotificationPrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { threat_alerts: r['threat_alerts'] !== false, privacy_reminder: r['privacy_reminder'] !== false };
}

/** True when the user has never assessed, or their last assessment is older than the reminder window. */
export function privacyReminderDue(lastAssessed: string | null, now = Date.now()): boolean {
  if (!lastAssessed) return true;
  return now - new Date(lastAssessed).getTime() > PRIVACY_REMINDER_DAYS * 864e5;
}
