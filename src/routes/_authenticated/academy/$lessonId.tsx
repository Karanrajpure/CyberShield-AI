import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { LESSONS, type Lesson } from "@/lib/academy";
import { learningQuery } from "@/lib/education-queries";
import { saveLearningProgress } from "@/lib/education.functions";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/_authenticated/academy/$lessonId")({
  head: ({ params }) => {
    const lesson = LESSONS.find((l) => l.id === params.lessonId);
    const title = `${lesson?.title ?? "Lesson"} – CyberShield AI Academy`;
    const description = lesson?.summary ?? "Beginner-friendly cybersecurity learning.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  loader: ({ context, params }) => {
    if (!LESSONS.some((l) => l.id === params.lessonId)) throw notFound();
    return context.queryClient.ensureQueryData(learningQuery(context.user.id));
  },
  errorComponent: LessonError,
  notFoundComponent: () => <div className="space-y-4"><h1 className="text-2xl font-bold">Lesson not found</h1><Button asChild><Link to="/academy">Back to Academy</Link></Button></div>,
  component: LessonPage,
});
function LessonError() { const router = useRouter(); return <div className="py-12 text-center"><p>We couldn't load this lesson.</p><Button className="mt-4" onClick={() => router.invalidate()}>Try again</Button></div>; }
function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = LESSONS.find((l) => l.id === lessonId);
  return lesson ? <LessonContent key={lessonId} lesson={lesson} /> : null;
}
function LessonContent({ lesson }: { lesson: Lesson }) {
  const { user } = Route.useRouteContext();
  const { data: progress } = useSuspenseQuery(learningQuery(user.id));
  const existing = progress.find((p) => p.module_id === lesson.id);
  const [quiz, setQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; correct: boolean[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveLearningProgress);
  const qc = useQueryClient();
  const next = LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1];
  async function persist(submitQuiz: boolean) {
    setBusy(true);
    try {
      const response = await save({ data: { moduleId: lesson.id, ...(submitQuiz ? { answers: lesson.quiz.map((_, i) => answers[i] ?? -1) } : {}) } });
      await qc.invalidateQueries({ queryKey: ["learning", user.id] });
      if (submitQuiz) { setResult(response.graded); toast.success("Quiz result saved."); } else setQuiz(true);
    } catch { toast.error("Could not save your progress. Please try again."); } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-3xl space-y-8">
    <Button asChild variant="ghost" className="px-0"><Link to="/academy"><ArrowLeft />Security Academy</Link></Button>
    <header><p className="mb-2 text-sm text-electric">{lesson.category} · {lesson.minutes} min</p><h1 className="text-3xl font-bold">{lesson.title}</h1><p className="mt-3 text-muted-foreground">{lesson.summary}</p>{existing?.completion_percentage === 100 && <p className="mt-3 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Completed · best quiz score {existing.quiz_score}%</p>}</header>
    {!quiz ? <><div className="space-y-8 border-y border-border py-8">{lesson.sections.map((section) => <section key={section.title}><h2 className="mb-3 text-xl font-semibold">{section.title}</h2><p className="leading-7 text-muted-foreground">{section.text}</p></section>)}</div><Button variant="hero" disabled={busy} onClick={() => persist(false)}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}Take the quiz</Button></> : <section className="space-y-6" aria-label="Lesson quiz">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Knowledge check</h2><Button variant="ghost" size="sm" disabled={busy} onClick={() => setQuiz(false)}>Review lesson</Button></div>
      {result && <div role="status" className={`rounded-lg border p-5 ${result.score === 100 ? "border-success/40 bg-success/10" : "border-warning/40 bg-warning/10"}`}><p className="text-2xl font-bold">Quiz score: {result.score}%</p><p className="mt-2 text-sm">{result.score === 100 ? "Lesson complete. Great work!" : "Review the explanations, then try again. Both answers must be correct to complete this lesson."}</p></div>}
      <div className="divide-y divide-border">{lesson.quiz.map((q, index) => <fieldset key={q.prompt} className="py-6"><legend className="sr-only">{q.prompt}</legend><h3 id={`quiz-${index}`} className="mb-4 font-medium">{index + 1}. {q.prompt}</h3><RadioGroup aria-labelledby={`quiz-${index}`} value={answers[index] === undefined ? "" : String(answers[index])} disabled={busy || result !== null} onValueChange={(value) => setAnswers((a) => ({ ...a, [index]: Number(value) }))} className="gap-3">{q.options.map((option, optionIndex) => <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm ${result && optionIndex === q.correct ? "border-success/50 bg-success/10" : "border-border"}`}><RadioGroupItem value={String(optionIndex)} className="mt-0.5" /><span>{option}</span></label>)}</RadioGroup>{result && <p className="mt-4 text-sm text-muted-foreground"><span className={result.correct[index] ? "text-success" : "text-warning"}>{result.correct[index] ? "Correct. " : "Not quite. "}</span>{q.explanation}</p>}</fieldset>)}</div>
      {!result ? <Button variant="hero" disabled={busy || Object.keys(answers).length !== lesson.quiz.length} onClick={() => persist(true)}>{busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Check answers</Button> : <div className="flex flex-wrap gap-3"><Button variant="glass" onClick={() => { setAnswers({}); setResult(null); }}><RotateCcw />Try again</Button>{next && result.score === 100 && <Button asChild variant="hero"><Link to="/academy/$lessonId" params={{ lessonId: next.id }}>Next lesson<ArrowRight /></Link></Button>}<Button asChild variant="ghost"><Link to="/academy">All lessons</Link></Button></div>}
    </section>}
  </div>;
}