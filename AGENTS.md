# AGENTS.md — Kitchen

Instructions for autonomous agents (`gx`, `./loop.sh`, Cursor, Grok).

## Product location

**All web/cloud application code lives in `./web`.**

- Convex backend: `web/convex/`
- Next.js frontend: `web/src/`
- Collab packages (shared): `packages/collab-*`

## Before coding

1. Read `tasks/README.md` and the current task file (`tasks/00N-*.md`)
2. Read `docs/the-kitchen-way.md` for the mental model
3. Use terms from `GLOSSARY.md`

## Kitchen invariants (non-negotiable)

1. Files are rows — orgs/projects are `dir` files
2. Versions are insert-only — no upsert on content
3. Mirror is a view — web talks to Sync Store directly
4. Sync is live — Convex reactivity in `./web`; Lakebed `useQuery`/`useMutation` for capsule spikes
5. Merge is human — Pierre / line-pick UI
6. Collab → checkpoint — no `collab_sessions` table

## Build loop

```bash
./loop.sh                              # until shippable
node scripts/task-loop.mjs status      # inspect progress
node scripts/task-loop.mjs next        # next task id
KITCHEN_LOOP_MAX_ITER=3 ./loop.sh      # capped run
```

`gx` profile matches `~/.config/zsh/aliases`:

```bash
grok --always-approve --effort max -m grok-composer-2.5-fast \
  --permission-mode bypassPermissions --reasoning-effort xhigh --todo-gate
```

## Task completion

Mark every `- [ ]` under **Done criteria** as `- [x]` in the task file. Run **Verify** commands before checking boxes.

## Stack (current — `./web`)

- Next.js 16 App Router, TypeScript, Tailwind
- Convex (Sync Store reference impl)
- Clerk (auth)
- Textarea editor (Monaco planned)

## Faster alternative: Lakebed

For **new greenfield spikes**, prefer [`npx lakebed`](https://docs.lakebed.dev/) when the goal is auth + live DB + WebSocket mutations without manual wiring:

```bash
npx lakebed new kitchen-spike --template todo
cd kitchen-spike && npx lakebed dev          # guest auth + useQuery/useMutation
npx lakebed auth as alice                    # dev identity
npx lakebed db list --port 3000              # inspect tables
npx lakebed deploy                           # ship capsule
```

Lakebed ships `ctx.auth`, typed `ctx.db`, and client hooks out of the box — maps directly to Kitchen's live sync invariant. Capsules are Preact + `server/index.ts`, not Next.js. Tasks 001–014 target `./web` (Convex path); do not rip out `./web` unless explicitly replanning.

See [learning-records/0002-lakebed-alternative.md](./learning-records/0002-lakebed-alternative.md).

## Environment (use authorized CLIs)

Local zsh has **Lakebed**, Convex, Clerk, Vercel, and Sentry CLIs. **Do not use placeholder keys** when CLIs are available.

```bash
npx lakebed auth login              # if deploying capsules
npx lakebed auth status
```

```bash
bash scripts/setup-env.sh          # pull Clerk + Convex + Vercel env
cd web && clerk env pull --file .env.local
cd web && npx convex dev --once
cd web && vercel env pull .env.vercel --yes
```

Kitchen Clerk app: `app_3FKGf5FjU0xo2auiacRVidD84r0`  
Convex: `hustle-testing/kitchen` (dev deployment in `.env.local`)  
Vercel: `hustle-launch/kitchen`

## Out of scope

- Git in the product UX
- Built-in voice/chat
- Required per-editor plugins for pairing