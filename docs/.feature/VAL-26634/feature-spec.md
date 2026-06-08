# Feature Spec — VAL-26634: [UI/UX][CI] Build & Test Run Page Header & Run Stepper

> Source: Jira VAL-26634 (Epic) | Generated: 2026-06-05 | Status: Draft
> Owner: MOUZAYA Myriam | Component: ATLANTIS

## Goal
Migrate the legacy **Build & Test (CI) process** Run page **header** and **run stepper** from the
old MFE-based architecture (`ci-process-mfe` + `@mxflow/features/business-process`) into the new
Angular **domain-library** architecture, reusing the pattern already established by the migrated
**Upgrade Process**. The new header/stepper are wired into the existing `ci-process-mfe` for now;
the MFE is removed later once all stages are migrated.

## Non-Goals
- Migrating the 4 CI **stage bodies** (create-branch, prepare-build, build-and-test, integrate-changes) — separate later stories.
- Deleting the `ci-process-mfe` MFE — happens only after all stages are migrated.
- Adding a **Reference Environment** tab (explicitly excluded for CI per wiki; Roma adds it a future PI).
- Any backend/API changes — all endpoints already exist and are reused as-is.

## Background & Context
The Upgrade Process was already migrated to `web/libs/domains/business-process/*` using a composite
`ExecutionRunHeaderComponent`, a shared `mxevolve-stepper`, signals + `rxResource` (no NgRx), and
reused UI atoms (`execution-status-tag`, `expiry-chip`, `execution-abort-button`). This feature
replicates that pattern for CI, with documented differences (renames, per-stage start/end dates,
skip-step behaviour). Source: wiki page MVF/950870852 (functional Q&A + technical notes).

## Design References
- **Figma (MxEvolve):** [node 9615-68110](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) — CI Build & Test run page header + run stepper.
- **Screenshots** (captured in `wiki-context/`): `jira_config_params.png` (Config Parameters row), `jira_skip_step.png` (skipped step), `wiki_img1.png` (technical notes).
- Full Figma/visual table in [design.md](design.md#figma--visual-references).

## Feature-Level Acceptance Criteria
| # | Criterion | Source | Confidence |
|---|-----------|--------|------------|
| 1 | A new CI run header renders Run Name, Process Status (`execution-status-tag`), Expiry tag (`expiry-chip`), and Abort (`execution-abort-button`) | Jira/Wiki | High |
| 2 | Run Details shows General (Template Name, Activity Type, Description), Config Parameters (Repository, Configuration Branch, Configuration Parent Branch), Build Scenario Definition, Infrastructure Parameters (Build Environment Infra Group, Test Environment Infra Group) | Jira/Images | High |
| 3 | Branch Details tab reuses the same component/logic as the Upgrade Process (same commits logic) | Wiki | High |
| 4 | No Reference Environments tab is shown for CI | Wiki | High |
| 5 | The run stepper reuses the shared `mxevolve-stepper`, showing per-stage **Start/End dates** (via step tooltip) | Wiki | High |
| 6 | A **skipped** build-env deploy step is shown greyed, non-clickable, with a `"- Skipped"` suffix (distinct from not-yet-reached `inactive` steps) | Jira image | High |
| 7 | Expiry tag is always shown unless the process is finished (same as Upgrade) | Wiki | High |
| 8 | On first creation of a CI process, the legacy loading message is replaced by the create-branch illustration used in the validation/upgrade process | Wiki | High |
| 9 | All CI API calls/DTOs are copied into a new data-access lib (`build-and-test`) with tests | User | High |
| 10 | All new components have unit tests | User | High |
| 11 | The new header + stepper replace the old usage inside `ci-process-mfe`; old header components/usage are removed | User | High |

## Constraints & Assumptions
- Follow the Upgrade Process structure: `feature` (run view) → `composite-widget` (run header, branch details, abort) → `widget` (run details) → `ui` (status tag, expiry chip) → `data-access` (fetcher/services/models) → `shared/ui/primitive` (stepper, illustration).
- No NgRx in the new code — use signals + `rxResource` (mirrors Upgrade Process).
- `ExecutionFamily.USER_STORY_BUILD_AND_TEST` already exists and is reused (no new enum value).
- Reuse, do not re-implement: `execution-status-tag`, `expiry-chip`, `execution-abort-button`, `branch-details`, `mxevolve-stepper`, `mxevolve-illustration`.

## Open Questions (summary)
- None blocking. All functional/technical questions were resolved via the wiki and code verification. See `decision-log.md`.
