# Mirror Edge Cases — Grill Session

Commenters and the mirror client will hit these the week `$HOME/Projects` goes live. Decision trees + recommended policies.

---

## E1 — Forked file: two heads, one path on disk

**Simulated HN comment (47 pts):**
> You have two version heads in Convex but one `page.tsx` on disk. Which head is on disk? Last-write-wins on the filesystem just undid your entire fork model.

**Why this is real:**

```32:44:web/convex/versions.ts
    const forked = activeHeads.length > 1;

    if (forked) {
      await ctx.db.patch(args.fileId, {
        forked: true,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.fileId, {
        currentVersionId: versionId,
        forked: false,
```

When `forked: true`, `currentVersionId` is **not** advanced. Disk can only hold one byte stream per path.

**Decision tree:**

```
File.forked == false
  → cloud→disk: write currentVersionId bytes (normal)

File.forked == true
  → IF version.insert author == this machine's user
       → write that version's bytes to mirror (author sees their head)
  → ELSE IF version.insert author == other user
       → do NOT overwrite mirror (freeze peer content on disk)
  → ALWAYS: tray/menu notification "forked — merge required" + deep link to web merge UI
  → disk→cloud: still allowed (inserts add heads; expected)
```

**Recommended reply (when asked publicly):**

> Fair — one path, multiple heads is the hard part. When a file is forked, the mirror writes **your** inserts to disk but won't apply **remote** inserts over your bytes until merge. Merge UI picks lines → single head → mirror syncs normally. v0 doesn't auto-pick a winner on disk.

**Status:** ✅ **Locked — Policy A** (grill Q4, 2026-06-18)

---

## E2 — Simultaneous local save + web save (race)

**Simulated comment:**
> I saved in VS Code and my cofounder saved in web within 2 seconds. Did I lose data?

**Tree:**

```
→ No insert rejected (versions.ts allows both)
→ file.forked = true
→ Both versions exist in Sync Store
→ Mirror policy E1 applies per machine
→ Reply: "Open merge UI — Pierre line-pick"
```

**Recommended reply:**

> Neither save is dropped — you get two heads and `forked: true`. Your mirror keeps your bytes; web shows fork badge. Merge by line-pick inserts a composed version; both mirrors converge after merge.

---

## E3 — `git init` inside mirror path

**Simulated PH comment:**
> What happens if I run `git init` in `$HOME/Projects/my-app`? You say no git but you literally have a `.git` folder on disk.

**Tree:**

```
→ FAQ already says: expect confusion, not coordinated
→ Mirror watcher: ignore `.git/**` by default (recommended)
→ Reply: Kitchen doesn't manage .git; your choice, unsupported
```

**Recommended reply:**

> Kitchen doesn't coordinate with `.git/` — it's out of scope. You *can* `git init` in the mirror path; Kitchen will ignore `.git` in the watcher (recommended v0). We don't import or export remotes. If git-in-mirror works for you, fine; we don't test it.

**Task note:** Add `.git/**` to mirror client ignore list in 015.

---

## E4 — Rename / move / delete (wide tree sync)

**Simulated comment:**
> I `mv` a file in the terminal. Does Kitchen know or does it orphan a File row?

**Model (locked — grill Q4b, 2026-06-18):**

- **Move in cloud** = `files` row gets new `parentId` and/or `name` (`files.updateMetadata`) — not a version insert
- **Mirror client** holds last-known Convex tree + local path map
- **On WS mutate** or **local FS event:** diff trees → apply inverse on the other side

```
Cloud: file.parentId or file.name changed
  → diff → fs.rename / mkdir on disk (echo-suppressed)

Local: mv / rename / create / delete
  → diff → files.updateMetadata({ parentId, name }) or files.insert
  → delete policy: tombstone row or files.delete (implement per schema)
```

See [ADR 0002](../../adr/0002-mirror-tree-diff-moves.md).

**Tree:**

```
IF "orphan row" concern
  → Explain diff keeps fileId ↔ path map in daemon state
IF rename across projects
  → parentId must stay under same project root (invariants)
IF move while forked
  → Tree move allowed; content policy E1 still applies to bytes
```

**Recommended reply:**

> Moves are `parentId` / `name` updates on the File row — the mirror daemon diffs the Convex tree against `$HOME/Projects` on every metadata change (WebSocket) and every local `mv`. Cloud move → disk rename. Local `mv` → metadata patch in Convex. Same fileId throughout; no orphan. v0 includes this in the launch gate mirror client.

---

## E5 — Local `rm` / delete (soft tombstone)

**Simulated HN comment (34 pts):**
> I `rm -rf src/components`. Tombstone, cascade delete, or orphans forever?

**Model (locked — grill Q5, 2026-06-18):**

This is **Option A — tombstone**, implemented as a **file property**, not row removal:

```
Local rm or cloud delete
  → patch files.properties.deleted = "true" on that node
  → versions + row retained forever (infinite retention)

Tree walk / listProjectTree / mirror diff
  → skip rows where properties.deleted === "true"
  → no entry point from project root → no orphan paths in live tree
```

Not B (hard delete), C (ignore rm), or D (timed purge).

**Product framing (founder):** Kitchen is **version control with ACL first** — cloud file storage is a side effect of the mirror; collab is why the system needs to exist at all.

See [ADR 0003](../../adr/0003-soft-delete-property.md).

**Recommended reply:**

> `rm` sets `deleted: true` on the File row — we don't remove history. Tree queries skip deleted nodes, so there's no live entry point to orphaned subtrees. Versions stay forever. It's VCS semantics, not "sync latest bytes and forget."

**Task:** `files.markDeleted` + query filters in 015; mirror diff applies disk unlink on cloud tombstone.

---

## E6 — Clerk auth on headless daemon

**Simulated HN comment:**
> How does a background service authenticate to Convex? Stored refresh token? That's a juicy target.

**Tree:**

```
IF security researcher tone
  → Acknowledge threat model
  → OS keychain for tokens
  → Short-lived tokens + refresh
  → Link Clerk docs pattern
IF "just use API key"
  → No — per-user auth, ACL requires user identity
```

**Recommended reply:**

> Daemon uses Clerk OAuth (browser handoff once), stores refresh token in **macOS Keychain**, Convex client uses Clerk JWT per request. Threat model: single-user workstation — same as Dropbox/Google Drive desktop. Enterprise hardening TBD. Happy to document flow in mirror README.

---

## E7 — macOS-only at launch

**Simulated PH comment:**
> Windows dev here. "Any editor" but no Windows client. So it's macOS-only vapor for 90% of devs.

**Tree:**

```
→ Agree macOS first for launch gate
→ Web beta works cross-platform today
→ Mirror Windows/Linux on roadmap
→ Don't claim "any editor" without "macOS mirror beta"
```

**Recommended reply:**

> Launch gate is macOS mirror first — fair. Web beta works everywhere for sync/merge; local-editor path is macOS until we port the watcher. "Any editor" means we don't require VS Code or a plugin — not that every OS ships day one.

---

## E8 — Offline laptop lid close

**Simulated comment:**
> I edited on the plane. What happens?

**Model (locked — grill Q8, 2026-06-18):**

Same as **Notion on your phone**:

```
Offline
  → local editor saves normally; bytes on disk
  → daemon queues version inserts (durable)

Reconnect
  → flush queue → versions.insert in order
  → IF remote advanced while offline → forked: true → merge in web (Fork A on disk)
```

**Tree:**

```
IF "did I lose edits?"
  → No — queue holds inserts until flush
IF "silent conflict?"
  → Fork + Pierre merge; not auto-merge
IF "launch day — is it shipped?"
  → Policy locked; implementation task 020 (may trail launch gate)
```

**Recommended reply:**

> Same as Notion on your phone: you keep editing offline, the mirror queues saves, and on reconnect we flush inserts to Convex. If someone else changed the file while you were offline, you get a fork — merge by line-pick in web, same as any other divergence. Implementation is tracked in task 020; we won't claim plane mode in marketing until verify passes.

---

## Task impact

| Edge case | Task | Action |
|-----------|------|--------|
| E1 Fork mirror policy A | 015 / 017 | Author bytes local; freeze remote until merge |
| E2 Race | — | Reply only; backend already correct |
| E3 `.git` ignore | 015 | Watcher ignore list |
| E4 Tree diff moves (wide) | 015 / 017 | `files.updateMetadata` ↔ `fs.rename`; ADR 0002 |
| E5 Soft delete `deleted: true` | 015 / 017 | Tombstone A; ADR 0003; query filters |
| E6 Keychain auth | 015 | Document in README |
| E7 macOS-only | GTM | Soften "any editor" → "macOS mirror beta" until port |
| E8 Offline (Notion-style) | 020 | Queue + reconnect flush; ADR 0006 |