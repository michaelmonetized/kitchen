# Client Overview

Kitchen ships three client surfaces. All share one Sync Store subscription model; capabilities differ by platform.

## Surfaces

| Client | Primary job | Mirror required? |
|--------|-------------|------------------|
| **Desktop** | Maintain `$HOME/Projects` mirror; enable any local editor | Yes |
| **Web** | Browse projects, edit in browser, Pierre Merge UI | No |
| **Mobile** | Read code, light edits, notifications | No |

## Capability matrix (target)

| Feature | Desktop | Web | Mobile |
|---------|---------|-----|--------|
| View files | ✓ | ✓ | ✓ |
| Insert versions | ✓ | ✓ | ✓ (light) |
| Realtime sync | ✓ | ✓ | ✓ |
| Live pair editing | **✓ any mirror editor** | Optional | Observe |
| Collab agent | ✓ | N/A | N/A |
| Per-editor plugins | Optional (cursors) | N/A | N/A |
| Pierre Merge | ✓ | ✓ | Limited |
| Org/role admin | ✓ | ✓ | Read-only |
| Voice/video/chat | **External** (Discord, Meet, phone) | — | — |
| Terminal sharing | **Out of scope** | — | — |
| Offline | TBD | No | No |

Pair programming is **editor-agnostic** via the [Collab Agent](./collab-agent.md) — no required plugins. Kitchen does not build voice chat or shared terminals.

## Shared client responsibilities

Every client must:

1. Authenticate and maintain session
2. Subscribe to authorized projects via WebSocket
3. Enforce UI state from server authorization (not client guesses)
4. Handle reconnection with subscription replay
5. Render fork state when version heads diverge

## Desktop is the keystone

The desktop client maintains the mirror and hosts the **Collab agent** for native pair programming across any editor.

Desktop client docs: [Desktop Sync](./desktop-sync.md), [Collab Agent](./collab-agent.md).

## Web and mobile

Web is the admin-friendly surface and merge UI host. Web may join collab sessions optionally — not required for pairing. Mobile observes sessions and deep-links to web.

Details: [Web and Mobile](./web-and-mobile.md).

## Build order (recommended)

```
Phase 1: Sync Store API + WebSocket subscriptions (no UI)
Phase 2: Web client (prove auth, insert, subscribe)
Phase 3: Collab relay + op stream spike
Phase 4: Collab agent in desktop client (mirror watch ↔ relay)
Phase 5: Pair CLI/tray (start, join, leave, status)
Phase 6: End-to-end test — nvim + VS Code, autowrite on, no plugins
Phase 7: Web optional collab participant
Phase 8: Pierre Merge in web
Phase 9: Windows + Linux desktop parity
Phase 10: Mobile read client
```

## Related

- [Desktop Sync](./desktop-sync.md)
- [Collab Agent](./collab-agent.md)
- [Optional Editor Plugins](./editor-plugins.md)
- [Web and Mobile](./web-and-mobile.md)
- [Sync Model](../concepts/sync-model.md)