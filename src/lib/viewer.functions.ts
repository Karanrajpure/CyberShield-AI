import { createServerFn } from "@tanstack/react-start";

export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveViewer } = await import("./viewer.server");
  return (await resolveViewer())?.viewer ?? null;
});

// Returns only the verified caller's existing credential to that same caller.
// Used by the lazy Data API client, never by global middleware.
export const getViewerAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveViewer } = await import("./viewer.server");
  const access = await resolveViewer();
  if (!access) throw new Error("Sign in to access your saved data.");
  return access;
});