# No built-in AI — emergent agent discovery

Kitchen ships **no** LLM features, summarize buttons, or agent runtime. That is intentional: the product is built from **primitives every AI coding harness already has skills for** and every model has been trained on for years — Convex, filesystem trees, VCS-shaped history, CLI auth.

A user can ask their agent of choice, with **no Kitchen-specific context**:

> Tell me how `src/index.ts` has changed over the last 10 edits.

The harness should discover the model on its own:

1. **VCS-shaped project, no `.git`** — something else owns history
2. **`.kitchen/` folder** — local metadata for the mirror
3. **`.kitchen/docs/AGENTS.md`** — insert-only Convex, files = rows, versions = appends
4. **`~/.kitchen/mirror-auth.json`** — daemon already authenticated as this user
5. **`npx kitchen changes <path> [--since <instant>]`** — canonical CLI ([ADR 0007](./0007-kitchen-cli-changes.md)); or `npx convex run` for power users

No Kitchen MCP server, no custom skill, no in-app AI button. The harness already knows CLI + VCS + Convex; `.kitchen/docs/` is a short pointer, not a new protocol.

**Considered:** In-app "Summarize edits" (stub or LLM action) — rejected; duplicates harness capability, adds maintenance, and violates scope.

**Consequences:** Mirror client materializes `.kitchen/docs/` per project ([`tasks/019-agent-discovery-kit.md`](../../tasks/019-agent-discovery-kit.md)). Web UI shows Pierre/history for humans who prefer doom-scrolling; agents query Convex directly.