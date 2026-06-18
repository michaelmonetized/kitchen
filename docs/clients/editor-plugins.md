# Optional Editor Plugins

**Collab adapters** are optional editor plugins that enhance pair programming — they are **not** required to pair in v0.

## What plugins add

| Feature | Collab agent alone | With adapter |
|---------|-------------------|--------------|
| Partner's edits in file | ✓ | ✓ |
| Partner's cursor in editor | ✗ | ✓ |
| Ops before disk flush | Waits for autowrite | Immediate (optional) |

Pairing itself is handled by the [Collab Agent](./collab-agent.md). Plugins connect to the agent on localhost for **Presence** and optionally faster op capture.

## Planned adapters (post-v0)

| Adapter | Editor | Status |
|---------|--------|--------|
| `kitchen-vscode` | VS Code | Planned |
| `kitchen.nvim` | Neovim | Planned |

## Adapter contract

Plugins implement the same localhost API the agent exposes:

1. `joinSession(sessionId)`
2. `applyRemoteOp(op)` — update editor buffer
3. `emitLocalOp(op)` — on buffer change
4. `updatePresence(cursor, selection)`
5. `leaveSession()`

Plugins do not talk to the collab relay directly unless optimizing latency — the agent remains the single local coordinator.

## When to build plugins

Pursue plan 011 when:

- Autowrite latency is unacceptable in production, or
- Users request in-editor remote cursors

Do not make plugins a prerequisite for pairing.

## Related

- [Collab Agent](./collab-agent.md)
- [Live Collaboration](../architecture/live-collaboration.md)