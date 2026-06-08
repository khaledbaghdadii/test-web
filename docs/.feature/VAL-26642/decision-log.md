# Decision Log — VAL-26642: CI Merge Step

## Dependency Classification
| Dependency | Class | Notes |
|------------|-------|-------|
| Upgrade-process merge step (`domains/business-process/feature/.../upgrade-process/integrate-changes-stage`) | in-repo verified | Authoritative structural template; reuses shared widgets. |
| `mxevolve-merge-request-stepper` (scm/widget) | in-repo verified | 3 sub-steps: Under Review / Under Validation / Merge. Inputs: `mergeRequestId`, `projectId`. |
| `mxevolve-retry-merge-request`, `mxevolve-fix-issues`, `mxevolve-branch-details`, `mxevolve-merge-request-details-form` (composite-widget) | in-repo verified | Footer actions + branch details + form. |
| `mxevolve-final-product-details-component` (features/artifact-manager) | in-repo verified | Inputs: `finalProductId`, `projectId`; Output: `errorEventEmitter`. **Lib tagged `type:legacy`** — cannot be consumed from a domains lib. Migrated Tag stage does NOT render it. → build a new `domains/artifact/widget` FP component (data-access has factory-product only; needs new final-product service). |
| Legacy CI integrate-changes components (10 components) | in-repo verified | Source of behaviour; v1 backport code to be copied as-is. |
| CI execution fields `ciVersion`/`backportRequested`/`willPublishFinalProduct`/`finalProductId`/`backportFinalProductId` | in-repo verified | Drive rendering; present in state + pact contract. |
| Gateway user-input endpoints (send-for-review, reopen, fix-issues, cherry-picked, repush-backport) | in-repo verified | Unchanged. |
| validation-process as a template | known from user/docs | NOT the target pattern — it is the older `features/business-process` MFE/NgRx generation. Use upgrade-process instead. |
| Wiki backport refinements ("Failed to Launch Backports" table, banner above tables) | known from Jira/docs | From MVF/950870862 + img3. |

## Decisions
| Date | Decision | Made by | Rationale |
|------|----------|---------|-----------|
| 2026-06-04 | Anchor on upgrade-process (domains) pattern; treat validation-process as non-template. | Feature Architect | User directive + modern arch. |
| 2026-06-04 | Target lib = **`build-and-test-process`** under `domains/business-process/feature/src/lib`. | Khaled | Matches CI/Build & Test domain naming. |
| 2026-06-04 | Preserve v1 (legacy per-backport tabs) and v2 (summary tab) split by `ciVersion`; copy v1 code as-is into a **`legacy/`** subfolder, **de-remoted** (no `RemoteComponentInjectorService` / scm-mfe loading). | Khaled + Wiki | Backward compatibility; remote MFE loading is being removed; `legacy/` marks it clearly. |
| 2026-06-04 | v2 Backports keeps the **two tables** (backport executions w/ status; failed-to-launch definitions by definition name) rendered with **ag-grid** (shared wrapper); deleted/missing-definition **error banner moved ABOVE** the tables. | Khaled + Figma 9769-57211 + img3 | Same behaviour as today, restyled to new design. |
| 2026-06-04 | Build a **new Final Product Details widget in `domains/artifact/widget`** (`type:widget`, `scope:artifact`), backed by a new **final-product service/models in `domains/artifact/data-access`**. The CI feature consumes it cross-domain (same pattern as `business-process/feature` → `scm/widget`). Do NOT depend on legacy `features/artifact-manager` (`type:legacy`). | Khaled + Feature Architect | `domains/artifact` already has the full tier set incl. `widget`; final-product belongs to the artifact domain; avoids domains→legacy Nx violation; reusable by the future Tag-stage migration. |
| 2026-06-04 | No feature flags / authorization added to merge step; keep state-based gating + host route guard. | Feature Architect + Explore | Matches current MFE (no flags/auth in this step). |

| 2026-06-04 | New Final Product Details widget: **implement the new Figma design** (do NOT "copy as tag stage" — that refers to the new validation-process, which is out of scope). | Khaled | Feature delivers the new design; tag-stage reuse reference dropped. |

## Open Questions
| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | ~~Final lib name/location~~ → **Resolved: `build-and-test-process`** under `domains/business-process/feature`. | Scaffolding / S1 | Resolved |
| 2 | ~~Legacy v1 backport tabs in scope + remote loading?~~ → **Resolved: in scope, copy as-is into `legacy/`, de-remoted (no remote MFE).** | Scope / S5 | Resolved |
| 3 | ~~v2 backport tables design?~~ → **Resolved: keep 2 tables (executions + failed-to-launch definitions) in ag-grid; banner above tables.** | S4 behaviour | Resolved |
| 4 | ~~Depend on `features/artifact-manager`?~~ → **Resolved: no. New Final Product Details widget in `domains/artifact/widget` + final-product service in `domains/artifact/data-access`; consumed cross-domain by the CI feature.** | S3 / lib boundaries | Resolved |
| 5 | ~~Domains equivalent of backport MR view?~~ → **Resolved by Q2: none exists; copy legacy view as-is under `legacy/`, de-remoted.** (Node 9769-57211 is the v2 backports table, not this view.) | S5 | Resolved |
| 6 | ~~Re-implement to new Figma vs port legacy markup for the FP widget?~~ → **Resolved: implement the new Figma design.** | S3 | Resolved |
