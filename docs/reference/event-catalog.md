# Event Catalog

Subscription events broadcast from the Sync Store to connected clients. Event **names** are implementation detail; **semantics** are contract.

## Transport

- WebSocket (or WebSocket-like) per authenticated session
- Clients subscribe at org or project scope
- Server fans out after successful mutations

## Subscription scopes

| Scope | Client receives |
|-------|-----------------|
| **Org** | Project list changes, role table updates, org metadata |
| **Project** | File tree mutations, version inserts, pointer updates for files in project |

## Events

### `file.insert`

New File row created.

| Field | Type | Notes |
|-------|------|-------|
| `file` | File | Full row including `type`, `name`, `parentId`, `properties` |

**Client action:**

| Client | Action |
|--------|--------|
| Desktop | Create mirror directory or empty file |
| Web/Mobile | Add node to tree UI |

### `file.metadata`

File metadata changed — rename, move, property update. **Not** content change.

| Field | Type | Notes |
|-------|------|-------|
| `fileId` | id | |
| `patch` | partial File | Changed fields only |

**Client action:**

| Client | Action |
|--------|--------|
| Desktop | Rename/move mirrored path |
| Web/Mobile | Update tree node |

### `file.delete` (or tombstone)

File removed or marked deleted. Exact tombstone policy TBD.

**Client action:** Remove from tree / mirror (respecting local safety policy).

### `version.insert`

New Version row — the primary content event.

| Field | Type | Notes |
|-------|------|-------|
| `version` | Version | `fileId`, `content`, `authorUserId`, `createdAt` |
| `fileId` | id | Redundant for routing |

**Client action:**

| Client | Action |
|--------|--------|
| Desktop | If pointer matches (or policy says write), write bytes to mirror path |
| Web/Mobile | Update editor buffer if file open and not dirty |

### `file.pointer`

`currentVersionId` or `forked` flag changed.

| Field | Type | Notes |
|-------|------|-------|
| `fileId` | id | |
| `currentVersionId` | id? | Null when forked unresolved |
| `forked` | boolean | |

**Client action:**

| Client | Action |
|--------|--------|
| Desktop | Rewrite mirror file from new current version; show fork badge if true |
| Web/Mobile | Refresh editor content; show merge CTA if forked |

### `role.change`

Role table or user_roles assignment changed.

**Client action:** Re-evaluate authorization; resubscribe if project access changed; update admin UI.

## Ordering guarantees

v0 target:

- Events for a single file are **ordered** per server emission
- Cross-file ordering best-effort
- Clients must tolerate duplicate delivery on reconnect (idempotent appliers)

## Reconnection

```
1. WebSocket drops
2. Client reconnects with session token
3. Client resubscribes to org + project scopes
4. Client requests delta since lastSeenCursor (implementation-specific)
5. Replay missed version.insert and pointer events
```

## Echo suppression (desktop only)

When applying `version.insert` locally, mark mirror path as self-write to prevent watcher → insert loop. See [Desktop Sync](../clients/desktop-sync.md).

## Collab events (ephemeral channel)

Collab events use a **separate WebSocket namespace** from project subscription. High frequency; not persisted in Sync Store.

| Event | Payload | Notes |
|-------|---------|-------|
| `session.start` | sessionId, fileId, baseVersionId, hostUserId | Relay → participants |
| `session.join` | sessionId, userId | Participant added |
| `session.leave` | sessionId, userId | Participant removed |
| `session.end` | sessionId, reason | Session closed |
| `presence.update` | sessionId, userId, cursor, selection | Not persisted |
| `op.apply` | sessionId, seq, op, authorUserId | Ordered application |
| `session.stale` | sessionId, newCurrentVersionId | External version moved pointer |
| `checkpoint.pending` | sessionId | Optional UX warning |
| `checkpoint.complete` | sessionId, versionId | After `versions.insert` |

## Related

- [Sync Model](../concepts/sync-model.md)
- [Schema](../concepts/schema.md) — subscription table
- [Live Collaboration](../architecture/live-collaboration.md)
- [Architecture Overview](../architecture/overview.md)