import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** One full-screen chapter of the scroll story; text fades in over the pinned 3D scene. */
export function ScrollSection({ eyebrow, title, children, align = "left" }: { eyebrow: string; title: string; children: ReactNode; align?: "left" | "right" | "center" }) {
  const reduce = useReducedMotion();
  const pos = align === "center" ? "mx-auto text-center" : align === "right" ? "lg:ml-auto" : "";
  return (
    <div className="relative flex min-h-screen items-end px-4 pb-24 sm:px-6 lg:items-center lg:pb-0">
      <motion.div
        className={`surface backdrop-blur-xl w-full max-w-md rounded-2xl p-6 ${pos}`}
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.5 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <div className="mt-3 text-muted-foreground">{children}</div>
      </motion.div>
    </div>
  );
}
