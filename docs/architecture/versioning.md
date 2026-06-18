# Versioning

Kitchen versioning is **event-sourced at the file level**. Every save appends. History is never rewritten.

## Principles

1. **Insert only** — no `UPDATE versions SET content = …`
2. **No branches** — parallel versions are rows, not named refs
3. **No commits** — version metadata is optional and lightweight
4. **Pointer, not overwrite** — `currentVersionId` selects the active view
5. **Human merge** — Pierre diff composes a new version from two parents

## Version lifecycle

```
                    ┌──► v2 (User A)
              v1 ───┤
                    └──► v3 (User B)     ← fork

Pierre Merge ──► v4 (merged)            ← pointer moves here
```

### States

| State | Meaning |
|-------|---------|
| **Linear** | One latest version; pointer follows each insert |
| **Forked** | Multiple leaf versions; pointer unset or disputed |
| **Merged** | New version inserted from merge UI; pointer advances |

## Concurrent insert behavior

When two clients insert from the same parent version:

```
Client A: insert(file, contentA) → versionId: va
Client B: insert(file, contentB) → versionId: vb
```

Both succeed. Authorization permitting, the Sync Store never rejects B because A won a race.

The file's pointer logic detects multiple heads and sets `forked: true` in client-visible state.

## Current pointer policy

Default (v0):

- If only one head exists after insert, pointer auto-advances to it
- If multiple heads exist, pointer freezes; UI shows fork badge
- Merge insert creates a single new head; pointer advances to merge result

Alternative policies (future config):

- **Pin** — admin locks pointer to a specific version
- **Auto pick latest timestamp** — discouraged; hides forks

## Merge workflow

Kitchen does not run three-way merge algorithms silently.

```
1. User selects versions va and vb in Pierre Merge UI
2. UI renders side-by-side diff with line-level pick targets
3. User selects lines from left, right, or both
4. UI composes merged content
5. Client calls versions.insert(file, mergedContent, parents: [va, vb])
6. Pointer updates to new version
7. Desktop clients sync merged bytes to mirror
```

Parent version ids on merge inserts are metadata for history graph — optional but recommended.

## Deletion and rename

| Action | Versioning behavior |
|--------|---------------------|
| **Edit content** | `version.insert` |
| **Rename file** | `file.update` on name (metadata) — does not fork content |
| **Delete file** | `file` tombstone or `deleted: true` property — exact policy TBD |
| **Move file** | `file.update` parentId |

Renames and moves are metadata mutations on File rows, not version inserts — unless we choose to version metadata too (deferred).

## History inspection

Clients can list `versions(fileId)` ordered by `createdAt DESC`. Use cases:

- Audit trail
- Roll back by inserting old content as a new version (not pointer rewind without insert)
- Pierre Merge source selection

**Rollback** in Kitchen means: copy historical content into a **new** insert. History stays intact.

## Comparison to git

| Git | Kitchen |
|-----|---------|
| Commit | Version insert |
| Branch | Parallel version heads |
| Merge commit | Merge version insert |
| `git revert` | Insert version restoring old content |
| `HEAD` | `currentVersionId` |
| `git rebase` | No equivalent — forbidden concept |

## Checkpoints from collab sessions

A **checkpoint** is a normal `versions.insert` — same fork rules apply.

- Collab session does not exempt a file from fork detection.
- Relay **serializes checkpoints** — one in flight per session.
- Multiple participants do not each insert independently; one merged buffer per checkpoint.
- Solo `versions.insert` during active session may cause `session.stale` on the relay.

## Open questions

| Question | Lean |
|----------|------|
| Version metadata (message)? | Optional `label` string on insert |
| Binary merge? | Block-level pick or pick-one-whole-file for v0 |
| Max history retention? | No pruning in v0 |

## Related

- [Files and Versions](../concepts/files-and-versions.md)
- [Pierre Integration](../reference/pierre-integration.md)
- [Live Collaboration](./live-collaboration.md)
- [Sync Model](../concepts/sync-model.md)