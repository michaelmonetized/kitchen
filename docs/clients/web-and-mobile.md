# Web and Mobile

Web and mobile clients access the Sync Store directly — no local mirror. They prove the protocol before desktop parity ships.

## Web client

### Responsibilities

- Authentication and session management
- Org/project browser (tree UI over File rows)
- Text editor for leaf files (Monaco or CodeMirror class)
- Version history viewer
- **Pierre Merge** host — primary merge surface
- Org admin: roles, assignments, ownership transfer

### Why web first in build order

- Fastest path to validate insert-only API and subscriptions
- Merge UI is easier to iterate in browser
- No filesystem edge cases

### Non-goals (v0)

- Full IDE replacement (no LSP commitment)
- Local filesystem access
- Desktop-class binary editing

## Mobile client

### Responsibilities

- Read authorized projects and files
- Light text edits (small files)
- Push notifications on fork or mention (future)
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
| Editor | Monaco (web), native TextInput (mobile) |
| Diff | Pierre primitives via WASM or JS port |

Stack is recommendation only — not locked.

## Session model

Both clients:

1. Obtain session token on login
2. Open WebSocket with token
3. Subscribe per project on open
4. Unsubscribe on navigate away (mobile) or tab close

## Editing flow (web)

```
1. User opens file in tree
2. Client fetches current version content
3. User edits in buffer
4. Save → versions.insert
5. If fork: modal → "Open merge view"
```

No autosave conflict resolution without user acknowledgment when forked.

## Pair programming (optional)

Web is an **optional** collab participant — not required for pair programming. Desktop **Collab agents** handle native editor pairing (nvim + VS Code, no plugins).

Web may join the same collab relay session via Monaco/Yjs binding:

```
1. User opens file, joins session by sessionId
2. Ops + presence sync over collab channel
3. Checkpoint → versions.insert (same as desktop)
```

Voice coordination is external (Discord, Meet, phone). Kitchen does not build chat or audio.

## Mobile

Mobile **observes** active sessions (participants, read-only buffer stream). Join editing via deep link to web. No mobile-native collab editor in v0.

## Admin flows (web)

| Action | API |
|--------|-----|
| Create org | `files.insert(type: dir, parent: null)` |
| Create project | `files.insert(type: dir, parent: orgId)` |
| Define role | `roles.insert` |
| Assign user | `userRoles.insert` |
| Transfer ownership | `files.update(properties)` + role changes |

## Related

- [Client Overview](./overview.md)
- [Desktop Sync](./desktop-sync.md)
- [Pierre Integration](../reference/pierre-integration.md)