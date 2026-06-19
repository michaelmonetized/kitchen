# DevHunt

Platform: [devhunt.org](https://devhunt.org)  
Audience: Developers, open-source builders, technical early adopters

---

## Product name

Kitchen

## Tagline

Live-sync code storage — files as rows, disk as mirror, no git

## Short description (280 chars)

Kitchen stores projects in the cloud and mirrors them to `$HOME/Projects`. Every save appends a version; WebSockets sync in seconds. Use nvim, VS Code, or Zed. Fork and merge by line-pick. Web beta live.

## Full description

**The stack today:** editor → local files → git → remote. Sync is async. Pairing needs screen share or IDE extensions.

**Kitchen's model:** cloud Sync Store is truth. Desktop mirror is a view. Save inserts history. WebSockets fan out live.

| Layer | What it does |
|-------|--------------|
| Storage | Files = DB rows; versions = insert-only |
| Sync | WebSocket push in seconds |
| Work | Mirror at `$HOME/Projects` — any editor |
| Collab | Solo sync · fork+merge · live pair via Collab agent |
| ACL | `role:editor:write` on file rows · per-project assignment · inherited down tree |

**Try now:** https://kitchen-gilt-nine.vercel.app

- Create a project, edit a file, open two tabs — watch sync
- Concurrent saves → fork → Pierre line-pick merge
- Collab spike in monorepo: `npm run spike:pair`

**Built with:** Next.js 16, Convex, Clerk, TypeScript

**Not built:** Git import, automatic three-way merge, custom IDE

Kitchen is a working codename. Desktop mirror ships after web beta validation.

## Links

- **Website:** https://kitchen-gilt-nine.vercel.app
- **GitHub:** (add public repo URL when ready)
- **Docs:** https://github.com/hustle-launch/kitchen (or docs site path)

## Categories

Developer Tools · Version Control · Collaboration · Real-time

## Screenshots

1. File tree + editor with live sync indicator
2. Two-tab sync demo
3. Merge / Pierre line-pick UI
4. Four layers diagram