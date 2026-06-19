# Twitter / X

Platform: [x.com](https://x.com)  
Format: Video-first (Launch Playbook: video ≈ 10× static)

Attach: `launch-video/out/teaser.mp4` or 30s screen recording (two-tab sync)

---

## Launch post (pin for 48h)

```
Your projects live in the cloud.
Your editor sees them on disk.
There is no git.

Kitchen — live-sync code storage:
• files = DB rows, versions = insert-only history
• WebSocket push in seconds (not push/pull)
• mirror at $HOME/Projects — nvim, VS Code, Zed, anything
• pair across editors via Collab agent

Web beta is live → kitchen-gilt-nine.vercel.app

( Kitchen is a codename — name will change )

"No git" = no add/commit/push/pull/rebase. Saves tracked automatically.

🧵 how it works
```

---

## Thread (reply to launch post)

**1/** Most devs stack four systems:

editor → disk → git → remote

Collaboration = async. Live editing = Google Docs, not your repo.

**2/** Kitchen collapses storage, sync, work, and collaboration:

☁️ cloud holds truth
💾 disk is a mirror
📝 save = version insert
⚡ sync = always on

**3/** Solo mode: save in VS Code on your laptop. Your desktop's mirror updates in seconds. No commit. No push.

**4/** Fork mode: two people edit the same file without pairing. Both versions exist. Merge by picking lines — not conflict markers.

**5/** Pair mode: nvim + VS Code on the same file. Collab agent per machine. Voice on Discord. Checkpoint → one version.

**6/** Teams: org roles, project-scoped members, ACL as file properties (`role:editor:write`) — inherited down the tree, enforced on every save. No separate permissions microservice.

**7/** Try it: kitchen-gilt-nine.vercel.app

Open two tabs. Save in one. Watch the other.

Not another IDE. Not git hosting. A project store.

Feedback welcome — especially if you've wanted "Google Drive for code" with real history.

---

## Follow-up posts (week 1)

**Demo clip (no thread):**

```
60 seconds: create a project → edit a file → watch live sync across two browser tabs.

No git clone. No push.

kitchen-gilt-nine.vercel.app
```

**Builder angle:**

```
Hot take: git optimizes for code review, not for "my teammate should see this save."

Kitchen's bet: live sync is the default. Fork + line-pick is the exception.

Shipping the web beta this week. Desktop mirror next.
```

**PH cross-post (launch day):**

```
We're on Product Hunt today 🚀

Kitchen — cloud project store, live sync, no git.

Would mean a lot if you tried it and left honest feedback:

[PH link]
```

---

## Quote-tweet template (for trend-jacking)

When replying to viral dev-tool / workflow posts:

```
This is the async-default problem Kitchen is built around — [specific point from original post].

Live sync to $HOME/Projects, versions on every save, merge by line-pick when edits diverge.

Beta: kitchen-gilt-nine.vercel.app
```