# CLI auth — `npx kitchen auth`, agents fail closed

`kitchen changes` and other authenticated CLI commands use the same session as the mirror daemon: `~/.kitchen/auth.json` → **Clerk JWT** on every Convex request (browser handoff via `npx kitchen auth`).

## `npx kitchen auth`

Interactive login for humans:

1. No valid token in `~/.kitchen/` (or expired) → CLI opens browser OAuth
2. On success → write refresh/session material to `~/.kitchen/auth.json`
3. Mirror daemon reads the same file on start (unified auth, not separate mirror-only login)

**Considered:** `kitchen auth --paste-token` — rejected for v0; high phishing / leak risk. Revisit only with scoped, rotatable machine tokens (enterprise).

## Non-interactive contexts (agents, CI)

| Context | Behavior |
|---------|----------|
| **CI** | Version history not required — no Kitchen CLI auth path |
| **Cursor / Codex / headless agent** | Cannot complete browser OAuth → **exit non-zero**, stderr explains; subprocess killed |
| **Message to user** | *"Kitchen: not authenticated. Run `npx kitchen auth` in your terminal, then retry."* Harness relays to prompting user / parent agent |

No silent failure. No credential prompt inside the agent shell. Parent human authenticates once on the workstation.

**Exception:** Files under **`role:public: read`** may be queried without a user session ([ADR 0009](./0009-public-acl-discovery.md)) — discovery/showcase only.

## Consequences

- Task [`021-kitchen-cli-changes.md`](../../tasks/021-kitchen-cli-changes.md) — `kitchen auth` + fail-closed errors
- Mirror client migrates from `mirror-auth.json` → shared `auth.json` (or symlink) in same task family