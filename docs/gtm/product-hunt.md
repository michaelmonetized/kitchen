# Product Hunt

> **DRAFT — do not post until [`grilling/02-launch-gate.md`](./grilling/02-launch-gate.md) passes.**

Platform: [producthunt.com](https://www.producthunt.com)  
Launch day: Tuesday–Thursday, 12:01 AM PT (after desktop mirror ships)  
Tags: `Developer Tools` · `Productivity` · `Open Source` (if collab packages public)

---

## Name

Kitchen

## Tagline (60 chars max)

Your projects live in the cloud. Your editor sees them on disk.

## Description

Most developers still stack four systems: editor → files on disk → git → remote hosting. Collaboration is async — branch, commit, push, open PR, wait.

Kitchen asks a different question: **what if the cloud held the truth, your disk was a live mirror, and you never ran `git push` again?**

Unlike git hosting or another IDE, Kitchen is a cloud-native **project store** — files are database rows, every save appends a version, and WebSockets push changes to every logged-in machine in seconds. Your disk at `$HOME/Projects` is a mirror, like Google Drive for code. Keep nvim, VS Code, Zed, or anything that reads a path.

**Three ways to work together:**

- **Solo sync** — save in your editor; teammates see it live
- **Fork + merge** — concurrent saves create parallel versions; pick lines in a Pierre diff
- **Live pair** — Collab agent per machine; nvim and VS Code on the same file without a browser

**For teams:** granular ACL without a separate permissions service. Roles are org-scoped; assign members per project. Access grants (`role:editor:write`, `role:viewer:read`) live on file rows and inherit down the tree — enforced server-side on every save.

Web beta is live. Desktop mirror and full collab ship next. Kitchen is a working codename.

---

## Maker first comment

📌 Hey Product Hunt!

I built Kitchen because I was tired of the ceremony between "I saved the file" and "my teammate can see it." **"No git"** means mutations are just tracked — you never run `add` / `commit` / `push` / `pull` / `rebase` again. Every save inserts a version row and live-syncs. I wanted that with my normal editor, not another browser IDE.

**Try it in 60 seconds:**

1. Open [kitchen-gilt-nine.vercel.app](https://kitchen-gilt-nine.vercel.app)
2. Sign up, create a project, add a file
3. Open the same project in a second tab — save in one, watch the other update

No git clone. No push. Every save is a version row you can fork and merge later.

I'm especially curious about feedback from:

- Teams who pair across different editors
- People who've wanted "Google Drive for code" but need real version history
- Anyone allergic to conflict markers — we merge by line-pick, not `<<<<<<<`

Kitchen is a codename. Stack is Next.js + Convex + Clerk. Video demo in the gallery.

What would make this your default project store?

---

## Gallery assets

1. Hero — four layers diagram (from marketing site)
2. GIF — two-browser-tab live sync
3. Video — `launch-video/out/teaser.mp4` (re-record with Personal Voice when ready)
4. Screenshot — Pierre merge / fork UI
5. Screenshot — project file tree

## Launch checklist

- [ ] Hunter + 5–10 supporters queued for first hour
- [ ] Maker comment posted at 12:01 AM PT
- [ ] Reply to every comment within 15 minutes (first 4 hours critical)
- [ ] Cross-post Twitter thread link in a reply when asked