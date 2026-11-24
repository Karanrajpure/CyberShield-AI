import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getViewerAccess } from "./viewer.functions";

let client: SupabaseClient<Database> | null = null;
let cachedToken: string | null = null;
let tokenExp = 0;

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Account storage is unavailable.");
    client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      accessToken: async () => {
        if (!cachedToken || Date.now() / 1000 >= tokenExp - 30) {
          cachedToken = (await getViewerAccess()).token;
          tokenExp = 0;
          if (cachedToken) {
            try {
              const encoded = cachedToken.split(".")[1] ?? "";
              const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
              tokenExp = typeof payload.exp === "number" ? payload.exp : 0;
            } catch { tokenExp = 0; }
          }
        }
        if (!cachedToken) throw new Error("Sign in to access your saved data.");
        return cachedToken;
      },
    });
  }
  return client;
}

export function clearWorkspaceClient() {
  client = null;
  cachedToken = null;
  tokenExp = 0;
}