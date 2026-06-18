# Solo Workday Walkthrough

A narrative of one developer using Kitchen alone — Mode 1 (solo live sync). No git, no pair session.

**Prerequisites:** [The Kitchen Way](../the-kitchen-way.md), [Getting Started](../getting-started.md)

## Cast

| Actor | Setup |
|-------|-------|
| **Sam** | Solo builder, MacBook + home iMac |
| **Project** | `acme-web` under `$HOME/Projects` |
| **Editors** | Zed on laptop, VS Code on iMac |

## Morning — laptop

```
07:45  Kitchen desktop already synced overnight.
       $HOME/Projects/acme-web/src/lib/api.ts is current.

08:00  Sam edits api.ts in Zed. Saves.
       → watcher → versions.insert → v12
       → Sync Store persists row

08:00  (same second)  WebSocket fans out version.insert
```

No commit message. No push. v12 exists because Sam saved.

## Midday — switch machines

```
12:30  Sam opens iMac. Kitchen desktop subscribed.
       Mirror already has v12 (received live earlier).

12:35  Sam continues in VS Code on iMac.
       Saves → v13 inserts
       Laptop mirror will update if online
```

Sam never ran `git pull`. The WebSocket subscription kept machines aligned.

## Afternoon — binary artifact

```
15:00  Sam runs build locally. Output: dist/bundle.js
       Build writes to mirror path dist/bundle.js
       → watcher → versions.insert (mime: application/javascript)
```

Binaries and text share the same File/Version model.

## What did not happen

| Git habit | Kitchen |
|-----------|---------|
| `git status` | Uncommitted changes don't exist — saves are inserts |
| Stash | Every save is already a version row |
| Branch switch | No branches |
| Push before leaving | Already live |

## Retrieval check

1. What triggers v13 on the iMac? *(Save → versions.insert)*
2. Is the mirror authoritative? *(No — Sync Store is)*
3. Which mode is this walkthrough? *(Mode 1 — solo live sync)*

## Related

- [Three Modes of Work](../concepts/three-modes-of-work.md)
- [Storage and Sync](../concepts/storage-and-sync.md)
- [Pair Programming Walkthrough](./pair-programming-walkthrough.md) — Mode 3