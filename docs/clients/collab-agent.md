# Collab Agent

The **Collab agent** is a background service on each machine (part of the Kitchen desktop client) that enables **editor-agnostic** pair programming. You use whatever editor you want — Neovim, VS Code, Zed — as long as it reads and writes the **Mirror** path.

## What it does

1. Joins a **collab session** on the relay when you run `kitchen pair join <file>` (CLI or tray)
2. **Watches** the mirrored file path for that session
3. On local disk change → compute diff → `collab.applyOp` (NOT `versions.insert`)
4. On remote `op.apply` → write bytes to mirror path (echo-suppressed)
5. On **checkpoint** → relay triggers `versions.insert`; agent confirms mirror matches
6. Exposes optional localhost status API for tray UI (session info, participants)

**Editor-agnostic:** anything that edits `$HOME/Projects/...` works. No Kitchen plugin required for v0.

## Pairing story (v0 acceptance)

```
Alice (nvim)                    Bob (VS Code)
 edits mirror                   edits mirror
     │                               │
     ▼                               ▼
 Collab agent (Mac)            Collab agent (Win)
     │                               │
     └───────────┬───────────────────┘
                 ▼
           Collab relay (cloud)
      ops sync + periodic checkpoint
```

Alice and Bob coordinate on Discord (external). Kitchen handles file bytes only.

## Autowrite requirement

The agent watches **files on disk**, not editor memory.

| Editor | Recommended setting |
|--------|---------------------|
| Neovim | `set autowrite` or `set autowriteall` |
| VS Code | `files.autoSave: afterDelay` (e.g. 300ms) |
| Zed | Enable autosave |

Without autowrite/autosave, pairing works but feels like save-to-sync. That is editor flush latency, not a Kitchen bug.

## Presence without plugins

| Capability | v0 (agent only) | Optional plugin (plan 011) |
|------------|-----------------|---------------------------|
| See partner's edits | ✓ via mirror updates | ✓ |
| See partner's cursor in editor | ✗ | ✓ |
| Tray: "Bob is in session" | ✓ | ✓ |

## Session commands (target)

```bash
kitchen pair start src/utils.ts    # start session, print sessionId
kitchen pair join <sessionId>      # join existing session
kitchen pair leave                 # leave; may trigger checkpoint
kitchen pair status                # participants, file, session state
```

## Integration with desktop client

```
┌─────────────────────────────────────────┐
│            Desktop application           │
├─────────────────────────────────────────┤
│  Sync engine        │  Collab agent      │
│  mirror ↔ Sync Store│  mirror ↔ relay    │
├─────────────────────────────────────────┤
│  Mirror driver (shared watcher)          │
└─────────────────────────────────────────┘
```

### During active collab session

1. User starts/joins pair via tray or CLI
2. Agent marks file `collab-session`
3. Watcher events on that path → diff → `collab.applyOp`
4. Remote ops → agent writes mirror (echo suppress)
5. Checkpoint → `versions.insert` via relay
6. Session end → agent idle; solo edits resume direct `versions.insert`

## Communication and terminal sharing

**Voice/video/chat:** Kitchen does **not** build audio, video, or text chat. Use phone, Google Meet, Discord, or in-person coordination.

**Terminal sharing:** Sharing a live shell so your partner types in your terminal (VS Code Live Share feature) is **out of scope**. Each developer runs their own terminal against the shared mirror.

## Optional Collab adapters (post-v0)

Future `kitchen-vscode` or `kitchen.nvim` plugins may add:

- In-editor remote cursors (**Presence**)
- Faster op capture than disk watcher (before autowrite flushes)

Plugins talk to the Collab agent on localhost. They **enhance** presence; they do not replace the agent as the pairing mechanism. See [Optional Editor Plugins](./editor-plugins.md).

## Spike implementation

Reference code lives in `packages/collab-agent` and `packages/collab-relay`. Run:

```bash
npm install
npm run spike:pair
```

## Related

- [Live Collaboration](../architecture/live-collaboration.md)
- [Desktop Sync](./desktop-sync.md)
- [Optional Editor Plugins](./editor-plugins.md)