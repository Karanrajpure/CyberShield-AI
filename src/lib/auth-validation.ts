import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128);
export const signupSchema = z.object({ email: emailSchema, password: passwordSchema, fullName: z.string().trim().min(1, "Enter your name.").max(120) });

export function isRecoveryLink(hash: string): boolean {
  return new URLSearchParams(hash.replace(/^#/, "")).get("type") === "recovery";
}