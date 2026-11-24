import { queryOptions } from "@tanstack/react-query";
import { getSupabase } from "@/lib/workspace-client";

export const conversationsQuery = (uid: string) => queryOptions({
  queryKey: ["conversations", uid],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("conversations").select("id, title, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data;
  },
});

export const messagesQuery = (threadId: string) => queryOptions({
  queryKey: ["messages", threadId],
  queryFn: async () => {
    const { data, error } = await getSupabase().from("messages").select("id, role, content, created_at").eq("conversation_id", threadId).order("created_at");
    if (error) throw error;
    return data;
  },
});

export async function createConversation() {
  const { data, error } = await getSupabase().from("conversations").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}

export const SUGGESTED = [
  "How do I identify phishing?",
  "How do I protect my Instagram account?",
  "What is two-factor authentication?",
  "How do I secure my home Wi-Fi?",
  "What should I do after clicking a suspicious link?",
  "How can I improve my digital privacy?",
];
