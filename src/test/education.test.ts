import { describe, expect, it } from "vitest";
import { PRIVACY_QUESTIONS, assessPrivacy, privacySchema, type PrivacyAnswers } from "@/lib/privacy";
import { LESSONS, gradeQuiz, learningOutcome } from "@/lib/academy";

const all = (value: "yes" | "sometimes" | "no" | "unsure") => Object.fromEntries(PRIVACY_QUESTIONS.map((q) => [q.id, value])) as PrivacyAnswers;
describe("privacy assessment", () => {
  it("awards 100 only for all positive habits", () => { expect(assessPrivacy(all("yes")).securityScore).toBe(100); expect(assessPrivacy(all("yes")).privacyScore).toBe(100); });
  it("scores partial habits at half weight", () => { expect(assessPrivacy(all("sometimes")).securityScore).toBe(50); expect(assessPrivacy(all("sometimes")).privacyScore).toBe(50); });
  it("does not treat uncertainty as safety", () => { expect(assessPrivacy(all("unsure")).securityScore).toBe(0); expect(assessPrivacy(all("no")).areas).toHaveLength(7); });
  it("includes all seven requested habits", () => { expect(PRIVACY_QUESTIONS.map((q) => q.id)).toEqual(["passwords", "twoFactor", "updates", "permissions", "wifi", "social", "manager"]); });
  it("weights privacy controls differently from account security", () => { const result = assessPrivacy({ ...all("yes"), permissions: "no", social: "no" }); expect(result.securityScore).toBe(85); expect(result.privacyScore).toBe(50); });
  it("rejects incomplete answers and submitted scores", () => { expect(privacySchema.safeParse({ passwords: "yes" }).success).toBe(false); expect(privacySchema.safeParse({ ...all("yes"), score: 100 }).success).toBe(false); });
});
describe("Academy grading", () => {
  it("covers all eight learning categories", () => { expect(LESSONS.map((l) => l.category)).toEqual(["Cybersecurity basics", "Phishing awareness", "Password protection", "Network security", "Social engineering", "Mobile security", "Safe browsing", "Digital privacy"]); });
  it("grades answers rather than trusting client scores", () => { for (const lesson of LESSONS) { expect(gradeQuiz(lesson.id, lesson.quiz.map((q) => q.correct)).score).toBe(100); expect(gradeQuiz(lesson.id, lesson.quiz.map((q) => (q.correct + 1) % q.options.length)).score).toBe(0); } });
  it("rejects unknown modules, missing and invalid answers", () => { expect(() => gradeQuiz("missing", [0, 0])).toThrow(); expect(() => gradeQuiz("basics", [0])).toThrow(); expect(() => gradeQuiz("basics", [-1, 1])).toThrow(); });
  it("requires both correct answers to complete a lesson", () => { expect(learningOutcome(null, 50, "2026-11-19").completion_percentage).toBe(50); expect(learningOutcome(null, 100, "2026-11-19")).toEqual({ completion_percentage: 100, quiz_score: 100, completed_at: "2026-11-19" }); });
  it("preserves completion and best score when reviewing or retaking", () => { const previous = { completion_percentage: 100, quiz_score: 100, completed_at: "2026-11-19" }; expect(learningOutcome(previous, 0, "2026-11-20")).toEqual(previous); expect(learningOutcome(previous, null, "2026-11-20")).toEqual(previous); });
});