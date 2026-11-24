import { CyberSecurityBackground } from "@/components/three/CyberSecurityBackground";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getPublicViewer } from "@/lib/public-viewer";
import { safeRedirect } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { GoogleSignIn } from "@/components/app/GoogleSignIn";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const user = await getPublicViewer();
    if (user) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({
    meta: [
      { title: "Sign in – CyberShield AI" },
      { name: "description", content: "Sign in or create your CyberShield AI account." },
      { property: "og:title", content: "Sign in – CyberShield AI" },
      { property: "og:description", content: "Access your personal digital security center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <CyberSecurityBackground variant="auth" />
      <div className="relative w-full max-w-md text-center">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <h1 className="text-2xl font-bold">Keep your security history private</h1>
        <p className="mt-4 text-sm text-muted-foreground">Sign in or create an account with Google. No extra profile details required.</p>
        <div className="mt-6"><GoogleSignIn /></div>
        <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/try">Try without an account</Link></Button>
        <p className="mt-6 text-xs text-muted-foreground">Already using a Lovable account? Sign in to lovable.dev in this browser, then return here.</p>
        <Button asChild variant="glass" className="mt-3"><a href="https://lovable.dev" rel="noopener noreferrer">Open Lovable</a></Button>
        <p className="mt-6 text-xs text-muted-foreground"><Link to="/">Back to home</Link></p>
      </div>
    </div>
  );
}
