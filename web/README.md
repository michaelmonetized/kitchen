# Kitchen Web

Cloud-native project store UI — Next.js + Convex + Clerk.

## Prerequisites

- Node 20+
- [Clerk](https://dashboard.clerk.com) application
- [Convex](https://dashboard.convex.dev) deployment

## Setup

From repo root (uses authorized Clerk + Convex + Vercel CLIs):

```bash
npm install
npm run setup:env
```

Or manually in `web/`:

```bash
clerk env pull --app app_3FKGf5FjU0xo2auiacRVidD84r0 --file .env.local
npx convex dev --once --configure new --team hustle-testing --project kitchen
npx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN"
npx convex dev --once
```

## Development

Run Convex and Next.js in two terminals:

```bash
# Terminal 1 — Sync Store
cd web && npx convex dev

# Terminal 2 — Web UI
cd web && npm run dev
```

Or from repo root after linking workspace:

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Architecture

- `convex/` — Sync Store (users, roles, files, versions)
- `src/app/(marketing)/` — public landing
- `src/app/(app)/` — authenticated product
- `src/app/(auth)/` — Clerk sign-in/up

See [docs/the-kitchen-way.md](../docs/the-kitchen-way.md).