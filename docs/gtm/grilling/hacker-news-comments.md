# Hacker News — Comment Roasts & Response Trees

HN is meaner, smarter, and reads your docs. These roasts are modeled on Fata (skill rot debate), Kage (technical depth rewards), and classic Show HN failure modes.

---

<a id="comparers"></a>

## Comparers

### C1 — vs git (the big one)

**Simulated comment:**
> Git is not broken. You're describing a problem that only exists if you misuse git. Branches exist. Why would I give up distributed history, signed commits, and blame for "live sync"?

**Tree:**
```
IF "git is fine"
  → Agree for async OSS / release workflows
  → Kitchen for live fan-out + editor-agnostic pair
IF "misuse git"
  → Don't argue; name concrete scenario (pair across editors, no clone onboarding)
IF wants distributed/offline
  → Honest: offline TBD, Convex assumes connected beta
```

**Recommended reply:**
> Git isn't broken — it's optimized for async contribution and release governance. **"No git"** here means no `add` / `commit` / `push` / `pull` / `rebase` loop: mutations are tracked on save as insert-only version rows, then WebSocket fan-out. History stays; ceremony goes. I'd still use git for OSS release trains. Kitchen tests whether that command loop is optional for small teams doing live work. If you're branch/PR-centric, this probably isn't for you.

**Mog tip:** HN upvotes **intellectual honesty** + precise definitions. Lead with the command list — it disarms "no history" misreadings.

---

### C2 — vs Syncthing / Dropbox

**Simulated comment:**
> This is Syncthing with a database. Files on disk already work. You're adding latency and a vendor.

**Tree:**
```
IF latency concern
  → Acknowledge; beta is web; mirror TBD
  → Version semantics are the delta
IF vendor concern
  → Backend-agnostic contract; Convex is reference
```

**Recommended reply:**
> Syncthing replicates bytes between disks. Kitchen makes the Sync Store authoritative: each save appends a version row, concurrent saves fork rather than last-write-wins, ACL inherits on file rows, merge is explicit line-pick. The disk path is a rebuilt mirror, not the source of truth. Extra latency is a real cost — haven't benchmarked mirror driver yet. If folder sync is sufficient, Syncthing is simpler.

---

### C3 — vs Live Share / CRDT / Warp / Zed multiplayer

**Simulated comment:**
> Every editor has multiplayer now. CRDTs solved this. Human merge is a step backward.

**Tree:**
```
IF CRDT superiority
  → Design choice: insert-only + human merge for auditability
  → Point to VISION constraint
IF "editors already solve it"
  → Editor-agnostic + storage layer, not session feature
```

**Recommended reply:**
> Editor multiplayer is session-scoped and editor-specific. Kitchen is storage-first: three entities (users, roles, files), versions never upserted, collab checkpoints into the same version log solo saves use. CRDT convergence is great when you want silent merge; we want fork visibility + human line-pick — automatic three-way without human selection is explicitly out of scope. Different trade.

---

### C4 — vs event sourcing / Datomic / CouchDB

**Simulated comment:**
> Files as rows with append-only versions is event sourcing with extra marketing. Datomic did this a decade ago.

**Tree:**
```
IF "nothing new"
  → Agree on storage shape; novelty is mirror + editor-agnostic collab protocol
IF wants citations
  → Honest lineage; not claiming invention of ES
```

**Recommended reply:**
> The per-file version log is spiritually close to event sourcing — fair. The bet isn't "invent append-only storage" — it's pairing that model with a `$HOME/Projects` mirror contract, property-based ACL without a fourth entity, and collab as protocol (no `collab_sessions` table). Datomic wasn't optimizing for nvim+VS Code pair without plugins. If the storage shape feels old, I'm more interested in whether the client contract is new.

---

### C5 — vs Forgejo / git hosting

**Simulated comment:**
> Just use Forgejo/GitLab if you want self-hosted team code storage.

**Tree:**
```
→ Same as PH C1 but drier
→ Self-hosting not in beta scope
```

**Recommended reply:**
> Forgejo solves git hosting and review workflows. Kitchen removes the git primitive entirely — no remotes, no refs. For teams that want PR-based governance, Forgejo is the right tool. Kitchen is for teams that want live sync to a mirror path with version rows instead of commits. orthogonal products.

---

<a id="skeptics"></a>

## Skeptics (genuine)

### S1 — Offline / partition tolerance

**Simulated comment:**
> No offline story? CAP theorem says this dies the moment my laptop leaves WiFi.

**Tree:**
```
IF offline required
  → v0 assumes connected; queue TBD in desktop-sync doc
  → Don't bluff
IF "useless without offline"
  → Acknowledge; name target users (connected teams)
```

**Recommended reply:**
> Policy is Notion-on-phone: edit offline, mirror queues inserts, flush on reconnect; conflicts fork into merge. Task 020 tracks implementation — I won't claim plane mode in marketing until verify passes. You're right that shipping without the queue would limit adoption; it's on the post-gate list with the mirror client.

---

### S2 — Large monorepo / binary scale

**Simulated comment:**
> 50MB per version row? My node_modules alone is 400MB. This doesn't scale.

**Tree:**
```
IF node_modules
  → Mirror ignores vendor dirs in practice / .kitchenignore future?
  → Honest: haven't solved monorepo at scale
IF binary assets
  → Same model; practical limits untested
```

**Recommended reply:**
> Fair — 50MB soft cap per version row in docs; monorepo scale untested. Real-world mirror would need ignore rules (like gitignore) for vendor trees — not shipped. Binary blobs use same file/version model without separate blob service in v0. If your repo is huge, Kitchen isn't ready; looking for small-project pain first.

---

### S3 — Merge without auto-three-way

**Simulated comment:**
> Human line-pick for every divergence? That doesn't scale past two developers.

**Tree:**
```
IF scale concern
  → Fork is exception path; solo live sync is default
  → Pierre for composition, not conflict markers
IF "git merge is fine"
  → Different UX goal — no <<<<<<<
```

**Recommended reply:**
> Default path is solo live sync — no merge UI. Fork+merge is the exception when two people save without pairing. Human line-pick is intentional (VISION: no auto-three-way without human selection). For large teams with constant divergence, git's merge machinery may fit better. We're testing small-team concurrent edit frequency first.

---

### S4 — Convex dependency

**Simulated comment:**
> "Backend agnostic" but shipped on Convex with Convex reactivity in every doc. That's lock-in.

**Tree:**
```
IF lock-in
  → Contract: insert-only versions, WS fan-out, property ACL walk
  → Convex = reference; spike portability later
IF "just admit it"
  → Admit Convex is production beta backend
```

**Recommended reply:**
> Production beta runs on Convex — correct. "Backend agnostic" means the Sync Store *contract* (insert-only versions, file-property ACL, live subscriptions) is what clients depend on, not Convex APIs. Porting cost is real; I'm not claiming zero migration. Reference impl lets us ship beta without building a database first.

---

### S5 — ACL on file properties

**Simulated comment:**
> Putting ACL in JSON properties on files is clever but how do you prevent privilege escalation via property edits? What's the threat model?

**Tree:**
```
IF security serious
  → Only admin roles mutate sensitive properties
  → Server enforces on insert; cite permissions.md
  → Offer to discuss in DM
IF "clever == fragile"
  → Three-entity constraint rationale
```

**Recommended reply:**
> Writes to `files.properties` go through same authz walk as content inserts — only holders of write-capable roles on that subtree can change grants. `org:*` keys are display hints, not the security boundary. Threat model for beta: trusted org members, server-side enforcement, no client-side security. Enterprise hardening isn't claimed. Algorithm is in docs/concepts/permissions.md — happy to dig in if you see a hole.

---

### S6 — "Show HN but no desktop = not real"

**Simulated comment:**
> Show HN is for something people can use. A web textarea isn't a filesystem replacement.

**Tree:**
```
IF Show HN rules
  → Product is usable at URL — web beta qualifies
  → Desktop is roadmap, not vapor
IF "textarea != editor"
  → Web proves sync store; mirror proves work contract
```

**Recommended reply:**
> Usable today: sign up, org/project/files, live sync across tabs, fork/merge UI, role admin. The Show HN is the Sync Store model, not the desktop mirror. Agree that textarea isn't nvim — web client proves fan-out and versioning; mirror driver is next. If that's too early for you, reasonable to wait.

---

<a id="haters"></a>

## Haters

### H1 — "Solution looking for problem"

**Simulated comment:**
> I don't know anyone who needs this. Git works for millions of developers. This is founder fantasy.

**Tree:**
```
→ Don't argue demographics
→ Name one concrete scenario
→ Invite falsification
→ One reply
```

**Recommended reply:**
> Plausible — might be a niche. Scenario I'm testing: two developers, different editors (nvim + VS Code), want shared project state without screen share or Live Share lock-in, and want every save versioned without commit ceremony. If you don't have that pain, you don't need this. I'm using Show HN to find out if anyone does.

---

### H2 — FAQ / doc contradiction (lethal on HN)

**Simulated comment:**
> Your FAQ literally says "Is there a working app? Not yet." and "backend undecided." Did you forget to update docs before Show HN?

**Tree:**
```
IF doc drift (they're right)
  → Thank them — HN respects this
  → State current truth
  → "Fixing FAQ before/during launch"
→ NEVER blame commenter
```

**Recommended reply:**
> Good catch — FAQ is stale. Web beta is live at kitchen-gilt-nine.vercel.app (Convex + Clerk production). Updating docs/faq.md — that contradiction shouldn't have shipped. Current state: web client works; desktop mirror and offline do not.

**Pre-launch:** Fix `docs/faq.md` immediately. This comment destroys credibility if left unfixed.

---

### H3 — "Pierre dependency = not built"

**Simulated comment:**
> You're outsourcing merge to "Pierre" and collab to a CLI spike. So the core UX isn't yours yet.

**Tree:**
```
IF integration vs build
  → Pierre = diff/line-pick primitives; fork/merge UI is ours
  → Integrate first per VISION constraint
IF "spike isn't product"
  → Agree; spike proves protocol
```

**Recommended reply:**
> Pierre supplies diff/merge primitives — we own the fork model, version graph, and merge UI that inserts composed versions. Collab relay + agent spike proves editor-agnostic pairing; product UI comes after mirror. Constraint: integrate Pierre before building custom merge (VISION). Fair to call beta incomplete — scope is Sync Store + web sync + merge UI, not full collab product.

---

### S9 — `rm -rf` — orphans?

**Simulated comment:**
> You delete a folder locally. Orphan rows? Cascade? Data loss?

**Recommended reply:**

> Soft tombstone: `properties.deleted = "true"` on the File row. Versions stay — infinite retention. Tree queries skip deleted nodes, so there's no entry point from the project root and no live orphan paths. VCS semantics, not sync-and-forget cloud storage.

---

### S8 — `mv` in terminal — orphan File row?

**Simulated comment:**
> I moved a file in the terminal. Does your Sync Store still point at the old path?

**Recommended reply:**

> Moves are `parentId` / `name` on the File row (`files.updateMetadata`), not a new version. The mirror daemon diffs Convex tree vs disk on WebSocket metadata changes and on local `mv` events — cloud move renames on disk; local move patches Convex. Same `fileId` end-to-end.

---

### S7 — Forked file, one disk path (mirror launch week)

**Simulated comment:**
> Two version heads in your database, one file on disk. Last-write-wins on the filesystem contradicts your fork model. Which head is `page.tsx`?

**Tree:**

```
→ Acknowledge one-path constraint
→ Explain fork mirror policy (see 03-mirror-edge-cases.md E1)
→ v0: author's inserts write locally; remote inserts frozen until merge
→ Link merge UI
```

**Recommended reply:**

> One path, multiple heads is the hard design problem. When `forked: true`, the mirror applies **your** version inserts to disk but won't overwrite with **remote** inserts until merge. Pierre line-pick composes a single head; mirrors converge after. We don't silently pick a winner on disk — that would be Dropbox semantics, not Kitchen.

---

<a id="builders"></a>

## Builders (reward with depth — these earn OP upvotes)

### B1 — Deep technical engagement

**Simulated comment:**
> How do you handle fork resolution when two version heads each have different parentVersionIds? DAG merge or just two-parent merge inserts?

**Tree:**
```
→ This is a gift — answer with precision
→ Cite schema / versions.ts behavior
→ Admit if not implemented
→ Long reply OK
```

**Recommended reply:**
> Merge inserts a new version with `parentVersionIds` pointing at the heads being composed (typically two for line-pick). The file pointer advances to the merge product; `forked` clears when a single head policy resumes. Full DAG history is preserved in version rows — not discarded. I can point you at `web/convex/versions.ts` for the mutation shape. If you're asking about CRDT-style automatic convergence — that's explicitly not what we do.

**Mog tip:** Builders who get great answers become allies in thread. They'll defend you against H1.

---

### B2 — "I tried it" bug report

**Simulated comment:**
> Tried signup — merge UI confusing / sync delayed 3s / role admin unclear.

**Tree:**
```
→ Thank + ask repro steps
→ Fix if real
→ Follow up in thread when fixed
```

**Recommended reply:**
> Thanks for trying — 3s sync sounds wrong (should feel sub-second on Convex dev). Can you share: browser, two-tab or two-user, file size? Merge UX feedback is exactly what beta is for. I'll chase the latency.

---

## HN-specific rules

| Rule | Kitchen application |
|------|---------------------|
| No voting solicitation | Never "please upvote" |
| Substantive > short | OK to write 2 paragraphs for B1 |
| Self-deprecating honesty | "FAQ was stale" beats "you misread" |
| Don't feed flamewars | One reply to H1/H2/H3 |
| Stay on thread all day | OP visibility decays after 6–8 hours |

## Quick reference — HN tone cheatsheet

| They say | You lead with |
|----------|---------------|
| "Git works" | Different optimization target |
| "Nothing new" | Mirror + collab contract |
| "FAQ wrong" | Thank + fix docs |
| "No offline" | True; connected beta |
| Technical DAG question | Precise answer + code pointer |
| "Vaporware" | 60-sec repro path |