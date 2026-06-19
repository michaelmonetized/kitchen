# LinkedIn

Platform: [linkedin.com](https://linkedin.com)  
Format: Video post (30–90s) + founder narrative  
Audience: Engineering leads, startup founders, remote teams

Attach: Teaser video or screen recording with captions

---

## Launch post

**Headline in first line (before "see more"):**

I stopped waiting for `git push` to mean my teammate could see my code.

**Body:**

For years I stacked the same four systems: editor → files on disk → git → remote hosting. It works — until you want live collaboration without screen share, or a new teammate who shouldn't spend day one on clone, fetch, and branch checkout.

So I built Kitchen (working codename).

**The idea in one breath:** your projects live in the cloud. Your editor sees them on disk. There is no git.

- **Storage** — files are database rows; every save appends a version
- **Sync** — WebSockets push changes in seconds, not commit cycles
- **Work** — mirror at `$HOME/Projects`; keep VS Code, nvim, Zed, your terminal
- **Collaboration** — solo live sync, async fork+merge (pick lines, not conflict markers), or live pair across different editors
- **Access control** — role-based permissions on every file and folder; scope editors to specific projects; grants inherit down the tree and enforce on every save (no separate ACL microservice)

Kitchen is not another IDE and not a git host. It's a cloud-native project store — closer to "Google Drive for code" with real version history.

**Web beta is live:** https://kitchen-gilt-nine.vercel.app

Sign up, create a project, open two tabs, save in one, watch the other update. I'd genuinely love feedback from teams who:

- Pair across different editors
- Onboard people without clone ceremonies
- Want live sync without giving up local tooling

Video attached — 60-second walkthrough.

Kitchen is a codename; the name will change before any wide launch.

#devtools #buildinpublic #engineering #startups

---

## Comment reply templates

**"How is this different from GitHub?"**

GitHub hosts git repos. Kitchen doesn't use git as the sync primitive — saves insert version rows and fan out over WebSockets. Think live sync first, human merge when edits diverge.

**"Security / where's data stored?"**

Web beta runs on Convex (production deployment) with Clerk auth. Happy to share more detail on tenancy and ACL model — files carry role-based access as properties on rows.

**"Is this ready for production teams?"**

Honest answer: web beta, not GA. Desktop mirror and full collab ship after more dogfooding. Looking for design partners who want the model, not a finished replacement for their entire workflow.

---

## Week 1 follow-up (warm outbound companion)

Short post after scraping launch-day likers:

```
Quick follow-up on Kitchen from yesterday —

If you tried the beta, what broke first?

I'm especially hunting for:
• sync latency across machines
• merge UX when two people edit the same file
• "would I actually use this instead of git for X"

kitchen-gilt-nine.vercel.app — 2-minute repro is enough.
```