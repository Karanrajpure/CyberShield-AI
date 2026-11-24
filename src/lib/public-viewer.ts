import { getViewer } from "./viewer.functions";

/** Optional personalization must not take down public tools during a network outage.
 * Never use this for authorization or private data: those reads must fail closed.
 */
export async function getPublicViewer() {
  try {
    return await getViewer();
  } catch (error) {
    if (error instanceof TypeError && /failed to fetch|fetch failed|networkerror|load failed/i.test(error.message)) return null;
    throw error;
  }
}