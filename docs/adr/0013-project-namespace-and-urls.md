# Project namespace — unique per account; `/<username>/<project>` URLs

Project **names** are unique among siblings under the same **account** (Q16 = A). Two users may both have a project named `flakebed` — different cloud rows, different URLs.

## Uniqueness

| Constraint | Rule |
|------------|------|
| Sibling key | `(accountId, name)` — enforced like any `parentId` + `name` pair |
| Cross-account | **Collision allowed** — `mostlyalice/flakebed` and `bobactually/flakebed` are distinct |
| Mirror disk | Flat `~/Projects/flakebed/` per machine — one user per workstation session |

## Web / share links

Public and shareable paths use **account username** + **project name**:

```
https://kitchen.example/mostlyalice/flakebed
https://kitchen.example/bobactually/flakebed
```

- **Username** = account slug set at `/onboarding` ([ADR 0014](./0014-username-onboarding-and-redirects.md)); placeholder `{domain}-{localPart}`; change at `/account/`. Email **immutable**.
- **Project** = project `name` segment (top-level `~/Projects` folder name)
- FOSS (`role:public: read`) projects resolve at this URL; org/user scopes require auth

## CLI / agents

`npx kitchen changes flakebed/…` resolves against **your** account (JWT). To read another user's public project, use web URL or qualified path once CLI supports `username/project` (task 024+).

## Consequences

- Task 024: account row includes `username` slug; unique index
- Web routes: `/[username]/[project]/…` for browse + FOSS discovery
- GTM: "yourusername/yourproject" not a global project slug