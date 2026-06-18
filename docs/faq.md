# FAQ

Short answers to common questions. Terms match [GLOSSARY.md](../GLOSSARY.md).

**New here?** Start with [The Kitchen Way](./the-kitchen-way.md).

## The novel model

### What is Kitchen in one sentence?

Cloud project storage with a local mirror, live sync, automatic version history, and editor-agnostic pair programming — no git.

### How is Kitchen different from Dropbox for code?

Dropbox mirrors files but does not treat every save as a queryable version row or offer Pierre Merge across divergent versions. Kitchen is storage-first with insert-only history.

### How is Kitchen different from a cloud IDE?

Kitchen does not host your editor, LSP, or terminal. You work in local tools against `$HOME/Projects`.

### What are the three modes of work?

Solo live sync, async concurrent (fork + merge), and live collab (pair session). See [Three Modes of Work](./concepts/three-modes-of-work.md).

## Product

### Is Kitchen a cloud IDE?

No. Kitchen is **storage and sync**. You use your local editor against the Mirror. Web editing exists but IDE features (LSP, terminals) are out of scope for v0.

### Is Kitchen "git in the cloud"?

No. Kitchen removes commits, branches, and pull requests by design. Versions are insert-only rows; merge is human line-picking via Pierre.

### Why the codename "Kitchen"?

Working title only. Not the final product name. See [README.md](../README.md).

### Is there a working app?

Not yet. This repository is design-phase documentation and plans.

## Technical

### What backend does Kitchen use?

Undecided. [Convex](https://docs.convex.dev/) is the reference profile (WebSockets, live queries). The **Sync Store contract** matters; the vendor does not.

### Can I use git inside the mirror?

You could `git init` in `$HOME/Projects/my-app`, but Kitchen does not coordinate with `.git/`. Expect confusion. Git compatibility is [out of scope](../VISION.md).

### How are binaries stored?

Same as text: Version `content` bytes + File `mime`. No separate blob service in v0. See [Files and Versions](./concepts/files-and-versions.md).

### What happens offline?

Undefined for v0. Assume connected. Offline queue policy is TBD in [Desktop Sync](./clients/desktop-sync.md).

### How big can a file be?

v0 suggests 50 MB soft cap per version row. Chunked versions are a future plan.

## Permissions

### How is access controlled?

Role table + `user_roles` + `role:*` properties on File rows. Server enforces on every read/insert. See [Permissions](./concepts/permissions.md).

### What does `org:acme` property do?

Display metadata for membership hints. **Not** the security boundary.

## Collaboration

### Two people save at once. Who wins?

Neither insert is rejected. Both versions exist; file enters **forked** state until Pierre Merge inserts a composed version.

### Does Kitchen auto-merge?

No. Automatic three-way merge without human line selection is out of scope.

### What is Pierre?

External diff/merge/tree primitives Kitchen plans to integrate. See [Pierre Integration](./reference/pierre-integration.md).

### Does Kitchen support pair programming?

Yes. **Live collab** via **Collab agent** on each machine — editor-agnostic (nvim + VS Code, no plugins). See [Live Collaboration](./concepts/live-collaboration.md).

### Is live collab the same as live sync?

No. Live sync propagates `version.insert` rows. Live collab streams ops until **checkpoint**.

### Can I pair in nvim while my teammate uses VS Code?

Yes. Each machine runs a **Collab agent** watching the mirror. Enable autowrite/autosave for responsive sync.

### Do I need a browser to pair?

No. Browser is an optional collab participant, not required.

### Does Kitchen include voice or video chat?

No. Use phone, Google Meet, Discord, or any external tool. Kitchen syncs file bytes only.

### How often are versions created during a pair session?

At **checkpoints** — debounced or explicit — not per keystroke.

## Migration

### Can I import a git repo?

Not as a primary v0 workflow. Import tooling may come later.

### How does CI trigger builds?

CI must adapt to `version.insert` events or pointer changes — not git SHAs. Integration patterns are not specified yet.

## Learning

### Where do I start?

[docs/README.md](./README.md) learning paths. Most readers: Introduction → Getting Started → Concepts.

### I know git. What should I read?

[Git Comparison](./concepts/git-comparison.md) in 15 minutes.

## Still stuck?

Ask a follow-up question — specify which doc section confused you.