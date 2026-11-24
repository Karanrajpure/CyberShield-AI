import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Menu } from "lucide-react";
import { getViewer } from "@/lib/viewer.functions";
import { supabase } from "@/integrations/supabase/client";
import { clearWorkspaceClient } from "@/lib/workspace-client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CyberSecurityBackground } from "@/components/three/CyberSecurityBackground";
import { navItems, type NavItem } from "@/components/app/nav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const identity = await getViewer();
    if (!identity) throw redirect({ to: "/auth", search: { redirect: location.href } });
    return { user: { id: identity.userId, email: identity.email, displayName: identity.displayName, accountType: identity.accountType } };
  },
  component: AppLayout,
});

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    clearWorkspaceClient();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

function NavLinkItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const base = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition";
  if (!item.to)
    return (
      <span className={`${base} cursor-not-allowed text-sidebar-foreground/40`} aria-disabled="true">
        <item.icon className="h-4.5 w-4.5" /> {item.label}
        <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
      </span>
    );
  return (
    <Link to={item.to} onClick={onClick}
      className={`${base} text-sidebar-foreground hover:bg-sidebar-accent`}
      activeProps={{ className: `${base} bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_3px_0_0_var(--primary)]` }}>
      <item.icon className="h-4.5 w-4.5" /> {item.label}
    </Link>
  );
}

function AppLayout() {
  const signOut = useSignOut();
  const { pathname } = useLocation();
  const mobile = navItems.filter((n) => ["/dashboard", "/url-scanner", "/phishing", "/history"].includes(n.to ?? ""));
  return (
    <div className="relative isolate min-h-screen lg:pl-72">
      <CyberSecurityBackground variant="subtle" />
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <Logo />
        <nav className="mt-8 grid gap-1">{navItems.map((n) => <NavLinkItem key={n.label} item={n} />)}</nav>
        <Button variant="ghost" className="mt-auto justify-start text-muted-foreground" onClick={signOut}><ArrowLeft /> Back to home</Button>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Logo />
        <Sheet>
          <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button></SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
            <nav className="mt-8 grid gap-1">{navItems.map((n) => <NavLinkItem key={n.label} item={n} />)}</nav>
            <Button variant="ghost" className="mt-6 w-full justify-start text-muted-foreground" onClick={signOut}><ArrowLeft /> Back to home</Button>
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10"><div key={pathname} className="page-fade"><Outlet /></div></main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobile.map((n) => (
          <Link key={n.label} to={n.to ?? "/dashboard"} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" activeProps={{ className: "flex flex-col items-center gap-1 py-2.5 text-[11px] text-primary" }}>
            <n.icon className="h-5 w-5" /><span className="max-w-full truncate px-1">{n.label.replace("Phishing Detector", "Phishing").replace("URL Scanner", "Scan").replace("Scan History", "History")}</span>
          </Link>
        ))}
        <Button variant="ghost" onClick={signOut} className="h-auto flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"><ArrowLeft className="h-5 w-5" />Home</Button>
      </nav>
    </div>
  );
}
