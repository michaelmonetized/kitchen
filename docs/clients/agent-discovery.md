# Agent discovery (no product AI)

Kitchen does **not** ship LLM features. The architecture is deliberately primitive — Convex, insert-only versions, a filesystem mirror — so **your existing AI coding harness** already has the skills to answer review questions without Kitchen building anything.

## The emergent discovery chain

User prompt (no Kitchen context required):

> Tell me how `src/index.ts` has changed over the last 10 edits.

What a capable harness should infer:

| Step | Signal | Inference |
|------|--------|-----------|
| 1 | Project looks versioned but no `.git` | History lives elsewhere |
| 2 | `.kitchen/` at project root | Kitchen mirror metadata |
| 3 | `.kitchen/docs/AGENTS.md` | Read first — model in 30 seconds |
| 4 | Docs say insert-only + Convex | Query `versions` table, not `git log` |
| 5 | `~/.kitchen/auth.json` exists | Human ran `npx kitchen auth` (or public ACL grants anon read) |
| 6 | `npx kitchen changes path/to/file [--since <instant>]` | Last N inserts since time — canonical CLI |
| 7 | (fallback) `npx convex run queries:listVersions` | Same data; power-user path |

No Kitchen-specific skill required. Cursor, Claude Code, Codex, etc. already ship Convex and VCS patterns.

## What an agent sees

```
my-project/
├── src/
├── .kitchen/
│   ├── convex.json      # { "deploymentUrl": "..." } — create-if-missing
│   └── docs/
│       └── AGENTS.md    ← read this first
└── (no .git required)
```

The mirror daemon materializes `.kitchen/docs/AGENTS.md` and `.kitchen/convex.json` on first project sync (**create-if-missing** — user edits to `AGENTS.md` are preserved). Templates: `packages/mirror-client/templates/`.

Auth: `~/.kitchen/auth.json` via `npx kitchen auth` (human, interactive). Mirror daemon shares the same file. **Agents** without a token on **private** paths: CLI exits non-zero — tell the user to run `npx kitchen auth`. **Public** projects (`role:public: read`) allow anonymous `kitchen changes`.

## Typical agent flow

1. Notice versioned workflow without `.git`
2. Open `.kitchen/docs/AGENTS.md`
3. Learn: insert-only `versions`, `files` tree, Convex deployment
4. Query history: `npx kitchen changes src/index.ts --since 2026-06-01T00:00:00Z --limit 10`
5. Optional: raw Convex `queries:listVersions` / `getFileWithContent` for bytes + local diff
6. Optional: Pierre merge in web for human line-pick; agent reads version rows directly

## Human vs agent review

| Human | Agent |
|-------|-------|
| Web: Pierre split, blame, doom-scroll | Convex queries + diff bytes |
| Rollback via web UI | Suggest `setCurrentVersion` or describe versions |

## Auth failure (private project)

```
Kitchen: not authenticated.
Run `npx kitchen auth` in your terminal, then retry.
```

Harness cannot complete browser login — relay to the human. No paste-token shortcut (v0).

## Verify

```bash
ls $HOME/Projects/<project>/.kitchen/docs/AGENTS.md
npm run verify:agent-discovery -w @kitchen/mirror-client
```

`AGENTS.md` must mention: no git, `versions` table, `npx kitchen changes`, `npx kitchen auth`, `role:public`, offline queue, and `npx convex` fallback.

## Related

- [ADR 0005](../adr/0005-no-product-ai-agent-discovery.md)
- [ADR 0008](../adr/0008-cli-auth-fail-closed.md) — `kitchen auth`, fail closed
- [ADR 0009](../adr/0009-public-acl-discovery.md) — public showcase
- [Web and Mobile](./web-and-mobile.md) — no AI UI
- [Mirror client](../../packages/mirror-client/README.md)