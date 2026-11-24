import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/viewer.functions", () => ({ getViewer: mock }));
import { getPublicViewer } from "@/lib/public-viewer";
beforeEach(() => { mock.mockReset(); });
describe("Public pages during account request outages", () => {
  it("keeps public pages available when the request fails to fetch", async () => {
    mock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await getPublicViewer()).toBeNull();
  });
  it("preserves verified account personalization when available", async () => {
    const viewer = { userId: "verified", accountType: "workspace" };
    mock.mockResolvedValue(viewer);
    expect(await getPublicViewer()).toEqual(viewer);
  });
  it("does not swallow application or authorization failures", async () => {
    mock.mockRejectedValue(new Error("Unauthorized"));
    await expect(getPublicViewer()).rejects.toThrow("Unauthorized");
  });
});