import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "./auth.server";

export type Viewer = { userId: string; email: string | null; displayName: string | null; accountType: "workspace" | "visitor" };

/** Workspace identity takes priority. Never merge identities by email or name. */
export async function resolveViewer(): Promise<{ viewer: Viewer; token: string } | null> {
  const request = getRequest();
  const member = await getSessionUser();
  if (member) {
    const token = request.headers.get("x-lovable-identity-token");
    if (!token) return null;
    return { viewer: { userId: member.userId, email: member.email ?? null, displayName: member.displayName ?? null, accountType: "workspace" }, token };
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Account access is unavailable.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { viewer: { userId: data.user.id, email: data.user.email ?? null, displayName: null, accountType: "visitor" }, token };
}