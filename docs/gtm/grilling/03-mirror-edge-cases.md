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

> Human runs `npx kitchen auth` once (browser OAuth) → `~/.kitchen/auth.json`; mirror daemon reads the same file. Keychain migration TBD. Threat model: single-user workstation — same as Dropbox. Agents can't login — you auth, they reuse the file ([ADR 0008](../../adr/0008-cli-auth-fail-closed.md)).

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

**Model (locked — grill Q8 + Q12=C, 2026-06-18):**

Same as **Notion on your phone** for content; **local tree free** offline:

```
Offline
  → saves, mv, rm, mkdir on disk (unrestricted)
  → daemon queues content inserts + records tree intent

Reconnect
  → flush content queue → versions.insert
  → full tree diff disk ↔ Convex → metadata / tombstones
  → IF remote advanced → forked → merge in web (Fork A)
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

## E10 — Agent runs `kitchen changes` without auth

**Simulated comment:**
> My Cursor agent tried to read file history and got exit 1. Broken DX.

**Model (locked — grill Q10, 2026-06-18):**

```
Private path + no ~/.kitchen/auth.json
  → kitchen changes exits non-zero
  → stderr: "Run npx kitchen auth in your terminal"
  → agent cannot browser-login → relay to human

Public path (role:public: read)
  → anonymous read OK

CI
  → version history not needed — no auth path
```

**Considered:** `--paste-token` — rejected v0 (phishing/leak risk).

**Recommended reply:**

> Agents can't browser-login — by design. Run `npx kitchen auth` once on your machine; your harness reuses `~/.kitchen/auth.json`. Private history is ACL-gated. Public showcase projects use `role:public: read`. CI doesn't need version history. Paste-token auth is intentionally not shipped.

See [ADR 0008](../../adr/0008-cli-auth-fail-closed.md), [ADR 0009](../../adr/0009-public-acl-discovery.md).

---

## E14 — "I'll send a PR with my fork"

**Simulated PH comment:**
> Fork flakebed, fix the bug, open PR. Where's the PR button?

**Model (locked — ADR 0011):**

```
FOSS fork → copy public-visible files to YOUR account project
You own inserts from snapshot forward
No cross-account PR — communicate with owner/org, get invited, Pierre merge
```

**Recommended reply:**

> Kitchen isn't GitHub — fork means copy public code into your `$HOME/Projects` under your account and own it from that version forward. To land changes upstream, talk to the org, get on the team, merge by line-pick. No PR path by design.

---

## E18 — "My public URL is gmail.com-mostlyalice"

**Simulated PH comment:**
> I published FOSS and the link is `kitchen.sync/gmail.com-mostlyalice/flakebed`. Embarrassing.

**Model (locked — grill Q18 = C, 2026-06-18):**

```
Onboarding may submit ugly placeholder unchanged
FOSS works at that URL immediately
Rename at /account/ → 301 old → new (VCS link hygiene)
```

**Recommended reply:**

> You can ship public with the default slug — we nudge you to rename, not block you. Change username at `/account/` anytime; old `gmail.com-mostlyalice/…` links 301 to your new handle. We're VCS people — links shouldn't die when you fix your name.

---

## E17 — "I used my work email and got laid off"

**Simulated HN comment:**
> Locked out after leaving company — email is on the account and support won't change it.

**Model (locked — grill Q17, 2026-06-18):**

```
Email IMMUTABLE after sign-up
Username changeable at /account/
Onboarding warns: don't use work email unless you must
```

**Recommended reply:**

> By design — email is your account key, like early GitHub. We warn at sign-up: use a personal email you'll keep. Username is what you share (`you/project`); change username anytime with 301s for old links. We can't move FOSS history to a new email without breaking auth.

---

## E16 — "Someone else took the name flakebed"

**Simulated comment:**
> Global namespace? I can't publish `flakebed` because it exists?

**Model (locked — grill Q16 = A, 2026-06-18):**

```
Project name unique per account (parentId + name)
Cross-account collision OK
Share URL: /<username>/<project>  e.g. mostlyalice/flakebed, bobactually/flakebed
```

**Recommended reply:**

> Names are per account, not global. Your `flakebed` is `yourusername/flakebed` on the web. Two FOSS projects can both be called flakebed under different usernames — like GitHub `user/repo`, without git.

See [ADR 0013](../../adr/0013-project-namespace-and-urls.md).

---

## E15 — "Where is my account folder?"

**Simulated comment:**
> I expected `~/Projects/alice@email.com/projects/…`. Why flat?

**Model (locked — grill Q15, 2026-06-18):**

```
Account = your email (Clerk JWT)
~/Projects/<anything-top-level>/ = project
owner property = session email on push
No ~/Projects/<account>/ nesting
```

**Recommended reply:**

> Your account is your email — sign in via daemon or `npx kitchen auth`. Anything directly in `~/Projects` is a project we sync with `owner` set to you. Flat on disk, account parent in the cloud. Nested folders inside a project are source files, not separate projects.

---

## E12 — "Is everything public if I use Kitchen?"

**Simulated comment:**
> So all my code is on the internet?

**Model (locked — grill Q13–Q14, 2026-06-18):**

```
Project parentId = originating account (never changes)
owner: email on project row (transferrable)

Default: role:user (private)
→ org: add org:<name> property, write role → org
→ public: add role:public: read (FOSS)

All transitions audited forever (ADR 0012)
FOSS fork: copy to your ~/Projects, own forward — no PR (ADR 0011)
```

**Recommended reply:**

> Projects parent to your account, not org. Default is private (`user`). Sharing with a team adds an `org:` property and moves write to `role:org` — parent doesn't change, you still own the lineage. Public is opt-in FOSS. You can fork public code into your account and own it from that version forward — there's no PR button; you join the org and merge like any other fork.

See [ADR 0010](../../adr/0010-project-ownership-and-scope.md).

---

## E11 — Public FOSS project with secret `.env`

**Simulated comment:**
> You say public showcase. So my API keys in `.env` are visible to the internet?

**Model (locked — grill Q11, 2026-06-18):**

```
Project role:public: read  → FOSS (tree + content + full version history)

Child .env:
  { "role:public": "deny", "role:editor": "write" }
  → overrides parent
  → anonymous tree walk OMITS .env (not listed, not readable)
  → editors/contributors with role see it normally
```

**Recommended reply:**

> Public project means FOSS-shaped openness on paths you leave public — full history included. Per-file ACL overrides parent all the way down: mark `.env` contributor-only with `role:public: deny` and it won't appear in the public tree at all. Same pattern as a public repo with a private submodule you never publish — except it's property-based on the File row.

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
| E8 Offline (Notion + tree C) | 020 | Queue + tree reconcile; ADR 0006 |
| E10 Agent auth fail-closed | 021 | `kitchen auth`; no paste-token; ADR 0008 |
| E10b Public ACL | 023 | `role:public: read`; ADR 0009 |
| E11 FOSS + file override | 023 | `role:public: deny`; tree omits secrets |
| E12 Project scope | 024 | account parent; `user`/`org`/`public`; ADR 0010 |
| E14 FOSS fork no PR | 025 | copy to account; ADR 0011 |