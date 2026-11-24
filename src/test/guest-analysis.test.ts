import { describe, expect, it } from "vitest";
import { checkGuestUrl, checkGuestMessage } from "@/lib/guest-analysis";

describe("Checks before visitor sign-in", () => {
  it("checks a link without credentials and never labels an unverified link low risk", () => {
    expect(checkGuestUrl("https://example.com").risk).toBe("unknown");
  });
  it("detects suspicious link patterns before sign-up", () => {
    expect(checkGuestUrl("http://paypal-login-verify.xyz").risk).toBe("high");
  });
  it("checks messages without credentials and detects OTP scams", () => {
    expect(checkGuestMessage("Urgent! Share your OTP and password immediately.").risk).toBe("high");
  });
  it("does not confirm authenticity when a message has no warnings", () => {
    expect(checkGuestMessage("Hello, are we meeting tomorrow?").risk).toBe("unknown");
  });
  it("rejects embedded URL credentials before checking", () => {
    expect(() => checkGuestUrl("https://user:password@example.com")).toThrow();
  });
});