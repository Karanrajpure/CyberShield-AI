import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/workspace-client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { conversationsQuery } from "@/components/app/chat-queries";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [
    { title: "AI Security Assistant – CyberShield AI" }, { name: "description", content: "Ask CyberShield AI Assistant any cybersecurity question." },
    { property: "og:title", content: "AI Security Assistant – CyberShield AI" }, { property: "og:description", content: "Your AI cybersecurity helper." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(conversationsQuery(context.user.id)),
  component: AssistantLayout,
});

function AssistantLayout() {
  const { user } = Route.useRouteContext();
  const { data: convs } = useSuspenseQuery(conversationsQuery(user.id));
  const params = useParams({ strict: false }) as { threadId?: string };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [del, setDel] = useState<string | null>(null);

  async function confirmDelete() {
    const id = del; setDel(null);
    if (!id) return;
    const { error } = await getSupabase().from("conversations").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete conversation."); return; }
    await qc.invalidateQueries({ queryKey: ["conversations"] });
    if (params.threadId === id) navigate({ to: "/assistant" });
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="surface flex min-w-0 max-h-48 flex-col rounded-3xl p-3 lg:max-h-[calc(100vh-8rem)]">
        <Button asChild variant="hero" className="mb-2"><Link to="/assistant"><MessageSquarePlus /> New conversation</Link></Button>
        <ul className="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
          {convs.length === 0 && <li className="p-3 text-xs text-muted-foreground">No conversations yet.</li>}
          {convs.map((c) => (
            <li key={c.id} className="group flex items-center gap-1">
              <Link to="/assistant/$threadId" params={{ threadId: c.id }} className="min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground" activeProps={{ className: "min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-sm bg-accent text-foreground" }}>{c.title}</Link>
              <button aria-label="Delete conversation" onClick={() => setDel(c.id)} className="rounded-lg p-1.5 text-muted-foreground opacity-60 hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="min-w-0"><Outlet /></section>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this conversation?</AlertDialogTitle><AlertDialogDescription>All its messages will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
