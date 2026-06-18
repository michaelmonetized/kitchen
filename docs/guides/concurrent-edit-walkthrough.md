# Concurrent Edit Walkthrough

A narrative walkthrough of two developers editing the same file at the same time. No code exists yet — this is the **target** behavior.

**Prerequisites:** [Files and Versions](../concepts/files-and-versions.md), [Sync Model](../concepts/sync-model.md)

## Cast

| Actor | Role |
|-------|------|
| **Alice** | `editor` on Project `acme-web` |
| **Bob** | `editor` on Project `acme-web` |
| **File** | `src/app/page.tsx` — current version **v1** |

Both use desktop clients. Both have mirrors at `$HOME/Projects/acme-web/`.

## Timeline

### T+0 — Shared starting point

```
Sync Store:  page.tsx → currentVersionId: v1
Alice mirror: .../page.tsx contains v1 bytes
Bob mirror:   .../page.tsx contains v1 bytes
```

### T+1 — Alice saves

Alice edits `page.tsx` in Zed. On save:

1. Desktop watcher fires on Alice's mirror path
2. Alice's client calls `versions.insert(fileId, contentA)`
3. Sync Store creates **v2** (author: Alice)
4. Pointer advances: `currentVersionId: v2`, `forked: false`
5. `version.insert` event broadcasts
6. Bob's desktop writes v2 bytes to his mirror

```
Versions: v1, v2
Pointer:  v2
Forked:   false
```

### T+2 — Bob saves (without seeing Alice's edit yet)

Network latency meant Bob's editor still showed v1 content. He saves:

1. Bob's client calls `versions.insert(fileId, contentB)` from his buffer
2. Sync Store creates **v3** (author: Bob)
3. Pointer logic detects **two heads** (v2 and v3 both descend from v1)
4. `forked: true`, pointer freezes (or stays at v2 — policy: UI must show fork)
5. Events broadcast to both clients

```
Versions: v1, v2, v3
Heads:    v2 (Alice), v3 (Bob)
Forked:   true
```

Neither version is discarded. Kitchen never rejects Bob's insert because Alice "won."

### T+3 — Fork surfaces

| Client | UX |
|--------|-----|
| Alice | Tray badge: "page.tsx forked" |
| Bob | Same badge; mirror may show v2 (last pointer) with warning |
| Web | Merge button in file header |

### T+4 — Alice opens Pierre Merge

Alice opens merge UI (web or desktop shell):

```
┌─────────────────────┬─────────────────────┐
│  v2 (Alice)         │  v3 (Bob)           │
│  export default ... │  export default ... │
│  - old heading      │  + new heading      │
│  + alice footer     │  + bob footer       │
└─────────────────────┴─────────────────────┘
         Line pick UI
```

Alice picks:

- Heading from Bob's side
- Footer from her side
- Shared imports from either (identical)

Preview shows merged buffer.

### T+5 — Merge insert

Alice confirms:

```
versions.insert(
  fileId,
  mergedContent,
  parentVersionIds: [v2, v3]
)
```

Sync Store creates **v4**. Pointer advances to v4. `forked: false`.

### T+6 — Mirrors converge

Both desktops receive `version.insert` + `file.pointer`:

```
$HOME/Projects/acme-web/src/app/page.tsx  → v4 bytes
```

Bob did not have to "pull" or resolve conflict markers. History shows v1→v2, v1→v3, v4(merge).

## What did not happen

| Git-style behavior | Kitchen |
|--------------------|---------|
| Conflict markers in file | Never |
| One save rejected | Never — both inserts succeeded |
| Automatic three-way merge | Never — Alice picked lines |
| Branch created | No branch names |

## Retrieval check

1. How many version rows exist at T+2? **Three (v1, v2, v3)**
2. Who resolves the fork? **Any authorized user with merge UI access**
3. Does merge overwrite v2 or v3? **No — v4 is a new insert**

## Related

- [Versioning](../architecture/versioning.md)
- [Pierre Integration](../reference/pierre-integration.md)
- [Exercises](../exercises.md)