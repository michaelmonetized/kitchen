# Indie Hackers

Platform: [indiehackers.com](https://indiehackers.com)  
Use case: Pre-launch feedback loop + launch-day spike (per Startup Launch Platforms)

---

## Product page

**Name:** Kitchen  
**URL:** https://kitchen-gilt-nine.vercel.app  
**Tagline:** Cloud project store with live sync — no git

**Description:**

Kitchen is a cloud-native way to store, sync, work on, and collaborate on code.

Most teams stack editor → disk → git → remote. Kitchen collapses that into one model: files are database rows, saves append versions, WebSockets push to every machine in seconds. Your editor reads `$HOME/Projects` — a mirror, not the authority.

**What you can try today (web beta):**

- Sign up, create org/project, edit files
- Watch live sync across browser tabs
- Fork and merge when edits diverge (Pierre line-pick UI)
- Org admin: members, roles, project-scoped assignment — ACL as file properties (`role:editor:write`), inherited down the tree

**What's next:**

- Desktop mirror driver (macOS first)
- Collab agent for editor-agnostic pair programming
- Mobile read client

**Stack:** Next.js 16, Convex, Clerk  
**Stage:** Beta — free, no credit card  
**Codename:** Kitchen will be renamed before public launch

---

## Launch post (IH forum)

**Title:** Launching Kitchen — live-sync code storage without git (web beta)

**Body:**

Hey IH 👋

I've been documenting and building Kitchen for the past few months — a cloud project store where the Sync Store is truth and your disk is a mirror.

**Why I started:**

Git is the wrong default when I want a teammate to see my save in seconds, not after commit → push → pull. I also wanted to pair in nvim while my cofounder uses VS Code — without browser tabs or IDE-specific extensions.

**What shipped:**

- Web app at kitchen-gilt-nine.vercel.app
- Live sync via Convex reactivity
- Version history on every save (insert-only, no upsert)
- Fork + Pierre merge UI when concurrent edits diverge
- Collab proof-of-concept in repo (`npm run spike:pair`)

**What didn't ship yet:**

- Desktop mirror (the `$HOME/Projects` contract is designed, not productized)
- Billing (free beta)
- Final product name ("Kitchen" is a codename)

**Numbers (honest):**

- 14-task agent build loop to get web beta shippable
- Smoke tests against Vercel prod
- 0 paying customers — looking for design partners

**Ask:**

1. Would you try this for a side project? What would block you?
2. Solo sync vs fork+merge vs live pair — which mode matters most for your workflow?
3. Anyone want to pair on a collab session dogfood?

Link: https://kitchen-gilt-nine.vercel.app

Building in public — happy to answer architecture questions in comments.