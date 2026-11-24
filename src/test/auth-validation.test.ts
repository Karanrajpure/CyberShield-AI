import { describe, expect, it } from "vitest";
import { emailSchema, signupSchema, isRecoveryLink } from "@/lib/auth-validation";

describe("account validation", () => {
  it("requires a real email address", () => {
    expect(emailSchema.safeParse("username").success).toBe(false);
    expect(emailSchema.parse(" user@example.com ")).toBe("user@example.com");
  });
  it("requires a name and at least eight password characters", () => {
    expect(signupSchema.safeParse({ email: "user@example.com", fullName: "User", password: "1234567" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "user@example.com", fullName: " ", password: "12345678" }).success).toBe(false);
  });
  it("only identifies recovery links as recovery", () => {
    expect(isRecoveryLink("#type=recovery&access_token=test")).toBe(true);
    expect(isRecoveryLink("#type=signup")).toBe(false);
    expect(isRecoveryLink("")).toBe(false);
  });
});