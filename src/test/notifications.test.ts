import { describe, it, expect } from "vitest";
import { parsePrefs, privacyReminderDue } from "@/lib/notifications";
describe("notifications", () => {
  it("reminds after 30 days", () => {
    const now = Date.parse("2026-11-19T00:00:00Z");
    expect(privacyReminderDue("2026-10-19T00:00:00Z", now)).toBe(true);
    expect(privacyReminderDue("2026-11-01T00:00:00Z", now)).toBe(false);
    expect(privacyReminderDue(null, now)).toBe(true);
  });
  it("respects turned-off settings", () => {
    expect(parsePrefs({ threat_alerts: false, privacy_reminder: true })).toEqual({ threat_alerts: false, privacy_reminder: true });
  });
});
