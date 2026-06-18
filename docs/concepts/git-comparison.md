# Git Comparison

If you know git, you already have strong mental models — they just do not map one-to-one to Kitchen. This page translates vocabulary so you do not accidentally import git assumptions.

## The core shift

Git optimizes for **async collaboration**: branch, commit, push, review, merge. Kitchen optimizes for **live collaboration**: save, insert version, WebSocket push, human line-pick when heads diverge.

| Git mental model | Kitchen mental model |
|------------------|----------------------|
| Working tree on disk is yours; remote is elsewhere | Mirror on disk is a **view**; Sync Store is authoritative |
| Commit is the unit of history | **Version insert** is the unit of history |
| Branch is a named movable pointer | **Parallel version heads** — no names required |
| Merge is algorithmic (with conflict markers) | **Pierre Merge** — human picks lines |
| `HEAD` points at current commit | `currentVersionId` points at active version |
| `git push` / `git pull` | Always-on WebSocket subscription |

## Operation-by-operation

### Clone → appear

```
git clone git@github.com:acme/web.git
cd web
```

Kitchen:

```
1. Log in
2. Role grants access to Project "web"
3. Desktop client subscribes
4. $HOME/Projects/web/ materializes
```

No URL. No fetch. No checkout.

### Save → commit

```
# edit file
git add src/index.ts
git commit -m "fix handler"
```

Kitchen:

```
# edit file in any editor
# desktop client watches mirror path
versions.insert(fileId, newContent)   # automatic on save
```

No staging area. No commit message required (optional `label` metadata is future).

### Push / pull → live sync

Git requires explicit sync. Kitchen pushes every insert over WebSocket. Peer clients apply events within seconds. There is no "behind by 3 commits" state on desktop — only fork state when heads diverge.

### Branch → parallel heads

```
git checkout -b feature
# ... commits on feature ...
```

Kitchen has no branch names. Two users editing the same file from version v1 produce v2a and v2b. Both rows exist. The file enters **forked** state until someone merges.

This is closer to "two commits on the same parent" than to named long-lived branches.

### Merge conflict → Pierre Merge

Git:

```
<<<<<<< HEAD
our change
=======
their change
>>>>>>> branch
```

Kitchen never writes conflict markers into the mirror. Instead:

1. UI shows fork badge
2. User opens Pierre diff (version A left, version B right)
3. User picks lines
4. Client inserts merged version
5. Pointer advances

### Rebase → no equivalent

Kitchen forbids rewriting history. You cannot "replay" versions on top of another head. If you want content from an old version, **insert it as a new version** (rollback by re-insertion).

### Revert → re-insert

```
git revert <sha>
```

Kitchen:

```
content = versions.get(oldVersionId).content
versions.insert(fileId, content)   # new row, history intact
```

### `.gitignore` → not applicable

Kitchen does not ship git integration. You could `git init` inside a mirror path, but Kitchen will not coordinate with `.git/`. Expect confusion. See [FAQ](../faq.md).

## What git features have no Kitchen equivalent (v0)

| Git feature | Kitchen stance |
|-------------|----------------|
| Signed commits | Out of scope |
| Hooks | Out of scope |
| Submodules | Out of scope — one File tree per project |
| Tags / releases | Future — maybe version labels, not git tags |
| `git blame` | Query `versions` by `authorUserId` + `createdAt` |
| Shallow clone | N/A — subscribe to project, receive current pointers |

## What Kitchen has that git does not

| Kitchen feature | Why it matters |
|-----------------|----------------|
| MIME types on every file | Binaries and text in one model |
| Role properties on files | Permissions without separate ACL service |
| Live mirror to `$HOME/Projects` | Any local editor, zero remote-SSH friction |
| Insert-only by construction | Concurrent saves never block at storage layer |

## Trap questions

Test whether you are still thinking in git:

**"Which branch is production?"**
Kitchen has no branches. Production is whichever version the pointer references — or a deployment policy outside Kitchen.

**"Can I force-push?"**
No destructive history rewrite. Inserts only.

**"What SHA does CI use?"**
CI must adapt. Trigger on `version.insert` events or `currentVersionId` changes — not git SHAs.

## Related

- [Files and Versions](./files-and-versions.md)
- [Versioning](../architecture/versioning.md)
- [Getting Started](../getting-started.md) — five invariants
- [Exercises](../exercises.md) — git vs Kitchen drills