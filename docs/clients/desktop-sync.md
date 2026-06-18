# Desktop Sync

The desktop client is Kitchen's keystone. It makes cloud files feel local by maintaining a **Mirror** at `$HOME/Projects`.

## Requirements

From the source concept:

- Realtime sync (WebSockets, not periodic poll)
- macOS, Windows, and Linux support
- Bidirectional: cloud → disk and disk → cloud
- Works like Google Drive Desktop or Dropbox Desktop

## Mirror root

| Platform | Default path |
|----------|--------------|
| macOS / Linux | `$HOME/Projects/` |
| Windows | `%USERPROFILE%\Projects\` |

Each **project** maps to one top-level directory:

```
$HOME/Projects/
├── acme-web/
└── acme-mobile/
```

Nested folders mirror the File `parentId` chain under the project root.

## Runtime architecture

```
┌─────────────────────────────────────────┐
│            Desktop application           │
├─────────────────────────────────────────┤
│  Sync engine                             │
│    - WebSocket client                    │
│    - Subscription manager                │
│    - Insert queue (local → cloud)        │
├─────────────────────────────────────────┤
│  Collab agent                            │
│    - Relay WebSocket client              │
│    - Mirror watch → collab.applyOp       │
│    - Remote op → mirror write            │
├─────────────────────────────────────────┤
│  Mirror driver                           │
│    - Filesystem watcher                  │
│    - Write applier (cloud → local)       │
│    - Echo suppressor                     │
├─────────────────────────────────────────┤
│  UI shell (tray, pair, fork alerts)      │
└─────────────────────────────────────────┘
```

## Collab session interaction

When file F has an active collab session, the **Collab agent** owns content sync for that path.

1. User starts/joins via `kitchen pair` (tray or CLI)
2. Agent connects to collab relay; marks mirror path `collab-session`
3. Local mirror change → diff → `collab.applyOp` (NOT `versions.insert`)
4. Remote `op.apply` → agent writes mirror (echo suppressed)
5. Checkpoint → relay calls `versions.insert`
6. Session end → agent idle; sync engine resumes solo `versions.insert`

See [Collab Agent](./collab-agent.md) for editor-agnostic pairing (nvim + VS Code, no plugins).

## Cloud → local

On `version.insert`:

1. Resolve `fileId` → mirror path
2. Check authorization still valid
3. Compare with local mtime/hash if needed
4. Write file atomically (temp + rename)
5. Mark path as "self-write" to suppress echo

## Local → cloud

On filesystem event:

1. Debounce rapid saves (editors often double-write)
2. Read file bytes
3. If not a self-write, call `versions.insert`
4. On fork response, notify UI

## Echo suppression

Without echo suppression, the client infinite-loops:

```
cloud write → watcher fires → insert version → cloud write → …
```

Track paths written by the sync engine and ignore watcher events for ~500ms.

## Technology candidates

| Approach | Pros | Cons |
|----------|------|------|
| **Electron** | Cross-platform, TS ecosystem, cited in source | Heavy, battery |
| **Tauri** | Lighter shell, Rust core | Smaller ecosystem |
| **Native per OS** | Best FS integration | 3x implementation cost |

**Decision status: open.** Electron is the default spike candidate because the source mentions it and all three platforms are mandatory.

## OS filesystem APIs

| OS | Watch API |
|----|-----------|
| macOS | FSEvents |
| Linux | inotify |
| Windows | ReadDirectoryChangesW |

Use a battle-tested watcher library (e.g. `@parcel/watcher`) in whichever shell wins.

## First-run experience

```
1. User installs desktop client
2. Logs in (OAuth / magic link)
3. Client fetches authorized project list
4. Subscribes to each project
5. Creates $HOME/Projects/<project>/ trees
6. Writes current version bytes for all files
7. Tray icon shows "Synced"
```

No clone step. No remote URL.

## Failure modes

| Failure | Behavior |
|---------|----------|
| WebSocket disconnect | Reconnect, resubscribe, diff missing versions |
| Local write while offline | v0: queue or block — TBD |
| Fork detected | Tray notification + in-app Pierre Merge link |
| Permission revoked mid-session | Stop writes, grey out mirror paths |

## Related

- [Sync Model](../concepts/sync-model.md)
- [Client Overview](./overview.md)
- [Collab Agent](./collab-agent.md)
- [Web and Mobile](./web-and-mobile.md)