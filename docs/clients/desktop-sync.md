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

## v0 mirror spike (launch gate)

**Accepted** ([ADR 0001](../adr/0001-mirror-client-typescript-convex.md)): TypeScript **Electron menubar app** or **headless background service** — same sync engine.

| Direction | Mechanism |
|-----------|-----------|
| **Cloud → disk** | Convex live subscription (default realtime) → write tree + file bytes to `$HOME/Projects/` |
| **Disk → cloud** | FS watcher (`@parcel/watcher` or equivalent) → debounce → echo suppress → `versions.insert` |

Menubar is optional UI (status, login, project list). A daemon alone clears the launch gate. macOS first; Windows/Linux follow.

Collab agent ships **after** bidirectional solo sync is proven — not part of launch gate.

### Forked content on disk (policy A)

When `file.forked === true`:

- Apply **this user's** `version.insert` bytes to the mirror path
- **Do not** overwrite mirror with remote users' version inserts until merge
- Notify: tray/deep link to merge UI

### Tree diff for moves (wide sync)

Moves are **metadata**, not version rows — `files.updateMetadata({ parentId, name })`.

The mirror client maintains a `fileId ↔ mirror path` map and diffs:

| Trigger | Action |
|---------|--------|
| WS: `parentId` / `name` change | `fs.rename` / `mkdir` on disk (echo-suppressed) |
| Local: `mv`, create, delete | Patch Convex tree (`files.insert` / `updateMetadata` / delete policy) |

See [ADR 0002](../adr/0002-mirror-tree-diff-moves.md).

### Soft delete

`rm` or cloud delete sets `properties.deleted = "true"` on the File row. Row and all Versions stay forever. Tree walks and mirror diffs skip deleted nodes — no live path from project root. [ADR 0003](../adr/0003-soft-delete-property.md).

Grill: [`03-mirror-edge-cases.md`](../gtm/grilling/03-mirror-edge-cases.md) E1, E4, E5.

## Technology candidates (later platforms)

| Approach | Pros | Cons |
|----------|------|------|
| **Electron / Node daemon** | Cross-platform, TS, shares Convex client | Heavy if full Electron shell |
| **Tauri** | Lighter shell | Smaller ecosystem |
| **Native per OS** | Best FS integration | 3x implementation cost |

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

## Offline (Notion-on-phone)

When connectivity drops ([ADR 0006](../adr/0006-offline-save-until-reconnect.md)):

1. **Disk** — editor saves proceed; mirror path holds latest local bytes
2. **Queue** — FS watcher → durable insert queue at `~/.kitchen/queue/` (path, content hash, timestamp per entry; survives daemon restart)
3. **UI** — tray/status: `Synced` / `Offline (N queued)` / `Syncing…` (written to `~/.kitchen/status.json` and process title)
4. **Reconnect** — flush queue FIFO → Convex `versions.insert` per entry
5. **Conflict** — if cloud head moved while offline → `forked: true` → Fork policy A (author bytes on disk) + web merge

Tree metadata moves (`mv`, `rm`) while offline are **content-only in v0** — queued inserts cover file bytes, not `files.updateMetadata`.

## Failure modes

| Failure | Behavior |
|---------|----------|
| WebSocket disconnect | Queue local inserts; reconnect, resubscribe, flush queue, diff missing versions |
| Local write while offline | Queue inserts (Notion-on-phone); flush on reconnect; fork → merge if remote moved ([ADR 0006](../adr/0006-offline-save-until-reconnect.md), task 020) |
| Fork detected | Tray notification + in-app Pierre Merge link |
| Permission revoked mid-session | Stop writes, grey out mirror paths |

## Related

- [Sync Model](../concepts/sync-model.md)
- [Client Overview](./overview.md)
- [Collab Agent](./collab-agent.md)
- [Web and Mobile](./web-and-mobile.md)