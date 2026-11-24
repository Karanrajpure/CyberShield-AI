import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_LIMITS } from "@/lib/limits";

export function ChatComposer({ onSend, busy }: { onSend: (t: string) => void; busy: boolean }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!busy) ref.current?.focus(); }, [busy]);
  function submit(e?: FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    onSend(t); setText("");
  }
  function key(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }
  return (
    <form onSubmit={submit} className="surface flex items-end gap-2 rounded-2xl p-2">
      <textarea ref={ref} autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={key} rows={1} maxLength={CHAT_LIMITS.maxMessageLength}
        placeholder="Ask about phishing, passwords, Wi-Fi… (never share passwords or OTPs)" aria-label="Message"
        className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground field-sizing-content" />
      <Button type="submit" variant="hero" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={busy || !text.trim()} aria-label="Send">
        {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
      </Button>
    </form>
  );
}
