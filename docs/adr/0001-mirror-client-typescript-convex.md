# Mirror client: TypeScript service + Convex realtime

Kitchen's v0 **desktop mirror** is a TypeScript process — either an Electron menubar app or a headless background service (same sync engine, optional tray UI). It clears the public launch gate: *"Your editor sees them on disk."*

**Cloud → disk:** Subscribe to Convex (live queries / default realtime sync). On file tree or version changes, write trees and file contents under `$HOME/Projects/<project>/`.

**Disk → cloud:** Filesystem watcher on the mirror root. On local modification (debounced, echo-suppressed), read bytes and call `versions.insert`.

Collab agent, pair UI, and cross-platform parity ship after this bidirectional solo-sync loop is proven. macOS first for launch verification.

**Considered:** Custom WebSocket client duplicating Convex subscriptions — rejected; Convex already provides realtime fan-out. Full native per-OS clients — deferred (3× cost).

**Consequences:** Launch-max (PH/HN) blocked until this client ships. Electron menubar is optional chrome; headless daemon is sufficient for the promise.