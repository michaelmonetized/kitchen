# New Teammate Walkthrough

How a new developer joins a team on Kitchen — without `git clone`, SSH keys, or branch checkout.

**Prerequisites:** [Orgs and Roles](../concepts/orgs-and-roles.md), [Getting Started](../getting-started.md)

## Cast

| Actor | Role |
|-------|------|
| **Dana** | Org admin at Acme Corp |
| **Sam** | New hire, no Kitchen account yet |
| **Org** | `acme-corp` (File row, `type: dir`, `parent: null`) |
| **Project** | `acme-web` (File row under org) |

## Timeline

### Step 1 — Dana invites Sam

Dana opens web admin (future app):

1. Creates User record for `sam@example.com` (or Sam self-registers via invite link)
2. Inserts `user_roles`: Sam → `editor` role, scoped to Project `acme-web`

No repository URL to copy. No deploy keys.

### Step 2 — Sam authenticates

Sam logs in via OAuth or magic link. Session token issued. WebSocket connection opens.

Server loads Sam's `user_roles`:

```
userId: sam
roleId: editor (org: acme-corp)
projectFileId: acme-web
```

### Step 3 — Sam installs desktop client

Sam downloads Kitchen desktop for Windows:

1. Logs in with same account
2. Client queries `projects.forUser(samId)`
3. Returns `[acme-web]` (not `acme-mobile` — Sam lacks role there)
4. Client subscribes to Project `acme-web`
5. Client creates `C:\Users\Sam\Projects\acme-web\`
6. Writes current version bytes for every file in tree

```
C:\Users\Sam\Projects\
└── acme-web\
    ├── src\
    │   └── app\
    │       └── page.tsx
    └── package.json
```

Tray icon: **Synced**.

### Step 4 — Sam opens project in VS Code

Sam opens `C:\Users\Sam\Projects\acme-web` in VS Code. It is a normal folder. No special extension required for v0.

She edits `page.tsx`. On save:

1. Watcher → `versions.insert`
2. Alice and Bob (existing editors) receive update over WebSocket
3. Their mirrors update within seconds

### Step 5 — Sam hits a read-only project

Sam tries to open `acme-mobile` in web UI. Server checks properties + roles:

- Sam has no `user_roles` entry for `acme-mobile`
- **Deny** — project not listed in browser

Client never relied on hidden UI alone — server enforced.

## Contrast with git onboarding

| Step | Git hosting | Kitchen |
|------|-------------|---------|
| Access grant | Add to GitHub org + repo | `user_roles.insert` |
| Local setup | `git clone`, credentials | Login + mirror appears |
| Right project only | Repo URL discipline | Role scoping on `projectFileId` |
| First edit | commit + push | save (automatic insert) |

## Admin checklist

Before a new teammate can edit:

- [ ] User exists and can authenticate
- [ ] Role defined in org role table
- [ ] `user_roles` row links user → role → project (or org-wide)
- [ ] Project root File has `"role:<name>": "write"` (or inherits from parent)
- [ ] Desktop client installed (for mirror workflow)

## Retrieval check

1. What appears on Sam's disk without clone? **Mirror of authorized projects under `Projects/`**
2. Why does Sam not see `acme-mobile`? **No role assignment for that project**
3. What happens on Sam's first save? **New version insert + WebSocket fan-out**

## Related

- [Permissions](../concepts/permissions.md)
- [Desktop Sync](../clients/desktop-sync.md)
- [Orgs and Roles](../concepts/orgs-and-roles.md)