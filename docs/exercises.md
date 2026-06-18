# Exercises

Retrieval practice for Kitchen concepts. Answer from memory before expanding the answers. No runtime required.

Difficulty is intentional — effortful recall builds long-term retention.

## Invariants (Getting Started)

**1.** What are the six invariants?

<details>
<summary>Answer</summary>

1. Files are rows
2. Versions are insert-only
3. The Mirror is a view
4. Sync is live
5. Merge is human
6. Collab is ephemeral until checkpoint

</details>

**2.** A teammate says "the mirror is the source of truth." Correct them in one sentence.

<details>
<summary>Answer</summary>

The Sync Store is authoritative; the mirror is a local projection maintained by the desktop client.

</details>

## Files and Versions

**3.** How many version rows after two users concurrently save the same file from v1?

<details>
<summary>Answer</summary>

At least three: v1 plus two new inserts (one per user). Prior history preserved.

</details>

**4.** Where do binary PNG bytes live?

<details>
<summary>Answer</summary>

In a Version row's `content` column; the File row has `mime: image/png` and `type: file`.

</details>

**5.** What field orders version history?

<details>
<summary>Answer</summary>

`createdAt` or `_creationTime` — system-generated, immutable.

</details>

## Orgs and Roles

**6.** What makes a File row an org vs a project?

<details>
<summary>Answer</summary>

Org: `type: dir`, `parentId: null`. Project: `type: dir`, `parentId` is org file id.

</details>

**7.** Match JSON property to grant: `"role:viewer": "read"`

<details>
<summary>Answer</summary>

Users holding the `viewer` role may read this file (if property inherited or set on ancestor).

</details>

## Sync Model

**8.** Why does the desktop client need echo suppression?

<details>
<summary>Answer</summary>

Cloud→local writes trigger the filesystem watcher; without suppression the client would insert duplicate versions in a loop.

</details>

**9.** What subscription scope receives `version.insert` for `src/index.ts`?

<details>
<summary>Answer</summary>

Project scope — the file belongs to a project subtree.

</details>

## Git Comparison

**10.** What is Kitchen's equivalent to `git revert`?

<details>
<summary>Answer</summary>

Fetch old version content and `versions.insert` it as a new row — history stays intact.

</details>

**11.** What has no Kitchen equivalent in v0?

<details>
<summary>Answer</summary>

Rebase, branches as named refs, force-push, git hooks (any of these).

</details>

## Scenarios

**12.** Fork badge appears on `page.tsx`. What happened?

<details>
<summary>Answer</summary>

Multiple version heads exist for the file; pointer is forked until merge or explicit resolution.

</details>

**13.** New hire sees empty `Projects/` folder after login. Name two checks.

<details>
<summary>Answer</summary>

(1) `user_roles` assigns them to a project role. (2) Project file properties grant read/write for that role. (3) Desktop client subscribed successfully (any two).

</details>

## Property syntax

**14.** Shorthand `role:editor:write` as JSON?

<details>
<summary>Answer</summary>

`{ "role:editor": "write" }`

</details>

**15.** Does `org:acme` property alone grant access?

<details>
<summary>Answer</summary>

No — it is display metadata. Authorization requires role properties plus user_roles assignment.

</details>

## Storage, sync, and modes

**16.** Name Kitchen's four layers from The Kitchen Way.

<details>
<summary>Answer</summary>

Storage (rows), sync (WebSockets), work (mirror + any editor), collaboration (three modes).

</details>

**17.** Which mode is a normal solo save?

<details>
<summary>Answer</summary>

Mode 1 — solo live sync: save inserts a version immediately.

</details>

**18.** Dropbox mirrors files. What does Kitchen add?

<details>
<summary>Answer</summary>

Insert-only version rows per save and Pierre Merge for divergent heads.

</details>

## Live collaboration

**19.** How does live sync differ from live collab?

<details>
<summary>Answer</summary>

Live sync propagates durable version inserts in seconds. Live collab streams ephemeral ops until checkpoint inserts one version.

</details>

**20.** Are cursor positions stored as version rows?

<details>
<summary>Answer</summary>

No — presence is ephemeral collab relay state, not persisted versions.

</details>

**21.** What creates a durable version during a pair session?

<details>
<summary>Answer</summary>

Checkpoint calls versions.insert with the merged session buffer.

</details>

**22.** What happens to mirror changes during an active collab session?

<details>
<summary>Answer</summary>

Collab agent converts them to collab.applyOp instead of direct versions.insert.

</details>

**23.** External save during session triggers what event?

<details>
<summary>Answer</summary>

session.stale — session must rebase from new current or end.

</details>

**24.** Does Kitchen include built-in voice chat for pairing?

<details>
<summary>Answer</summary>

No — use phone, Meet, Discord, or similar external tools.

</details>

**25.** Is a VS Code extension required to pair?

<details>
<summary>Answer</summary>

No — Collab agent on desktop bridges mirror to relay for any editor.

</details>

## Next

Missed several? Re-read the linked doc for that section only — not the whole curriculum.

| Topic | Doc |
|-------|-----|
| Invariants | [Getting Started](./getting-started.md) |
| Versions | [Files and Versions](./concepts/files-and-versions.md) |
| Permissions | [Permissions](./concepts/permissions.md) |
| Git refugees | [Git Comparison](./concepts/git-comparison.md) |
| The novel model | [The Kitchen Way](./the-kitchen-way.md) |
| Three modes | [Three Modes of Work](./concepts/three-modes-of-work.md) |
| Live collab | [Live Collaboration](./concepts/live-collaboration.md) |
| Stories | [Guides](./guides/solo-workday-walkthrough.md) |

Ask follow-up questions — the agent is your teacher for anything unclear.