# Feature Spec — VAL-26640: [UI/UX][CI] Prepare Setup Step

> Source: Jira VAL-26640 (Epic) | Wiki: MVF/950870855 | Generated: 2026-06-05 | Status: Draft
> Owner: MOUZAYA Myriam | Component: ATLANTIS

## Goal
Migrate the **Prepare Setup** step (a.k.a. *Prepare Build Environment* / *Build Environment*) of the
CI / **Build & Test** process from the legacy MFE architecture (`web/apps/ci-process-mfe`) to the new
**domains** architecture (`web/libs/domains/business-process`). The step deploys the build environment
by launching a **TPK**, reusing the exact same `mxevolve-scenario-runs` widget used by the **Convert
Binary** step of the already-migrated Upgrade Process. Behaviour for end users is preserved; only the
architecture changes.

## Non-Goals
- The CI **execution view, run header and run stepper** — owned by **VAL-26634**.
- **`build-and-test` data-access** (execution fetcher, `BuildAndTestProcessExecution` + `prepareBuildStage`
  model, GET `executions/ci-process/:id` contract) — owned by **VAL-26634**; reused here.
- **Skipped-step stepper rendering** (greyed, non-clickable, `"- Skipped"` suffix) — owned by **VAL-26634**.
- **Backported-BP p-message** (`source.type === BUSINESS_PROCESS`) — header-level, owned by **VAL-26634**.
- **Create Branch "Branch is being created" illustration** — owned by **VAL-26634 / Create Branch step**.
- The legacy **decision / stop** experience (`prepare-build-environment-decision`, `showDecision`,
  `stop-prepare-build-environment` endpoint) — **dropped** (replaced by Abort; confirmed in wiki note 6).
- Any backend/API change.
- Mutating Jira tickets.

## Background & Context
- Jira: *"We are deploying the build environment. Technically, we are launching a TPK so we will use
  the same component used in the convert binary step in the upgrade process."*
- **Convert Binary** (`web/libs/domains/business-process/feature/src/lib/upgrade-process/convert-binary-stage`)
  is the authoritative template. Prepare Setup = same wrapper, `subContextId="PREPARE_BUILD_ENVIRONMENT"`.
- `mxevolve-scenario-runs` (from `@mxevolve/domains/test/widget`) already provides: TPK status, history,
  termination message ("see more"), Rerun (repush), Abort, env link, assignee, collapse/expand,
  and authorization via `ShowElementIfAuthorizedDirective`.
- Wiki Q&A (MVF/950870855) and code inspection resolve all open design questions (see `decision-log.md`).

## Figma References
| Node | Description | URL |
|------|-------------|-----|
| `5628-131855` | **Full Page** — complete Prepare Setup step view | [Open in Figma](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=5628-131855&t=rZjkJqWIj8Gm24GO-0) |
| `5628-132285` | **The TPK Section** — Build Environment / TPK panel detail | [Open in Figma](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=5628-132285&t=rZjkJqWIj8Gm24GO-0) |
| `5628-132399` | **Feature entry point** (shared by Khaled) | [Open in Figma](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=5628-132399&t=rZjkJqWIj8Gm24GO-0) |
| `9615-68110` | **Dev mode — stage detail** (shared by Khaled) | [Open in Figma (dev)](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) |
| `9766-55448` | **Prepare And Build Skipped** state (owned by VAL-26634 stepper) | [Open in Figma (dev)](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9766-55448&m=dev) |

## Feature-Level Acceptance Criteria
| # | Criterion | Source | Confidence |
|---|-----------|--------|------------|
| 1 | Stage body renders in domains architecture, mirroring `convert-binary-stage`. | Jira + Code | High |
| 2 | TPK panel wired with `subContextId="PREPARE_BUILD_ENVIRONMENT"`. | Old UI | High |
| 3 | Component is **collapsed by default** (`detailsExpandedByDefault=false`). | Wiki Q6 + Note 4 | High |
| 4 | Running/Failed/Passed states handled by the widget; termination message shown on failure. | Jira | High |
| 5 | Panel-level environment status badge **not shown**. | Wiki Q3 + Note 3 | High |
| 6 | Repush = widget **Rerun**; stop = widget **Abort**. No `repush-`/`stop-prepare-build-environment`. | Wiki Note 6 | High |
| 7 | TPK status change triggers `reloadExecution()`. | Convert Binary pattern | High |
| 8 | Authorization gating preserved via widget's `ShowElementIfAuthorizedDirective`. | Explore | High |
| 9 | Unit tests mirror `convert-binary-stage.component.spec.ts`. | User | High |

## Constraints & Assumptions
- Target lib folder: **`build-and-test-process`** under `web/libs/domains/business-process/feature/src/lib`.
- Hard dependency on **VAL-26634** (CI shell + stepper + `build-and-test` data-access).
- No NgRx — signals + `rxResource` (mirrors Upgrade Process / Convert Binary).
- Reuse, do not re-implement: `mxevolve-scenario-runs`, `StageContainerComponent`,
  `BusinessProcessContentContainerComponent`, state-updater reload pattern.

## Open Questions
All resolved — see `decision-log.md`.
