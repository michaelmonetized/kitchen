# Kitchen Glossary

Canonical language for the Kitchen project. All documentation adheres to these terms.

## Core

**Kitchen**:
The codename for a cloud-native project store where files are database rows, versions are append-only, and local filesystem trees are mirrors. Not the final product name.
_Avoid_: The app, the platform, cloud IDE

**Sync Store**:
The authoritative cloud backend that persists users, roles, files, and versions and broadcasts changes over WebSockets.
_Avoid_: Database, backend, Convex (unless referring to the reference implementation)

**Mirror**:
The local filesystem projection of a project at `$HOME/Projects/<project>`, maintained by a desktop client in realtime.
_Avoid_: Clone, checkout, working copy, sync folder

**Version**:
An append-only row capturing a file's content at a point in time. Saving never overwrites — it inserts. Concurrent edits produce multiple versions.
_Avoid_: Commit, snapshot, revision (unless discussing git migration)

**File**:
A row in the Sync Store representing a directory (`type: dir`) or leaf content (`type: file`). Orgs and projects are special `dir` files.
_Avoid_: Blob, document, node (unless in a tree algorithm context)

## Tenancy

**Org**:
A `dir` file with no parent. The top-level tenancy boundary for members, roles, and projects.
_Avoid_: Team, workspace, account

**Project**:
A `dir` file whose only parent is an org. Contains all code and assets for one deliverable.
_Avoid_: Repo, repository, codebase

**Role**:
A named permission bundle defined in an org's role table. Files grant access via `role:{name:read|write}` properties.
_Avoid_: Group, ACL entry, policy

**User**:
An authenticated identity that can belong to orgs via role assignment and own or admin orgs and projects.
_Avoid_: Account, member (member is fine when describing org membership, not as the entity name)

## Operations

**Insert-only versioning**:
The rule that file content changes always create new version rows. Upsert is forbidden at the version layer.
_Avoid_: Save, update (use "insert a version" instead)

**Live sync**:
Realtime propagation of durable file and version changes (checkpoints and solo saves) to all connected clients via WebSockets.
_Avoid_: Polling, pull, fetch latest

**Live collab**:
Simultaneous editing of one file by multiple users in a shared **Collab session** — operation broadcast over a collab relay, ephemeral until **Checkpoint**. Distinct from live sync.
_Avoid_: Realtime sync (when meaning durable propagation), Google Docs (Kitchen is storage-first)

**Collab session**:
Ephemeral room bound to one **File** and one base **Version**; not a Sync Store entity. Participants join via collab relay WebSocket channel.
_Avoid_: Room table, chat channel, fourth entity

**Presence**:
Ephemeral per-user state in a collab session: cursor position, selection range, active/inactive. Not persisted as **Version** rows.
_Avoid_: Cursor version, commit metadata

**Edit operation**:
Atomic change (insert, delete, or replace) broadcast within a collab session before checkpoint.
_Avoid_: Keystroke log, commit diff

**Checkpoint**:
Collab session commits current buffer to the **Sync Store** via `versions.insert`; the durable boundary between ephemeral and persistent.
_Avoid_: Autosave (when meaning solo mirror save), commit

**Collab agent**:
Background service on each machine (part of the **Desktop client**) that joins collab relay sessions and bridges the **Mirror** file: local disk changes → ops upstream, remote ops → mirror writes. Editor-agnostic.
_Avoid_: Sync daemon (solo mode), IDE plugin

**Collab adapter**:
Optional editor-specific plugin (VS Code extension, Neovim plugin) that talks to the **Collab agent** for in-editor **Presence** or faster-than-autowrite ops. Not required to pair in v0.
_Avoid_: Plugin (prefer **Collab adapter** or **Kitchen extension**), LSP bridge

**Pierre Merge**:
A human-driven merge workflow using Pierre diff primitives: view two versions side-by-side, pick lines, insert a new version.
_Avoid_: Auto-merge, conflict resolution (unless describing the UX step)

## Clients

**Desktop client**:
A macOS, Windows, or Linux app that maintains the Mirror at `$HOME/Projects` and syncs bidirectionally with the Sync Store.
_Avoid_: Sync agent, daemon, Drive client

**Web client**:
Browser-based access to projects without requiring a local mirror.
_Avoid_: Online IDE (Kitchen is storage-first, not IDE-first)

**Mobile client**:
Phone and tablet access for viewing and light editing. Mirror not required.
_Avoid_: App

## Disambiguation

In this project, **"file"** always means a Sync Store row, even when discussing a `.ts` source file. When referring to the OS filesystem, say **"local file"** or **"mirrored path"**.