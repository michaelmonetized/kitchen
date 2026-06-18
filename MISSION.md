# Mission: Kitchen

## Why

Understand Kitchen's **novel model** for project storage, sync, solo work, and collaboration — well enough to use the docs, contribute design, or reason about tradeoffs without importing git or cloud-IDE assumptions.

## Success looks like

- Explain storage (rows + versions), sync (live), work (mirror + any editor), and collaboration (three modes) in plain language
- Trace solo save: editor → mirror → `versions.insert` → peer mirror
- Trace pair session: Collab agent → relay → checkpoint → version
- Distinguish live sync from live collab without hesitation
- Use [GLOSSARY.md](./GLOSSARY.md) terms correctly

## Constraints

- Progressive disclosure: [The Kitchen Way](./docs/the-kitchen-way.md) before architecture deep dives
- Glossary-consistent vocabulary in all teaching materials
- Voice/chat external; Kitchen syncs file bytes only

## Out of scope

- Production deployment literacy (design phase)
- Git migration workflows
- Choosing Convex vs custom backend (reference only)