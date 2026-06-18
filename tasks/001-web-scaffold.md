# Task 001: Web Scaffold

**Depends on:** none  
**Output:** `./web/`

## Goal

Create the Kitchen web/cloud application skeleton in `./web`: Next.js (App Router), Convex, Clerk, TypeScript, Tailwind. Wire it into the monorepo without breaking existing `packages/collab-*` spikes.

## Done criteria

- [x] `./web/` exists with Next.js 15+ App Router + TypeScript + Tailwind
- [x] Convex initialized at `web/convex/` with dev scripts
- [x] Clerk packages installed; env template at `web/.env.example`
- [x] Root `package.json` has scripts to dev/build the web app
- [x] `web/README.md` documents local dev (`convex dev` + `next dev`)
- [x] `npm run build` succeeds in `web/`

## Steps

1. Scaffold `web/`:
   ```bash
   cd web  # create with create-next-app or manual
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```

2. Add Convex:
   ```bash
   cd web && npm install convex @convex-dev/react-clerk  # or official clerk+convex pattern
   npx convex dev --once --configure=new  # creates convex/
   ```

3. Add Clerk:
   ```bash
   npm install @clerk/nextjs
   ```
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET` (placeholder)
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOYMENT`

4. Minimal providers:
   - `web/src/app/layout.tsx` — ClerkProvider + ConvexProviderWithClerk
   - Public marketing route group `(marketing)` and private `(app)` per Clerk best practices

5. Update root `package.json`:
   ```json
   "scripts": {
     "dev:web": "npm run dev -w web",
     "build:web": "npm run build -w web"
   }
   ```
   Add `"web"` to workspaces if using npm workspaces.

6. Add `web/.env.example` with all required keys (no secrets).

## Verify

```bash
cd web && npm install && npm run build
```

## References

- `docs/clients/web-and-mobile.md` — web-first build order
- `docs/clients/overview.md` — Phase 2 web client