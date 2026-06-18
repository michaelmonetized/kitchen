# Storage and Sync

How Kitchen stores project bytes and keeps mirrors current. Read [The Kitchen Way](../the-kitchen-way.md) first for context.

## Storage: files as rows

The Sync Store does not expose a server filesystem. Everything is relational:

```
Org (dir, no parent)
 └── Project (dir)
      └── src/ (dir)
           └── index.ts (file, mime: text/typescript)
                └── versions[] (append-only)
                     ├── v1: "console.log('hi')"
                     ├── v2: "console.log('hello')"
                     └── v3: "export {}"
```

| Concept | Kitchen | Git analogy (imperfect) |
|---------|---------|-------------------------|
| Identity | File row | Blob path in tree |
| Content at time T | Version row | Commit snapshot |
| Current view | `currentVersionId` pointer | HEAD |
| Directory | `type: dir` File row | Tree entry |

**Insert-only:** `save()` always `insert()`. No `UPDATE versions SET content = …`.

## Binaries use the same model

A PNG, a `.wasm`, a build artifact — each is a `file` row with a MIME type. Bytes live in Version `content`. No separate blob service in v0.

## Sync: live, not pull

Traditional:

```
edit → commit → push → teammate pull → edit
```

Kitchen:

```
edit → save → versions.insert → WebSocket → peer mirror updated
```

| Property | Kitchen v0 target |
|----------|-------------------|
| Latency | Seconds |
| Trigger | Automatic on save |
| Manual sync button | None on desktop |

## Mirror contract

| Platform | Path |
|----------|------|
| macOS / Linux | `$HOME/Projects/<project>/...` |
| Windows | `%USERPROFILE%\Projects\<project>\...` |

The mirror is a **view**. Authoritative state is in the Sync Store.

### Desktop loop

**Cloud → local:** `version.insert` event → write bytes to mirror (echo-suppressed).

**Local → cloud:** filesystem watcher → read bytes → `versions.insert` (unless collab session redirects to ops).

See [Desktop Sync](../clients/desktop-sync.md).

## Collab changes the local → cloud path

During Mode 3 (live collab), the Collab agent redirects mirror changes to `collab.applyOp`. Checkpoints perform the durable `versions.insert`. Modes 1 and 2 use direct insert on save.

See [Three Modes of Work](./three-modes-of-work.md).

## What sync does not do

- Merge divergent heads automatically (human **Pierre Merge**)
- Run your tests or linter
- Sync voice, terminal, or IDE state
- Replace git hooks or SHA-based CI (consumers must adapt)

## Primary sources

- [Event Sourcing (Martin Fowler)](https://martinfowler.com/eaaDev/EventSourcing.html) — version rows as per-file logs
- [Files and Versions](./files-and-versions.md) — canonical Kitchen detail
- [Sync Model](./sync-model.md) — WebSocket events

## Related

- [Schema](./schema.md)
- [Data Model](../architecture/data-model.md)