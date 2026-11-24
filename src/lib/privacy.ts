import { z } from "zod";

export const PRIVACY_QUESTIONS = [
  { id: "passwords", question: "Do you use a unique password for every account?", title: "Use unique passwords", advice: "Replace reused passwords with a different long password for every account.", security: 20, privacy: 10, priority: "high" },
  { id: "twoFactor", question: "Do you enable two-factor authentication?", title: "Enable two-factor authentication", advice: "Turn on an authenticator app or passkey wherever supported, especially for email and banking.", security: 20, privacy: 10, priority: "high" },
  { id: "updates", question: "Do you keep your devices and apps updated?", title: "Keep devices updated", advice: "Enable automatic updates for your operating system, browser and apps.", security: 15, privacy: 10, priority: "high" },
  { id: "permissions", question: "Do you review application permissions?", title: "Review app permissions", advice: "Remove unnecessary access to your location, microphone, camera and contacts.", security: 10, privacy: 25, priority: "medium" },
  { id: "wifi", question: "Do you use secure Wi-Fi?", title: "Secure your Wi-Fi", advice: "Use WPA2 or WPA3 at home. Avoid sensitive activity on untrusted public networks.", security: 15, privacy: 10, priority: "medium" },
  { id: "social", question: "Do you review social media privacy settings?", title: "Review social privacy", advice: "Limit who can see posts, your contact details and your location; review tagged posts.", security: 5, privacy: 25, priority: "medium" },
  { id: "manager", question: "Do you use a password manager?", title: "Use a password manager", advice: "Choose a reputable password manager to generate and store unique passwords, and protect it with two-factor authentication.", security: 15, privacy: 10, priority: "medium" },
] as const;

export const answerSchema = z.enum(["yes", "sometimes", "no", "unsure"]);
export const privacySchema = z.object({
  passwords: answerSchema, twoFactor: answerSchema, updates: answerSchema,
  permissions: answerSchema, wifi: answerSchema, social: answerSchema, manager: answerSchema,
}).strict();
export type PrivacyAnswers = z.infer<typeof privacySchema>;
export const ANSWER_OPTIONS = [{ value: "yes", label: "Yes" }, { value: "sometimes", label: "Sometimes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }] as const;

export function assessPrivacy(input: PrivacyAnswers) {
  const answers = privacySchema.parse(input);
  const factor = { yes: 1, sometimes: 0.5, no: 0, unsure: 0 };
  const securityScore = Math.round(PRIVACY_QUESTIONS.reduce((s, q) => s + q.security * factor[answers[q.id]], 0));
  const privacyScore = Math.round(PRIVACY_QUESTIONS.reduce((s, q) => s + q.privacy * factor[answers[q.id]], 0));
  const areas = PRIVACY_QUESTIONS.filter((q) => answers[q.id] !== "yes").map((q) => ({ id: q.id, title: q.title, advice: q.advice, priority: q.priority }));
  return { securityScore, privacyScore, areas };
}