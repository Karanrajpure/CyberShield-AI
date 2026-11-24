import { queryOptions } from "@tanstack/react-query";
import { getSupabase } from "@/lib/workspace-client";
import { getViewer } from "./viewer.functions";

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const viewer = await getViewer();
      if (viewer?.accountType !== "workspace") return null;
      const { data, error } = await getSupabase().from("workspace_profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
