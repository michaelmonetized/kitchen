# Quick Reference

Compressed lookup for Kitchen's novel model. Full definitions: [GLOSSARY.md](../../GLOSSARY.md).

## The one-liner

**Cloud rows, local mirror, live sync, human merge, optional pair collab.**

## Six invariants

1. **Files are rows** — paths computed from parent pointers
2. **Versions are insert-only** — no upsert
3. **Mirror is a view** — Sync Store is truth
4. **Sync is live** — WebSockets, not pull
5. **Merge is human** — Pierre line-pick
6. **Collab → checkpoint** — ops ephemeral until insert

## Three modes of work

| Mode | Trigger | Durable write |
|------|---------|---------------|
| Solo live sync | Save | `versions.insert` |
| Async concurrent | Independent saves | Two heads → Pierre Merge |
| Live collab | `kitchen pair join` | Checkpoint → insert |

## Three entities

User · Role · File (orgs/projects are `dir` files)

## Key paths

| What | Where |
|------|-------|
| Mirror (macOS/Linux) | `$HOME/Projects/<project>/` |
| Collab spike code | `packages/collab-agent`, `packages/collab-relay` |
| Run pair spike | `npm run spike:pair` |

## Events (Sync Store channel)

`file.insert` · `file.metadata` · `version.insert` · `file.pointer`

## Events (Collab channel)

`session.start` · `op.apply` · `presence.update` · `checkpoint.complete` · `session.stale`

## Property ACL (JSON)

```json
{ "role:editor": "write", "role:viewer": "read" }
```

## Autowrite for pairing

| Editor | Setting |
|--------|---------|
| Neovim | `set autowriteall` |
| VS Code | `files.autoSave: afterDelay` |

## Out of scope

Git compatibility · Built-in voice/chat · Shared terminal · IDE hosting

## Doc entry points

| Audience | Start |
|----------|-------|
| Everyone | [The Kitchen Way](../the-kitchen-way.md) |
| Git refugees | [Git Comparison](../concepts/git-comparison.md) |
| Implementers | [Schema](../concepts/schema.md) |