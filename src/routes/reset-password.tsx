import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password – CyberShield AI" },
      { name: "description", content: "Choose a new password for your CyberShield AI account." },
      { property: "og:title", content: "Reset password – CyberShield AI" },
      { property: "og:description", content: "Securely reset your password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  return <div className="grid min-h-screen place-items-center px-4">
    <div className="max-w-md text-center">
      <div className="mb-8 flex justify-center"><Logo /></div>
      <h1 className="text-2xl font-bold">Lovable account security</h1>
      <p className="mt-4 text-sm text-muted-foreground">Your password is managed by Lovable, not CyberShield AI.</p>
      <Button asChild variant="hero" className="mt-6"><a href="https://lovable.dev" rel="noopener noreferrer">Open Lovable</a></Button>
      <p className="mt-6 text-sm"><Link to="/dashboard">Back to CyberShield AI</Link></p>
    </div>
  </div>;
}
