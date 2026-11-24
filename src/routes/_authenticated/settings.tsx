import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getSupabase, clearWorkspaceClient } from "@/lib/workspace-client";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";
import { parsePrefs, type NotificationPrefs } from "@/lib/notifications";
import { deleteAccount } from "@/lib/account.functions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings – CyberShield AI" },
      { name: "description", content: "Manage your CyberShield AI profile and account." },
      { property: "og:title", content: "Settings – CyberShield AI" },
      { property: "og:description", content: "Manage your profile and account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery(context.user.id)),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const [name, setName] = useState(profile?.full_name ?? user.displayName ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await getSupabase().from("workspace_profiles").upsert({ id: user.id, full_name: name.trim().slice(0, 120) });
    setBusy(false);
    if (error) { toast.error("Could not save your profile."); return; }
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile saved.");
  }

  const removeAccount = useServerFn(deleteAccount);
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => setTheme(readTheme()), []);
  const prefs = parsePrefs(profile?.notification_prefs);
  async function setPref(key: keyof NotificationPrefs, value: boolean) {
    const { error } = await getSupabase().from("workspace_profiles").upsert({ id: user.id, notification_prefs: { ...prefs, [key]: value } });
    if (error) { toast.error("Could not save notification settings."); return; }
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }
  const { data: avatarUrl } = useQuery({
    queryKey: ["avatar", user.id, profile?.avatar_url],
    enabled: !!profile?.avatar_url,
    queryFn: async () => {
      const path = profile?.avatar_url;
      if (!path) return null;
      return (await getSupabase().storage.from("avatars").createSignedUrl(path, 3600)).data?.signedUrl ?? null;
    },
  });

  async function uploadAvatar(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { toast.error("Use a PNG, JPG or WebP image under 2 MB."); return; }
    const path = `${user.id}/avatar-${Date.now()}`;
    const up = await getSupabase().storage.from("avatars").upload(path, file, { contentType: file.type });
    if (up.error) { toast.error("Could not upload your picture."); return; }
    if (profile?.avatar_url) await getSupabase().storage.from("avatars").remove([profile.avatar_url]);
    const { error } = await getSupabase().from("workspace_profiles").upsert({ id: user.id, avatar_url: path });
    if (error) { toast.error("Could not save your picture."); return; }
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile picture updated.");
  }

  async function exportData() {
    const tables = ["workspace_profiles", "url_scans", "email_scans", "security_scores", "recommendations", "conversations", "messages", "learning_progress", "reports"] as const;
    const out: Record<string, unknown> = { exported_at: new Date().toISOString(), email: user.email };
    for (const t of tables) {
      const { data, error } = await getSupabase().from(t).select("*");
      if (error) { toast.error("Could not export your data."); return; }
      out[t] = data;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    a.download = "cybershield-data.json"; a.click(); URL.revokeObjectURL(a.href);
  }

  async function confirmDelete() {
    try { await removeAccount(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete your account."); return; }
    await logout();
    toast.success("Your CyberShield data was deleted.");
  }

  async function logout() {
    await qc.cancelQueries(); qc.clear();
    clearWorkspaceClient();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      {user.accountType === "workspace" && <form onSubmit={save} className="surface grid gap-4 rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-muted text-xl font-semibold">{avatarUrl ? <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" /> : (name || user.email || "?").charAt(0).toUpperCase()}</div>
          <Label htmlFor="av" className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm">Change picture</Label>
          <input id="av" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }} />
        </div>
        <div className="grid gap-1.5"><Label htmlFor="fn">Full name</Label><Input id="fn" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
        <div className="grid gap-1.5"><Label htmlFor="em">Email</Label><Input id="em" value={user.email ?? ""} disabled /></div>
        <Button type="submit" variant="hero" disabled={busy} className="justify-self-start">Save changes</Button>
      </form>}
      <section className="surface grid gap-4 rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex gap-2">{(["dark", "light"] as const).map((t) => <Button key={t} variant={theme === t ? "hero" : "glass"} onClick={() => { applyTheme(t); setTheme(t); }}>{t === "dark" ? "Dark" : "Light"}</Button>)}</div>
      </section>
      {user.accountType === "workspace" && <section className="surface grid gap-4 rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">Shown on your dashboard. We don't send emails or push messages.</p>
        <label className="flex items-center justify-between gap-4 text-sm"><span>New threat alerts from CISA this week</span><Switch checked={prefs.threat_alerts} onCheckedChange={(v) => setPref("threat_alerts", v)} /></label>
        <label className="flex items-center justify-between gap-4 text-sm"><span>Remind me to retake the privacy check every 30 days</span><Switch checked={prefs.privacy_reminder} onCheckedChange={(v) => setPref("privacy_reminder", v)} /></label>
      </section>}
      <section className="surface grid gap-3 rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">{user.accountType === "workspace" ? "Your sign-in is managed by your Lovable account." : "You signed in with Google. No extra profile details are stored."}</p>
        <div className="flex flex-wrap gap-2">
          
          <Button variant="destructive" onClick={logout}>Back to home</Button>
        </div>
      </section>
      <section className="surface grid gap-3 rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="text-sm text-muted-foreground">Download everything we store about you, or permanently delete your CyberShield data. Your Lovable account is not deleted.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="glass" onClick={exportData}>Export my data</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">Delete my data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete your CyberShield data?</AlertDialogTitle><AlertDialogDescription>This permanently removes your scans, chats, assessments, reports and profile. It can't be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Delete permanently</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}
