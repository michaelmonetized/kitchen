# Web and Mobile

Web and mobile clients access the Sync Store directly — no local mirror required. They are **not** editors.

## Web client

### Responsibilities

- Authentication and session management
- Org/project **tree** browser (File rows)
- **Pierre split diff** per file — history, per-line blame, compare versions
- **Rollback** — advance pointer to a prior version
- **Pierre Merge** host — primary merge surface when forked
- **ACL admin** — roles, assignments, file-level `role:*` properties
- **No built-in AI** — agents use `.kitchen/docs` + Convex CLI ([agent-discovery.md](./agent-discovery.md))

### Non-goals

- **Code editing** — no textarea/Monaco as primary UX; writes happen in local editors via mirror client
- Full IDE (LSP, terminals, preview servers)
- Local filesystem access
- Desktop-class binary editing in browser

### Why web in build order

- Validate insert-only API and subscriptions
- Merge and blame UI easier to iterate in browser
- Admin/review layer before mirror ships

Bootstrap note: early spike used a textarea for dogfood — replaced by diff/blame surface per [ADR 0004](../adr/0004-web-is-not-an-editor.md).

## Mobile client

### Responsibilities

- Read authorized projects and files
- Tree + read-only diff/blame (light)
- Push notifications on fork (future)
- Deep link to web merge UI for conflicts

### Constraints

- Small screen → collapsed tree navigation
- Pierre Merge deferred or read-only diff on phone
- Battery → maintain one WebSocket, aggressive background disconnect

## Shared web/mobile stack (suggested)

| Layer | Options |
|-------|---------|
| Framework | React, React Native / Expo |
| Sync SDK | Shared TypeScript client for WS + insert API |
| Diff / blame | Pierre primitives |
| Edit | **Mirror + local editor only** (not web) |

## Session model

Both clients:

1. Obtain session token on login
2. Open WebSocket with token
3. Subscribe per project on open
4. Apply `version.insert` and tree events to UI (not mirror)

## Related

- [Desktop Sync](./desktop-sync.md) — where editing happens
- [Collab Agent](./collab-agent.md)
- [Overview](./overview.md)
- [ADR 0004 — Web is not an editor](../adr/0004-web-is-not-an-editor.md)