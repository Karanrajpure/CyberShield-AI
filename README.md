# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploy to Vercel through GitHub

Import the repository into Vercel and set **Root Directory** to the directory
containing `package.json`, `vite.config.ts`, `bun.lock`, and `src/`. Keep the
**Output Directory** override disabled: Nitro emits Vercel's Build Output API
files automatically. `vercel.json` provides the install and build commands.

Upload the complete source tree, not only the top-level files. These exact,
case-sensitive paths must exist in the GitHub revision Vercel builds:

- `src/router.tsx` (exports `getRouter`)
- `src/start.ts`
- `src/server.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx` and all other route, component, and library files

`Could not resolve entry for router entry: router in .../src` means TanStack
could not find the router source in that revision/root directory. This project
now explicitly names `src/router.tsx`; an explicit entry cannot restore a file
missing from a manual upload. Check that file in GitHub, then redeploy the
updated revision. Do not upload `node_modules` or generated build folders.

Keep `bun.lock` and use `bun install --frozen-lockfile` to preserve the tested
dependency versions. To check the production deployment locally, run:

```sh
bun install --frozen-lockfile
bun run build
```

Vercel builds select the Vercel hosting preset; Lovable's managed builds keep
their existing hosting target. No authentication, database, or API code is
changed by this deployment configuration. Existing service credentials must
also be configured on the new host. Only browser configuration may use the
`VITE_` prefix; never give private API keys that prefix or commit `.env` files.
Workspace identity still requires the platform's verified identity header;
hosting code on Vercel alone does not supply it. Google redirect origins must
already permit the new host. Deployment success is not proof of those external
service settings.
