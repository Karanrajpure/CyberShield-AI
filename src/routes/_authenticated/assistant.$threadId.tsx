import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Bot, Check, Copy } from "lucide-react";
import { sendChatMessage } from "@/lib/chat.functions";
import { messagesQuery } from "@/components/app/chat-queries";
import { ChatComposer } from "@/components/app/ChatComposer";

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  head: () => ({ meta: [
    { title: "Security Conversation – CyberShield AI" }, { name: "description", content: "Your private cybersecurity conversation." },
    { property: "og:title", content: "Security Conversation – CyberShield AI" }, { property: "og:description", content: "Private guidance for staying safe online." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: (s: Record<string, unknown>): { initial?: string | undefined } => ({ initial: typeof s["initial"] === "string" ? s["initial"].slice(0, 4000) : undefined }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(messagesQuery(params.threadId)),
  errorComponent: () => <p className="surface rounded-3xl p-8 text-center text-sm">This conversation couldn't be loaded.</p>,
  component: Thread,
});

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" aria-label="Copy answer">
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{ok ? "Copied" : "Copy"}
    </button>
  );
}

function Thread() {
  const { threadId } = Route.useParams();
  const { initial } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const send = useServerFn(sendChatMessage);
  const { data: msgs } = useSuspenseQuery(messagesQuery(threadId));
  const [pending, setPending] = useState<string | null>(null);
  const sentInitial = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function ask(text: string) {
    setPending(text);
    try {
      const r = await send({ data: { conversationId: threadId, content: text } });
      if (!r.ok) toast.error(r.error);
    } catch { toast.error("Something went wrong. Please try again."); }
    finally {
      setPending(null);
      void qc.invalidateQueries({ queryKey: ["messages", threadId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    }
  }

  useEffect(() => {
    if (initial && !sentInitial.current) {
      sentInitial.current = true;
      navigate({ to: ".", search: {}, replace: true });
      void ask(initial);
    }
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, pending]);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-5 pb-6">
        {msgs.length === 0 && !pending && <p className="py-16 text-center text-sm text-muted-foreground">Ask your first question below.</p>}
        {msgs.map((m) => m.role === "user" ? (
          <div key={m.id} className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div></div>
        ) : (
          <div key={m.id} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-brand"><Bot className="h-4 w-4 text-primary-foreground" /></span>
            <div className="min-w-0 flex-1">
              <div className="prose-chat text-sm leading-relaxed"><ReactMarkdown skipHtml>{m.content}</ReactMarkdown></div>
              <CopyBtn text={m.content} />
            </div>
          </div>
        ))}
        {pending && <>
          <div className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{pending}</div></div>
          <div className="flex gap-3" aria-live="polite">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-brand"><Bot className="h-4 w-4 text-primary-foreground" /></span>
            <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
          </div>
        </>}
        <div ref={bottom} />
      </div>
      <div className="sticky bottom-20 lg:bottom-4"><ChatComposer onSend={ask} busy={!!pending} /></div>
    </div>
  );
}
