import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bot } from "lucide-react";
import { ChatComposer } from "@/components/app/ChatComposer";
import { createConversation, SUGGESTED } from "@/components/app/chat-queries";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/assistant/")({
  head: () => ({ meta: [
    { title: "Ask a Security Question – CyberShield AI" }, { name: "description", content: "Start a private conversation about digital security." },
    { property: "og:title", content: "Ask a Security Question – CyberShield AI" }, { property: "og:description", content: "Practical AI guidance for staying safe online." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: NewChat,
});

function NewChat() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function start(text: string) {
    setBusy(true);
    try {
      const id = await createConversation();
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/assistant/$threadId", params: { threadId: id }, search: { initial: text } });
    } catch { toast.error("Couldn't start a conversation."); setBusy(false); }
  }
  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand shadow-glow"><Bot className="h-8 w-8 text-primary-foreground" /></span>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">CyberShield AI Assistant</h1>
        <p className="mt-2 max-w-md text-muted-foreground">Ask anything about staying safe online. Answers are guidance, not guarantees.</p>
        <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
          {SUGGESTED.map((s) => (
            <button key={s} disabled={busy} onClick={() => start(s)} className="rounded-2xl border border-border p-4 text-left text-sm transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50">{s}</button>
          ))}
        </div>
      </div>
      <ChatComposer onSend={start} busy={busy} />
    </div>
  );
}
