import { createMiddleware } from "@tanstack/react-start";

export const requireWorkspaceAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { resolveViewer } = await import("./viewer.server");
  const access = await resolveViewer();
  if (!access) throw new Error("Sign in to access your saved data.");
  const { viewer, token } = access;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) throw new Error("Account access is unavailable.");
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient<import("@/integrations/supabase/types").Database>(url, key, {
    accessToken: async () => token,
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return next({ context: { supabase, userId: viewer.userId, accountType: viewer.accountType } });
});