# `npx kitchen changes` — agent-facing history primitive

Agents and humans should not need raw `npx convex run` for the common question *"how has this file changed?"* Kitchen ships a thin CLI that wraps path resolution, daemon auth, and version queries.

## Command

```bash
npx kitchen changes <path/to/file> [--since <instant>]
```

| Arg | Meaning |
|-----|---------|
| `path` | Relative to cwd or mirror project root (`$HOME/Projects/<project>/...`) |
| `--since` | Optional. **Temporal-compatible** instant string (ISO 8601 / RFC 3339) — return version inserts after this time |

## Behavior

1. Load auth from `~/.kitchen/mirror-auth.json` (same as mirror daemon)
2. Resolve `path` → `fileId` via project tree
3. Query `versions` for that `fileId`, filtered by `--since` on `_creationTime`
4. Print structured output (default JSON: version id, time, `authorUserId`, parent heads)

Harnesses already know CLI + VCS; this is the **canonical** primitive named in `.kitchen/docs/AGENTS.md`. Raw `npx convex run queries:listVersions` remains valid for power users.

**Considered:** Kitchen MCP server — rejected; duplicates harness + CLI ([ADR 0005](./0005-no-product-ai-agent-discovery.md)).

**Consequences:** Task [`021-kitchen-cli-changes.md`](../../tasks/021-kitchen-cli-changes.md). Package `@kitchen/cli` (bin `kitchen`). Subcommand `changes` is v0; room for `kitchen status`, `kitchen login` later.