import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ member: vi.fn(), request: vi.fn(), getUser: vi.fn(), client: vi.fn() }));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: mocks.request }));
vi.mock("@/lib/auth.server", () => ({ getSessionUser: mocks.member }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.client }));
import { resolveViewer } from "@/lib/viewer.server";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  mocks.member.mockResolvedValue(null);
  mocks.client.mockReturnValue({ auth: { getUser: mocks.getUser } });
});
describe("Hybrid viewer resolution", () => {
  it("leaves guests anonymous instead of creating anonymous accounts", async () => {
    mocks.request.mockReturnValue(new Request("https://example.invalid"));
    expect(await resolveViewer()).toBeNull();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("uses verified workspace identity first even when a Google session exists", async () => {
    mocks.member.mockResolvedValue({ userId: "workspace-id", email: "same@example.invalid", displayName: "Member" });
    mocks.request.mockReturnValue(new Request("https://example.invalid", { headers: { "x-lovable-identity-token": "workspace-token", authorization: "Bearer google-token" } }));
    expect((await resolveViewer())?.viewer).toMatchObject({ userId: "workspace-id", accountType: "workspace" });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("verifies visitor tokens server-side and does not copy editable profile metadata", async () => {
    mocks.request.mockReturnValue(new Request("https://example.invalid", { headers: { authorization: "Bearer google-token" } }));
    mocks.getUser.mockResolvedValue({ data: { user: { id: "google-id", email: "same@example.invalid", user_metadata: { full_name: "Owner" } } }, error: null });
    expect(await resolveViewer()).toEqual({ viewer: { userId: "google-id", email: "same@example.invalid", displayName: null, accountType: "visitor" }, token: "google-token" });
    expect(mocks.getUser).toHaveBeenCalledWith("google-token");
  });
  it("rejects forged visitor tokens", async () => {
    mocks.request.mockReturnValue(new Request("https://example.invalid", { headers: { authorization: "Bearer forged" } }));
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Invalid token" } });
    expect(await resolveViewer()).toBeNull();
  });
});