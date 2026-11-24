import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Trophy, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { LESSONS } from "@/lib/academy";
import { learningQuery } from "@/lib/education-queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/academy/")({
  head: () => ({ meta: [
    { title: "Security Academy – CyberShield AI" }, { name: "description", content: "Learn everyday cybersecurity with beginner-friendly lessons and interactive quizzes." },
    { property: "og:title", content: "Security Academy – CyberShield AI" }, { property: "og:description", content: "Build safer digital habits and track your learning progress." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(learningQuery(context.user.id)),
  errorComponent: AcademyError,
  component: Academy,
});
function AcademyError() { const router = useRouter(); return <div className="py-12 text-center"><p>We couldn't load your learning progress.</p><Button className="mt-4" onClick={() => router.invalidate()}>Try again</Button></div>; }
function Academy() {
  const { user } = Route.useRouteContext();
  const { data: progress } = useSuspenseQuery(learningQuery(user.id));
  const rows = LESSONS.map((lesson) => ({ lesson, progress: progress.find((p) => p.module_id === lesson.id) }));
  const completed = rows.filter((r) => r.progress?.completion_percentage === 100).length;
  const attempted = rows.filter((r) => r.progress?.quiz_score != null);
  const average = attempted.length ? Math.round(attempted.reduce((s, r) => s + (r.progress?.quiz_score ?? 0), 0) / attempted.length) : null;
  return <div className="space-y-8">
    <header><p className="mb-2 flex items-center gap-2 text-sm text-electric"><GraduationCap className="h-4 w-4" /> LEARN. PRACTISE. PROTECT.</p><h1 className="text-3xl font-bold">Security Academy</h1><p className="mt-2 text-muted-foreground">Everyday knowledge for a safer digital life.</p></header>
    <section className="grid grid-cols-2 gap-5 border-y border-border py-6 sm:grid-cols-3" aria-label="Learning statistics"><div><p className="text-sm text-muted-foreground">Lessons completed</p><p className="mt-2 text-3xl font-bold">{completed}<span className="text-base font-normal text-muted-foreground"> / 8</span></p></div><div><p className="text-sm text-muted-foreground">Best quiz average</p><p className="mt-2 text-3xl font-bold">{average === null ? "—" : `${average}%`}</p></div><div><p className="text-sm text-muted-foreground">Badges earned</p><p className="mt-2 text-3xl font-bold">{Number(completed >= 1) + Number(completed >= 4) + Number(completed === 8)}</p></div></section>
    <section><h2 className="mb-4 text-lg font-semibold">Your learning path</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map(({ lesson, progress: p }, index) => <article key={lesson.id} className="flex flex-col rounded-lg border border-border bg-card p-5"><div className="flex items-center justify-between"><BookOpen className="h-6 w-6 text-electric" /><span className="text-xs text-muted-foreground">{lesson.minutes} min · 0{index + 1}</span></div><p className="mt-5 text-xs text-primary">{lesson.category}</p><h3 className="mt-2 text-xl font-semibold">{lesson.title}</h3><p className="mt-2 flex-1 text-sm text-muted-foreground">{lesson.summary}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"><span className="text-xs text-muted-foreground">{p?.completion_percentage === 100 ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" />Completed</span> : p ? "In progress · 50%" : "Not started"}</span><Button asChild variant="ghost" size="sm"><Link to="/academy/$lessonId" params={{ lessonId: lesson.id }}>{p ? "Review" : "Start"}<ArrowUpRight /></Link></Button></div></article>)}</div></section>
    <section className="border-t border-border pt-6"><h2 className="mb-4 text-lg font-semibold">Achievements</h2><div className="grid gap-4 sm:grid-cols-3">{[{ title: "First line of defence", threshold: 1, text: "Complete your first lesson" }, { title: "Security explorer", threshold: 4, text: "Complete four lessons" }, { title: "Digital defender", threshold: 8, text: "Complete all eight lessons" }].map((badge) => <div key={badge.title} className={`flex gap-3 rounded-lg border p-4 ${completed >= badge.threshold ? "border-success/40 bg-success/5" : "border-border"}`}><Trophy className={`h-6 w-6 shrink-0 ${completed >= badge.threshold ? "text-success" : "text-muted-foreground"}`} /><div><h3 className="font-medium">{badge.title}</h3><p className="mt-1 text-xs text-muted-foreground">{completed >= badge.threshold ? "Earned" : badge.text}</p></div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Complete a lesson by answering both quiz questions correctly. Badges recognise learning, not professional certification.</p></section>
  </div>;
}