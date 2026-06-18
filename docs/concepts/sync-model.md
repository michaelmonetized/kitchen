# Sync Model

Kitchen is **live**. The Sync Store pushes changes over WebSockets; clients apply them immediately. This page defines the contract.

## Actors

```
┌─────────────┐     WebSocket      ┌──────────────┐
│ Web client  │◄──────────────────►│              │
├─────────────┤                    │  Sync Store  │
│ Mobile app  │◄──────────────────►│  (cloud)     │
├─────────────┤                    │              │
│ Desktop     │◄──────────────────►│              │
│ mirror      │                    └──────────────┘
└─────────────┘
       │
       ▼
 $HOME/Projects/
```

## Subscription model

Clients subscribe at two granularities:

| Scope | Receives |
|-------|----------|
| **Org** | Org metadata, project list, role changes |
| **Project** | File tree mutations, version inserts for files in project |

Desktop clients subscribe to all projects the user can access. Web/mobile may subscribe on demand when a project is opened.

## Live collaboration vs live sync

| | Live sync | Live collab |
|---|-----------|-------------|
| Latency | Seconds | Sub-second ops |
| Durability | Every `version.insert` | **Checkpoint** only |
| Events | `version.insert`, `file.*` | `op.apply`, `session.*` |
| Client path | Sync engine | **Collab agent** |

During collab, mirror changes become `collab.applyOp`. **Checkpoint** is the durable `versions.insert`. See [Live Collaboration](../architecture/live-collaboration.md) and [Collab Agent](../clients/collab-agent.md).

## Event types

| Event | Payload | Client action |
|-------|---------|---------------|
| `file.insert` | New File row | Add to tree / create mirror path |
| `file.update` | Property change | Update metadata |
| `file.delete` | Tombstone | Remove from tree / mirror (policy TBD) |
| `version.insert` | New Version row | Write content to mirror if file is current |
| `pointer.update` | Current version id | Replace mirror file content |
| `role.change` | Role table diff | Re-evaluate access; resubscribe if needed |

Exact event names are implementation detail. Semantics are not.

## Desktop mirror loop

```
┌──────────────────────────────────────────────────┐
│                  Desktop client                   │
│                                                   │
│  Cloud → Local          Local → Cloud             │
│  ─────────────          ─────────────             │
│  version.insert    →    filesystem watch event    │
│  write bytes to         → version.insert          │
│  mirror path                                      │
└──────────────────────────────────────────────────┘
```

### Cloud → local

1. Receive `version.insert` for file F
2. If F's pointer matches this version (or policy says write anyway), resolve mirror path
3. Write bytes to disk
4. Debounce echo: ignore filesystem events caused by own writes

### Local → cloud

1. Detect change via OS file watcher (FSEvents, ReadDirectoryChangesW, inotify)
2. Read bytes from mirror path
3. Insert version row upstream
4. Await acknowledgment; on conflict, surface fork UI

## Realtime guarantee

Kitchen targets **seconds**, not minutes:

- Edits propagate without manual sync triggers
- No "Pull latest" button on desktop
- Offline behavior is undefined for v0 — assume connected

## Divergence handling

When local and cloud disagree on current pointer:

1. Desktop client marks file **forked** in UI
2. Mirror may show last-known local content with warning badge
3. User opens Pierre Merge or picks "use cloud version" / "use local version" (each inserts a new version)

Kitchen never silently discards a version row.

## Binary sync

Binary files follow the same loop. File watchers read raw bytes. MIME type on the File row tells clients not to apply text encoding.

## Platform note

Desktop clients must support **macOS, Windows, and Linux**. See [Desktop Sync](../clients/desktop-sync.md) for technology candidates.

## Backend flexibility

The sync protocol is behavioral:

- Persistent store for users, roles, files, versions
- WebSocket (or WebSocket-like) push for subscriptions
- Insert-only version API

Convex satisfies this profile. So could custom infrastructure. Kitchen specs the protocol; implementations choose the stack.

## Related

- [Event Catalog](../reference/event-catalog.md) — subscription event reference
- [Architecture Overview](../architecture/overview.md)
- [Versioning](../architecture/versioning.md)
- [Desktop Sync](../clients/desktop-sync.md)
- [Concurrent Edit Walkthrough](../guides/concurrent-edit-walkthrough.md)