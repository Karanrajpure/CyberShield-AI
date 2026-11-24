import { createServerFn } from "@tanstack/react-start";
import { requireWorkspaceAuth } from "./workspace-auth";

const TABLES = ["messages", "conversations", "url_scans", "email_scans", "security_scores", "recommendations", "learning_progress", "reports"] as const;

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireWorkspaceAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    for (const bucket of ["reports", "avatars"]) {
      const { data } = await sb.storage.from(bucket).list(context.userId, { limit: 1000 });
      if (data?.length) await sb.storage.from(bucket).remove(data.map((f) => `${context.userId}/${f.name}`));
    }
    for (const t of TABLES) {
      const { error } = await sb.from(t).delete().eq("user_id", context.userId);
      if (error) { console.error("Delete failed", t, error); throw new Error("Could not delete your data. Please try again."); }
    }
    if (context.accountType === "workspace") {
      const { error } = await sb.from("workspace_profiles").delete().eq("id", context.userId);
      if (error) throw new Error("Could not remove your profile. Please try again.");
    }
    return { ok: true };
  });
