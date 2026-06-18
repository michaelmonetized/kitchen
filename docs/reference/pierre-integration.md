# Pierre Integration

Kitchen depends on **Pierre** diff and tree primitives for version comparison and human-driven merge. Fork Pierre only if first-principles constraints block integration.

## Why Pierre

The source concept names Pierre explicitly:

> A Pierre diff view would allow you to pick lines while viewing 2 file versions simultaneously to create a new merged version.

Kitchen's insert-only versioning produces **parallel heads**, not merge commits. Pierre's line-picking UX matches that model better than automatic three-way merge.

## Scope of integration

| Primitive | Kitchen use |
|-----------|-------------|
| **Diff view** | Side-by-side two versions of a text file |
| **Line pick** | User selects which lines survive in merged output |
| **Tree** | Project file browser; possibly move/rename operations |

## Merge flow

```
┌────────────────┐     ┌────────────────┐
│  Version A     │     │  Version B     │
│  (left pane)   │     │  (right pane)  │
└───────┬────────┘     └───────┬────────┘
        │    Pierre diff       │
        └──────────┬───────────┘
                   ▼
           Line pick UI
                   │
                   ▼
           Merged buffer
                   │
                   ▼
        versions.insert(merged)
```

### Client responsibilities

| Step | Owner |
|------|-------|
| Fetch version content | Kitchen client |
| Render diff | Pierre component |
| Track line selections | Pierre + Kitchen state |
| Compose merged text | Kitchen merge controller |
| Persist result | Kitchen `versions.insert` |

## Fork vs integrate decision tree

```
Can Pierre diff run in our web/desktop stack?
├── Yes → integrate upstream; wrap with Kitchen theme
└── No → is it licensing, bundle size, or API shape?
    ├── API shape → contribute upstream or thin adapter
    └── fundamental mismatch → fork with Pierre attribution
```

**Default: integrate.** Boil-the-ocean only when blocked.

## Text vs binary

| Type | Pierre role (v0) |
|------|------------------|
| Text source | Full line-pick merge |
| JSON / YAML | Text merge with syntax-aware highlighting (nice-to-have) |
| Binary | Pick whole file A or B — no line merge |

## Tree primitive

Pierre tree may accelerate:

- File tree UI in web client
- Move/rename drag-and-drop with optimistic updates

Tree operations still mutate File rows upstream — Pierre is UI, not source of truth.

## Testing merge integration

Acceptance scenarios:

1. Two versions, non-overlapping edits → pick all from either side → valid merge insert
2. Overlapping edits → deliberate line picks → merge insert matches preview
3. Merge insert advances pointer → desktop mirror writes merged file
4. Cancel merge → no insert, pointer stays forked

## Open items

- Pierre package names and versions — assign during implementation spike
- WASM vs native module for desktop Electron shell
- Accessibility of line-pick UI

## Related

- [Versioning](../architecture/versioning.md)
- [Files and Versions](../concepts/files-and-versions.md)
- [Web and Mobile](../clients/web-and-mobile.md)