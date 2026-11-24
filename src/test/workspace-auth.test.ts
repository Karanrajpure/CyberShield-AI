import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: vi.fn(), client: vi.fn(), token: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({ createMiddleware: () => ({ server: (handler: unknown) => handler }) }));
vi.mock("@/lib/viewer.server", () => ({ resolveViewer: mocks.access }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.client }));
vi.mock("@/lib/viewer.functions", () => ({ getViewerAccess: mocks.token }));

import { requireWorkspaceAuth } from "@/lib/workspace-auth";
import { clearWorkspaceClient, getSupabase } from "@/lib/workspace-client";

const invoke = requireWorkspaceAuth as unknown as (args: { next: ReturnType<typeof vi.fn> }) => Promise<unknown>;

beforeEach(() => {
  vi.resetAllMocks();
  clearWorkspaceClient();
  vi.stubEnv("SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
});

describe("Verified account access", () => {
  it("rejects requests without either verified identity", async () => {
    mocks.access.mockResolvedValue(null);
    await expect(invoke({ next: vi.fn() })).rejects.toThrow("Sign in");
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("pins saved-data access to the verified user and request token", async () => {
    mocks.access.mockResolvedValue({ viewer: { userId: "verified-user", accountType: "workspace" }, token: "test-identity-token" });
    const client = { marker: "caller-scoped" };
    mocks.client.mockReturnValue(client);
    const next = vi.fn();
    await invoke({ next });
    expect(next).toHaveBeenCalledWith({ context: { supabase: client, userId: "verified-user", accountType: "workspace" } });
    expect(await mocks.client.mock.calls[0]?.[2].accessToken()).toBe("test-identity-token");
  });

  it("requires a verified credential for browser data queries", async () => {
    mocks.client.mockReturnValue({});
    mocks.token.mockRejectedValue(new Error("Sign in to access your saved data."));
    getSupabase();
    const options = mocks.client.mock.calls[0]?.[2];
    expect(options.auth.persistSession).toBe(false);
    await expect(options.accessToken()).rejects.toThrow("Sign in");
  });
  it("pins visitor data to the verified Google account rather than a workspace ID", async () => {
    mocks.access.mockResolvedValue({ viewer: { userId: "google-user", accountType: "visitor" }, token: "google-token" });
    const next = vi.fn();
    mocks.client.mockReturnValue({ marker: "visitor-scoped" });
    await invoke({ next });
    expect(next).toHaveBeenCalledWith({ context: { supabase: { marker: "visitor-scoped" }, userId: "google-user", accountType: "visitor" } });
    expect(await mocks.client.mock.calls[0]?.[2].accessToken()).toBe("google-token");
  });
});