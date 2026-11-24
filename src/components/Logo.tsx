import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="CyberShield AI home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
        <ShieldCheck className="h-5 w-5 text-primary-foreground" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">
          CyberShield <span className="text-gradient-brand">AI</span>
        </span>
      )}
    </Link>
  );
}
