# Task 021: Kitchen CLI — `auth` + `changes`

**Depends on:** 015-mirror-client (path map), 019-agent-discovery-kit (`.kitchen/docs` copy)  
**Grill Q9–Q10:** `npx kitchen changes` + `npx kitchen auth`  
**ADRs:** [0007](../docs/adr/0007-kitchen-cli-changes.md), [0008](../docs/adr/0008-cli-auth-fail-closed.md)

## Goal

Ship `@kitchen/cli` — canonical agent/human primitives for history and authentication.

## Done criteria

### `kitchen auth`

- [x] `npx kitchen auth` — interactive browser OAuth (Clerk); writes `~/.kitchen/auth.json`
- [x] Shared auth file with mirror daemon (replace or alias `mirror-auth.json`)
- [x] Non-interactive (no TTY / agent shell): exit 1, stderr *"Run \`npx kitchen auth\` in your terminal"* — kill subprocess; no in-shell login
- [x] **No** `--paste-token` in v0 (security — ADR 0008)

### `kitchen changes`

- [x] `kitchen changes <path> [--since <instant>] [--limit N]`
- [x] `--since` Temporal-compatible ISO 8601; filter `_creationTime`
- [x] Path → `fileId` via mirror map or `listProjectTree`
- [x] Private path: require valid `~/.kitchen/auth.json`
- [x] Public path (`role:public: read`): anonymous read — task 023
- [x] Default output: JSON `{ id, creationTime, authorUserId, parentVersionIds }`

### Docs

- [x] Package `packages/kitchen-cli` (`@kitchen/cli`, bin `kitchen`)
- [x] Update `templates/project-kitchen-docs/AGENTS.md`, `docs/clients/agent-discovery.md`, README

## Out of scope

- CI auth / machine tokens
- In-app summarize / LLM

## Verify

```bash
npx kitchen auth                    # human: browser → ~/.kitchen/auth.json
npx kitchen changes src/index.ts --since 2026-06-01T00:00:00Z --limit 10

# Agent simulation (non-interactive):
npx kitchen changes private/foo.ts 2>&1 | grep -i "kitchen auth"
# → exit 1
```

## References

- [ADR 0005](../docs/adr/0005-no-product-ai-agent-discovery.md)