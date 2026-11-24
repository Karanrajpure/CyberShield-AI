import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireWorkspaceAuth } from "./workspace-auth";
import { privacySchema, assessPrivacy } from "./privacy";
import { gradeQuiz, learningOutcome, LESSONS } from "./academy";

export const savePrivacyAssessment = createServerFn({ method: "POST" })
  .middleware([requireWorkspaceAuth])
  .inputValidator((input) => privacySchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { count, error: usageError } = await sb.from("security_scores").select("id", { count: "exact", head: true }).eq("user_id", context.userId).gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if (usageError) throw new Error("Could not check assessment usage.");
    if ((count ?? 0) >= 10) return { ok: false as const, error: "You've reached 10 assessments this hour. Please try again later." };
    const result = assessPrivacy(data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin.from("security_scores").insert({ user_id: context.userId, score: result.securityScore, assessment_data: { version: 1, answers: data, privacy_score: result.privacyScore, areas: result.areas } }).select().single();
    if (error) { console.error("Assessment save failed", error); return { ok: false as const, error: "Could not save your assessment. Please try again." }; }
    const recommendations = result.areas.map((area) => ({ user_id: context.userId, title: area.title, description: area.advice, priority: area.priority, completed: false }));
    // A repeated risk reopens the existing suggestion rather than creating duplicates.
    const recResult = recommendations.length ? await sb.from("recommendations").upsert(recommendations, { onConflict: "user_id,title" }) : { error: null };
    if (recResult.error) console.error("Recommendations save failed", recResult.error);
    return { ok: true as const, assessment: saved, warning: recResult.error ? "Your score was saved, but dashboard suggestions could not be updated. Your risk areas are still shown here." : null };
  });

export const saveLearningProgress = createServerFn({ method: "POST" })
  .middleware([requireWorkspaceAuth])
  .inputValidator((input) => z.object({ moduleId: z.string().max(40), answers: z.array(z.number().int().min(0).max(10)).max(10).optional() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    if (!LESSONS.some((lesson) => lesson.id === data.moduleId)) throw new Error("Lesson not found.");
    const sb = context.supabase;
    const graded = data.answers ? gradeQuiz(data.moduleId, data.answers) : null;
    const { data: previous, error: readError } = await sb.from("learning_progress").select("*").eq("user_id", context.userId).eq("module_id", data.moduleId).maybeSingle();
    if (readError) throw new Error("Could not load your learning progress.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin.from("learning_progress").upsert({
      user_id: context.userId, module_id: data.moduleId,
      ...learningOutcome(previous, graded?.score ?? null, new Date().toISOString()),
    }, { onConflict: "user_id,module_id" }).select().single();
    if (error) { console.error("Learning save failed", error); throw new Error("Could not save your progress. Please try again."); }
    return { progress: saved, graded };
  });