import { queryOptions } from "@tanstack/react-query";
import { getSupabase } from "@/lib/workspace-client";

export const assessmentsQuery = (userId: string) => queryOptions({
  queryKey: ["assessments", userId],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("security_scores").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data;
  },
});
export const learningQuery = (userId: string) => queryOptions({
  queryKey: ["learning", userId],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("learning_progress").select("*").eq("user_id", userId);
    if (error) throw error;
    return data;
  },
});