# Feature Spec — VAL-26642: [UI/UX][CI] Merge Step

> Source: Jira VAL-26642 (Epic) | Wiki: MVF/950870862 | Generated: 2026-06-04 | Status: Draft
> Owner: MOUZAYA Myriam | Component: ATLANTIS

## Goal
Migrate the **Merge Step** (a.k.a. *Integrate Changes*) of the CI / **Build & Test** process from the
legacy Angular MFE (`web/apps/ci-process-mfe`) to the new **domains** architecture
(`web/libs/domains/business-process`), with the new Figma design. The migrated step must reuse the
already-migrated **Upgrade Process** merge step and **add the Final Product generation/details**
section (which the Upgrade Process does not have). Behaviour — feature flags, authorizations, button
gating, CI v1/v2 branching, backport handling — must be preserved exactly; only the UI/architecture change.

## Non-Goals
- Migrating other CI stages (Build & Test stage, Create Branch, etc.) — only the Merge / Integrate Changes step.
- Any backend/API change. The step consumes existing gateway endpoints unchanged.
- Redesigning backport behaviour for **legacy** processes — those are copied **as-is** for backward compatibility.
- Mutating Jira tickets.

## Background & Context
- The Jira epic says verbatim: *"Same as the upgrade. Add to it the Final product generation component."*
- The **Upgrade Process** merge step is already migrated under `web/libs/domains/business-process/feature/src/lib/upgrade-process/integrate-changes-stage` and reuses shared components (merge-request-stepper, retry-merge-request, fix-issues, branch-details). This is the authoritative template.
- The CI merge step differs from Upgrade by: (1) showing **Final Product Details** at the end of the merge (and per-backport sub-merge), and (2) a **Backports** experience (legacy per-backport tabs + new summary tab).
- The wiki (MVF/950870862) answers functional questions and clarifies the new backport tables. Three screenshots were captured: final-product failure state, the legacy cherry-pick `@switch` code, and the new Backports tab design.

## Feature-Level Acceptance Criteria
| # | Criterion | Source | Confidence |
|---|-----------|--------|------------|
| 1 | Merge / Integrate-Changes step renders in the new domains architecture, mirroring the Upgrade Process merge step (stage-container, content-container, merge-request-stepper, retry-merge-request, fix-issues, branch-details). | Jira + Explore | High |
| 2 | A **Final Product Details** section is shown when `willPublishFinalProduct` is true and a `finalProductId` is available — reusing the same component shown in the Tag stage. During creation it shows available info with `-` for missing fields and status *In Progress*; on failure it shows the same error UI as today ("Failed to request publishing a final product"). | Jira + Wiki Q1-Q3 + img1 | High |
| 3 | **CI v2** processes show a single **"Backports"** tab: an *On-Demand Backport Executions* table (Name + Status), a new *Failed to Launch Backports* table (BP Definition Name), and — for deleted definitions — an error banner with the definition id placed **above** the tables. | Wiki + img3 | High |
| 4 | **CI v1 / legacy** processes keep per-backport tabs with the cherry-pick `@switch` (in-progress alert / manual cherry-pick / backport MR view), repush backport action, branch details and final-product publishing — copied as-is for backward compatibility. | Wiki Q "old processes" + img2 | High |
| 5 | The info alert is preserved: v1 *"Backport will start after integrating into x passes"* / v2 *"Backport processes will start after changes are integrated into ${integrateDestinationBranch}"*. | Wiki + Explore | High |
| 6 | All button gating is state-based and identical to today (Create New Merge Request / Reopen / Fix Issues / Cherry-Pick Done / Repush Backport MR), including the Stopped/decision states. | Explore | High |
| 7 | Feature-flag and authorization behaviour is unchanged: the merge step has no flags/auth of its own; gating stays state-based and route protection stays at the host (`executionExistsGuard` + shell authorization). | Explore | Med |

## Constraints & Assumptions
- Target = **domains** architecture (standalone components, signal `input()`, `rxResource`, no NgRx, lazy `loadComponent` routing) — same as Upgrade Process, **not** the older `features/business-process` MFE pattern used by validation-process.
- Target lib = **`build-and-test-process`** under `web/libs/domains/business-process/feature/src/lib`; legacy v1 backport code lives under a `legacy/` subfolder, de-remoted.
- No existing domains Final Product Details component — a **new** one must be built in **`domains/artifact/widget`** (backed by a new final-product service in `domains/artifact/data-access`); the legacy `features/artifact-manager` one is tagged `type:legacy` and cannot be consumed by a domains lib.
- The CI execution payload exposes `ciVersion`, `backportRequested`, `willPublishFinalProduct`, `finalProductId`/`backportFinalProductId` — these drive rendering.

## Open Questions (summary)
See [decision-log.md](decision-log.md). Most items now resolved (lib = `build-and-test-process`; legacy backports copied as-is under `legacy/`, de-remoted; v2 = two ag-grid tables + banner above). Remaining open: which domains lib hosts the new Final Product Details component (and whether it's shared with the future Tag-stage migration), and whether to re-implement it to the new Figma vs port the legacy markup.
