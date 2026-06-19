# Product Hunt — Comment Roasts & Response Trees

Simulated comments based on Open Caffeine threads (comparison attacks, misleading naming), Mina/Upstream skepticism, and Kitchen landmines.

---

## Glazers

<a id="glazers"></a>

### G1 — Pure hype glazer

**Simulated comment:**
> This is SO needed omg 🔥🔥 congrats on the launch team!!!

**Tree:**
```
IF emoji-only / no substance
  → Short warm reply + one concrete try-step
ELSE IF they mention a pain point
  → Thank + echo pain point + ask them to test that flow
```

**Recommended reply:**
> Thank you — means a lot. If you have 60 seconds: sign up, create a project, open two tabs, save in one. Curious if the live sync feels instant enough to be useful or still "demo magic."

**Avoid:** Matching emoji spam. Asking for upvotes.

---

### G2 — "I've been waiting for Google Drive for code"

**Simulated comment:**
> I've literally wanted this for years. Dropbox never got versioning right for dev workflows.

**Tree:**
```
IF they describe past pain (Dropbox, git ceremony)
  → Validate + differentiate Kitchen version model
  → Ask what project they'd pilot on
ELSE
  → G1 path
```

**Recommended reply:**
> That's the exact itch — Drive-like mirror, but every save is a queryable version row, not just "latest bytes." Would you be open to trying a small side project on the beta? Genuinely want to know where it breaks for real work.

**Mog tip:** This person is a **design partner candidate**. Offer to DM for feedback.

---

### G3 — Influencer drive-by

**Simulated comment:**
> Congrats to the team on launch day! 🚀

**Tree:**
```
IF verified PH hunter / large following
  → Thank by name + one sentence product hook + invite real try
ELSE
  → Brief thank, prioritize hotter threads
```

**Recommended reply:**
> Thanks [Name] — Kitchen is live-sync project storage: cloud truth, browser beta today, `$HOME/Projects` mirror next. Honest beta; would value your take if you try the two-tab sync.

---

<a id="comparers"></a>

## Comparers

### C1 — vs Git / GitHub

**Simulated comment:**
> How is this different from GitHub? You're still just storing code remotely. Git already syncs. This feels like reinventing the wheel.

**Tree:**
```
IF they conflate hosting with sync primitive
  → Explain git optimizes async review; Kitchen optimizes live fan-out
IF they ask about history/audit
  → Insert-only versions, not commits
IF "no PRs = no governance"
  → ACL + fork/merge + human review via line-pick (different shape)
```

**Recommended reply:**
> GitHub hosts git repos — async by design. Kitchen's **"no git"** means you never run `add` / `commit` / `push` / `pull` / `rebase` again; saves are tracked as version rows and fan out in seconds. Git is still right for OSS release trains and PR governance. Kitchen is for when you want live sync without the command loop. Different optimization target.

---

### C2 — vs Dropbox / Drive / Syncthing

**Simulated comment:**
> Isn't this just Syncthing with extra steps? I already sync my projects folder.

**Tree:**
```
IF bytes-on-disk comparison
  → Version rows + fork/merge + ACL on files
IF "I use git inside synced folder"
  → Acknowledge confusion risk; git-in-mirror out of scope
```

**Recommended reply:**
> Syncthing syncs files on disk — latest bytes win, no per-save version history as queryable rows, no project-scoped ACL inheritance, no fork→line-pick merge when two people save concurrently. Kitchen's Sync Store is authoritative; the disk path is a rebuilt mirror. If Syncthing covers your workflow, stick with it — we're aiming at teams who want live sync *and* structured divergence, not just folder replication.

---

### C3 — vs VS Code Live Share

**Simulated comment:**
> VS Code Live Share already does realtime pair programming. Why build this?

**Tree:**
```
IF pair-programming only
  → Editor-agnostic collab agent; nvim + VS Code
IF they mention solo sync
  → Live Share is session-based; Kitchen is always-on project store
```

**Recommended reply:**
> Live Share is excellent *inside VS Code* for session-based pairing. Kitchen targets editor-agnostic work: Collab agent per machine, mirror at `$HOME/Projects`, checkpoint → version insert. Voice stays on Discord. Solo live sync is the default mode — pair is one of three, not the whole product. If you're all-in on VS Code, Live Share may be enough.

---

### C4 — vs Google Docs / OT

**Simulated comment:**
> Google Docs solved realtime editing. Just use a CRDT. Why human merge?

**Tree:**
```
IF CRDT theology
  → Kitchen chooses insert-only versions + human line-pick by design
  → Auto-three-way explicitly out of scope (VISION)
IF "conflict markers bad"
  → Agree — that's why Pierre line-pick, not <<<<<<<
```

**Recommended reply:**
> Docs optimizes concurrent character-level OT — great for prose. Kitchen stores code as append-only version rows; when two saves diverge, both exist (forked state) and a human composes via line-pick. Automatic three-way merge without human selection is intentionally out of scope — we're optimizing auditability and explicit merge decisions over silent convergence.

---

### C5 — vs "another Convex demo app"

**Simulated comment:**
> Cool Convex tutorial. Next.js + Clerk + Convex is the new Firebase starter pack.

**Tree:**
```
IF dismissive / framework fatigue
  → Don't defend stack — elevate Sync Store model
  → Convex = reference impl, contract is portable
```

**Recommended reply:**
> Fair — the stack is boring on purpose so the model is the story: files as rows, insert-only versions, property-based ACL, live fan-out. Convex is the reference backend, not the product. If the two-tab sync demo doesn't interest you, the framework won't save it — totally get that.

---

### C6 — Open Caffeine-style "how is this different from OG X"

**Simulated comment:**
> How is Kitchen different from [GitLab/PlasticSCM/Perforce/Dropbox]? Calling it "no git" is misleading when you still have version history and merge.

**Tree:**
```
IF naming / positioning attack (valid)
  → Clarify: "no git" = no commit/push/branch/PR primitives
  → We have versions + merge — different mechanism
IF bad-faith "misleading"
  → One correction, cite glossary, stop
```

**Recommended reply:**
> Fair question. **"No git"** means mutations are just tracked — every save inserts a version row and live-syncs. You never spend another brain cell on `git add`, `commit`, `push`, `pull`, or `rebase`. We still have history and merge (line-pick when edits diverge). The tagline is about killing the command loop, not killing versioning.

**Mog tip:** Don't retreat from "no git" — expand it on first challenge, then stop repeating. One clear expansion per thread beats three defensive paragraphs.

---

<a id="skeptics"></a>

## Skeptics (genuine)

### S1 — "Where's the desktop client?"

**Simulated comment:**
> Your whole pitch is `$HOME/Projects` and nvim but the beta is a browser textarea. Where's the mirror?

**Tree:**
```
IF landmine (valid hit)
  → Acknowledge immediately — #1 credibility move
  → Web beta proves Sync Store + sync
  → Mirror driver is next
IF "false advertising"
  → Soften: marketing shows target state; beta scope is web
```

**Recommended reply:**
> You're right to call this out. Today's beta is web-only — live sync across tabs, fork/merge UI, org/role admin. The `$HOME/Projects` mirror is the designed contract; the desktop client isn't shipped yet. We launched the web layer first to prove the Sync Store model. If browser-only isn't useful to you, waiting for the mirror is reasonable.

**Pre-launch:** Fix marketing banner or hero copy. See [known-landmines.md](./known-landmines.md).

---

### S2 — "No git import = dead on arrival"

**Simulated comment:**
> No import from GitHub? Hard pass. Nobody starts greenfield.

**Tree:**
```
IF migration question
  → Out of scope for beta; first-principles onboarding
  → Ask what import shape they'd need
IF "every tool needs git"
  → Name workflows where live sync matters without git (pair, fast onboarding)
```

**Recommended reply:**
> Import/export isn't in the beta — intentional scope cut. Onboarding today is create project, start writing. We're testing whether live sync + version rows + ACL is compelling *before* building migration bridges. What would minimal git import need to look like for you to try it — full history, or HEAD snapshot only?

---

### S3 — Pricing / business model

**Simulated comment:**
> Free beta but what's the monetization? Per-seat? Storage? I won't invest workflow into a tool that'll rug-pull pricing.

**Tree:**
```
IF trust question
  → Free during beta; team pricing announced before paid
  → No credit card today
IF VC bait accusation
  → Facts + design-partner invite, not defense
```

**Recommended reply:**
> Free during beta, no credit card. Plan is org-scoped team pricing before any paid launch — we'll announce before charging. Right now I'm looking for design partners who want the model, not locked-in customers. If pricing uncertainty blocks you, waiting is fair.

---

### S4 — Security / ACL

**Simulated comment:**
> ACL as JSON properties on files? That sounds like security through obscurity. Where's the audit log?

**Tree:**
```
IF "properties = weak"
  → Server walks ancestor chain on every insert; UI hiding ≠ security
IF audit log request
  → Versions ARE audit log (insert-only)
IF enterprise compliance
  → Beta; honest about maturity
```

**Recommended reply:**
> Properties are the grant declaration; enforcement is server-side on every read and `versions.insert` — walk ancestors, merge keys child-overrides-parent, deny if no matching role. Insert-only versions *are* the audit trail. Enterprise compliance isn't claimed for beta — happy to walk through the algorithm if you're evaluating seriously.

---

### S5 — "Codename cringe"

**Simulated comment:**
> "Kitchen" as a codename in a public launch feels unfinished. Why PH before you have a real name?

**Tree:**
```
IF branding question
  → One disclaimer; name changes before wide launch
  → Model matters more than name for beta feedback
```

**Recommended reply:**
> Fair — Kitchen is a working title and will change. We shipped beta under the codename to test the Sync Store model with real users, not to polish branding. If the name blocks you from trying the product, understood.

---

## Haters

### H1 — "Misleading marketing"

**Simulated comment:**
> Site promises pair programming across nvim and VS Code but there's no desktop app. This is borderline false advertising.

**Tree:**
```
→ Full C.L.E.A.R.
→ Do NOT argue "it's obviously beta"
→ Offer specific page fix if they link one
→ One reply only
```

**Recommended reply:**
> Valid criticism. The marketing describes the full model; the beta is web sync + merge + org admin — not the mirror or collab UI yet. That's a messaging failure on our side, not something you should have to infer. We're adding explicit beta scope to the hero. Collab proof runs via CLI spike in the repo today.

---

### H2 — "AI slop / vaporware"

**Simulated comment:**
> Another AI-generated landing page for a product that doesn't exist. Convex todo app energy.

**Tree:**
```
IF no evidence they tried URL
  → Link 60-sec repro
IF they tried and hit bug
  → Fix bug, thank reporter
IF pure dunk
  → One factual reply, disengage
```

**Recommended reply:**
> Try it: kitchen-gilt-nine.vercel.app — sign up, create a project, two tabs, save in one. Web beta is live (Convex + Clerk). Desktop mirror isn't. If something breaks on that path, tell me the step — that's more useful than "vaporware."

---

### S6 — macOS-only mirror at launch

**Simulated comment:**
> Windows user. No mirror client for me. "Any editor" is false advertising.

**Recommended reply:**

> Web beta works on every OS today. macOS mirror ships first for launch — Windows/Linux follow. "Editor-agnostic" means no VS Code plugin required, not every OS on day one. Fair to wait if local-editor path is the feature you need.

---

### S7 — `git init` in mirror folder

**Simulated comment:**
> You say no git but the folder is right there on disk. I git init and now what?

**Recommended reply:**

> Kitchen doesn't coordinate with `.git/` — out of scope by design. Mirror watcher ignores `.git` in v0. Your files sync as Kitchen versions; git remotes are your problem, not ours.

---

## Quick reference — PH tone cheatsheet

| They say | You lead with |
|----------|---------------|
| "Just use git" | Different optimization target |
| "Just use Dropbox" | Version rows + ACL + fork merge |
| "Where's desktop?" | You're right; web beta today |
| "Love it!" | Try two-tab sync + one question |
| "Misleading" | Acknowledge + scope fix |