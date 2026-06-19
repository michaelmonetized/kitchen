# Mirror tree diff for moves and renames

Cloud-side **tree moves** are `files` row updates — `parentId` and/or `name` change via `files.updateMetadata`, not a new `versions` row. The mirror client keeps disk aligned by **diffing trees**: Convex file tree (live subscription) vs `$HOME/Projects/` layout.

**Cloud → disk:** On file metadata change over WebSocket, diff detects path change → `fs.rename` / `mkdir` with echo suppression.

**Disk → cloud:** On local `mv` / `rename` / create / delete (watcher), diff against last-known tree → `files.insert`, `files.updateMetadata`, or tombstone policy.

Forked **content** still follows [grill policy A](../gtm/grilling/03-mirror-edge-cases.md#e1--forked-file-two-heads-one-path-on-disk): author's version bytes write locally; remote content frozen until merge. Tree moves are independent of version heads.

**Considered:** Content-only mirror (ignore local renames) — rejected for launch gate; founder requires wide tree sync.

**Consequences:** Task 015 must implement tree diff engine alongside content sync; 016 smoke should include `mv` roundtrip.