# Task 021: Kitchen CLI — `changes`

**Depends on:** 015-mirror-client (auth + path map), 019-agent-discovery-kit (`.kitchen/docs` copy)  
**Grill Q9:** `npx kitchen changes path [--since temporal-instant]`  
**ADR:** [`0007-kitchen-cli-changes.md`](../docs/adr/0007-kitchen-cli-changes.md)

## Goal

Ship `@kitchen/cli` so agents and humans answer *"how has this file changed?"* without raw Convex query strings.

## Done criteria

- [ ] Package `packages/kitchen-cli` with bin `kitchen` (workspace `@kitchen/cli`)
- [ ] `kitchen changes <path> [--since <instant>]` implemented
- [ ] `--since` accepts Temporal-compatible instant strings (ISO 8601 / RFC 3339); filter on version `_creationTime`
- [ ] Auth via `~/.kitchen/mirror-auth.json` (share helper with mirror-client or extract `@kitchen/auth`)
- [ ] Path → `fileId` resolution (mirror path map or `listProjectTree` walk)
- [ ] Default output: JSON array `{ id, creationTime, authorUserId, parentVersionIds }`
- [ ] Optional `--limit N` (default 50)
- [ ] Update `templates/project-kitchen-docs/AGENTS.md` — **`npx kitchen changes` first**, Convex run as fallback
- [ ] Update `docs/clients/agent-discovery.md` and `packages/kitchen-cli/README.md`
- [ ] Root `package.json` script: `"kitchen": "npm run start -w @kitchen/cli"` or document `npx kitchen` from monorepo

## Out of scope

- `kitchen login` (reuse `kitchen-mirror login` for v0)
- In-app summarize / LLM

## Verify

```bash
npm run build -w @kitchen/cli
npx kitchen changes src/index.ts --since 2026-06-01T00:00:00Z --limit 10
# → JSON versions for resolved file
```

## References

- [ADR 0005](../docs/adr/0005-no-product-ai-agent-discovery.md) — emergent discovery via primitives