<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Signed-in pages live under src/routes/_authenticated/; the gate uses the shared verified viewer resolver and redirects anonymous visitors to /auth; public guest checks live at /try, keeping private loaders protected.
- Hybrid identity resolves workspace identity first and verified Cloud Auth bearer second in viewer.server; browser data and server operations use the resolver's caller token, and global middleware attaches only the visitor bearer without fetching identity, preventing recursion and inconsistent access decisions.
- Guest checks use pure local URL/message heuristics and privacy grading without provider requests or database writes; prompt for Google after results to allow anonymous trials without opening paid APIs to abuse.
- Visitor accounts do not create extra profile rows; profile queries and editing apply only to workspace identities, preserving the requested no-profile visitor model.
- Public-page personalization tolerates transport failures through public-viewer; the root shell has no identity loader and private gates use the strict resolver, so outages cannot disable guest tools or bypass authorization.
- Workspace profile fields live separately from legacy visitor profiles; never rebind legacy records by email, and app data deletion never deletes a Lovable account, preserving ownership across identity namespaces.
- Post-login redirects go through src/lib/auth-redirect.ts safeRedirect to block open redirects.
- Modules not yet built show as disabled "Soon" nav items in src/components/app/nav.ts; never link to a route that doesn't exist.
- Scans run in src/lib/scans.functions.ts server functions; pure scoring logic lives in src/lib/url-analysis.ts and message-analysis.ts so it stays unit-tested. Submitted URLs are never fetched, only sent as data to fixed provider endpoints.
- Rate limits are enforced by counting the caller's own rows in the last hour (src/lib/limits.ts) because workers are stateless.
- AI calls go through @lovable.dev/ai-gateway inside server functions only (chat.functions.ts, ai.server.ts); assistant threads live at /assistant/$threadId with messages in the database.
- Threat alerts come only from CISA's public KEV feed via intel.functions.ts (throttled refresh, service-role upsert); shared reads require the CISA source, vulnerability category and canonical CVE reference so unrelated records stay private; never invent alerts.
- Privacy weights and quiz grading live in pure tested modules; authenticated education server functions calculate and save results without accepting client scores, so displayed progress derives from submitted answers.
- Assessment history stores versioned answers and privacy scores in security_scores.assessment_data; Academy content uses stable module IDs with existing learning_progress rows, avoiding duplicate stores.
- Reports and avatars live in private storage buckets under a {userId}/ folder (storage policies enforce ownership); report PDFs are built client-side from saved records.
- 3D backgrounds live in src/components/three; CyberSecurityBackground lazy-loads the canvas behind ClientOnly with a WebGL check, so three.js never runs during SSR.
- Landing scroll story: ScrollExperience pins one canvas with CSS sticky (ancestors must use overflow-x-clip, not hidden) and GSAP ScrollTrigger writes progress to a ref; keyframes live in pure tested story.ts.
- Calculated results and messages deny client INSERT/UPDATE; messages, learning progress and security scores also have read/delete-only owner policies as defense in depth; authenticated handlers compute values, verify conversation ownership with the user client, then use server-only privileged writes pinned to context.userId to prevent forgery.
- Provider and structured AI responses are validated in pure schemas before scoring; incomplete results remain unavailable, and suspicious provider verdicts cannot classify as clean.
- Deployment explicitly resolves router/start/server entries from src and selects Nitro's Vercel preset outside managed Lovable builds; commit the complete source tree and frozen Bun lockfile so manual uploads and host defaults cannot change entry resolution or dependency versions.
