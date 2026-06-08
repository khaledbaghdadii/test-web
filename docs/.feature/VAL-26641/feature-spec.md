# Feature Spec — VAL-26641: Migrate the CI "Build & Test" step to the new domains architecture

> Source: Jira VAL-26641 | Generated: 2026-06-05 | Status: Draft
> Working branch: `ui/VAL-26641` | Feature folder: `.github/devo/.feature/VAL-26641/`
> Figma file key: `8Z7emdDFkZapK3nmVP2HsA` (frames exported to `figma/`, annotated in `refinement/figma-notes.md`)
> Wiki: MVF `950870859` (cleaned to `wiki-context/page-950870859.md`)

## Goal
Re-implement the **body of the "Build & Test" step** of the CI (Build & Test) process in the new
Angular *domains* architecture, redrawn per the new Figma, **without losing a single existing
behaviour, authorization, feature flag, tooltip, confirmation or empty state** that exists in the
legacy `ci-process-mfe`. The migrated step slots into the run shell + stepper delivered by VAL-26634.

This is the **4th and final** feature of the CI migration. After it (plus the MFE-removal tail story)
the legacy `ci-process-mfe` can be deleted and the whole CI process runs on domains.

## Non-Goals (owned by sibling features)
- **Run shell, run header, stepper, `"skipped"` step status, CI data-access (`BuildAndTestProcessExecution`
  + `GET …/executions/ci-process/:id`), state-updater (page reload)** → **VAL-26634**. This feature
  *consumes* them.
- **Prepare Setup step body** → **VAL-26640**.
- **Merge step body** (merge-request stepper, fix-issues, retry, backport tables, Final Product Details)
  → **VAL-26642**. This feature only renders the **"Send changes for review / Create Merge Request"
  trigger** that hands off to the Merge step.
- **No backend / gateway contract changes** are expected, except the **Config Audit read endpoint**,
  which is *new on the web side only* (a data-access + contract test wrapping an existing gateway route).
- **MFE removal** is tracked here as a **tail story (S6)** but only executes once all 4 stage bodies exist.

## Background & Context
Legacy source: `web/apps/ci-process-mfe/src/app/ci-process/ci-process-execution/ci-process-execution-stages/build-and-test/`.
It is NgRx-driven (`getCiProcessExecution` selector). The new architecture (see migrated
**upgrade-process** at `web/libs/domains/business-process/feature/src/lib/upgrade-process/`) uses
standalone components, `input()/output()`, `computed()`, **`rxResource`** for data, `effect()` for
URL sync, **`ToastMessageService`** for errors, and a **page-reload state-updater** instead of NgRx.

The new Figma reorganises the step into collapsible panels inside the stepper's "Build & test" step:
**Build** panel → (conditional) **Technical Reseed** panel → **Test** panel → **Merge** action.

## Feature-Level Acceptance Criteria
| # | Criterion | Source | Confidence |
|---|-----------|--------|------------|
| 1 | The "Build & test" stepper step renders a **Build** panel: a "Build Environment" `environment-status-panel` (status tag + Services/Open MX.3/Connect DB/Connect Applicative/Copy/Details) **+ Open Config Editor** (flag `workspace-configuration-editor-ui`, hidden in automerge) **+ right-side icons Repush latest TPK & TPK Details**, the **"You are working on the following story" + Jira story chips**, and the **"Commits on <branch>" table**. | Figma `5651-143368`,`9769-56255` + Jira | High |
| 2 | Build-section **story chips** are sourced **without NgRx** — via component `input()` or an `rxResource` refetch (wiki note 5). | Wiki | High |
| 3 | Build-section **commits table** reuses the **same** commits table as the Branch Details tab (`domains/scm/widget` `merge-request-commits` via `branch-details`), with empty-state illustration. | Wiki note 6 + Figma | High |
| 4 | A **Technical Reseed** panel renders **between Build and Test**, only when `buildAndTestStage.technicalReseedExecutionGroupId != null`; collapsed by default (panel + each row). Rows: TR name, status (Passed/Running/Failed), Created On, short commit id, `dumpIds` (1 shown + see-more). Status click → **info icon + tooltip (NO dialog)**. "Technical Reseed" launch button → dialog (Final Product Tag, Environment Definition, Maintenance Level, Launch). | Figma `9694-108129`, wiki | High |
| 5 | The **Test** panel renders an "Environment" `environment-status-panel` **+ Config Audit** split-button (color-coded by linting status PASS/WARNING/FAIL; dropdown CSV/HTML report), **Select TPK** dropdown + **Run TPK** button, and **TPK Results** (`scenario-runs` cards) with **Show Previous Runs** and empty-state illustrations. | Figma `5657-145421`,`9769-55*` | High |
| 6 | The loading state (`!readyForBuildAndTest`) shows the **create-branch-style illustration** (from VAL-26634) instead of the legacy "please refresh" info-alert. | Wiki + Figma | Med |
| 7 | Error state shows the error alert (preserve legacy `errorMessage` behaviour). | Legacy | High |
| 8 | A **Merge / "Send changes for review"** action renders a **Create Merge Request** popup (MR name, destination branch, reviewers, **"Do you want to Backport?" Yes/No** → on-demand backport run-definition multi-select) and triggers the existing gateway endpoint. On success → page reload. | Figma `9766-53383/54658` + legacy | High |
| 9 | An **on-demand backport** informative banner is shown when applicable; the old-design step equivalent banner is removed (wiki). | Wiki | Med |
| 10 | **Every** legacy authorization/flag/state is preserved & tested: `workspace-configuration-editor-ui`, `config-audit`, `can-repush` (`mergeDevelopmentState.canRepush`), `isUserInterventionDisabled` (stage not PENDING_INPUT/RUNNING), `ScenarioExecutionGroupPermissionWarningMessage` warning map, cherry-pick running/failed alert. | Legacy code | High |
| 11 | All work mirrors validation/upgrade practices: standalone components, `input()/output()`, `rxResource`, `computed()`, `effect()`, error handling via `ToastMessageService`, page-reload state-updater (no NgRx). | Project standard | High |

## Constraints & Assumptions
- **C1** Depends on VAL-26634 having landed (shell route, data-access, model, stepper, `"skipped"`).
- **C2** Target feature lib `build-and-test-process` (per VAL-26642) under
  `web/libs/domains/business-process/feature/src/lib/build-and-test-process/`. Created by whichever
  of 26640/26641/26642 lands the scaffold first (assign scaffold ownership in story-map).
- **C3** Reuse, do not rebuild: `mxevolve-environment-status-panel`, `mxevolve-scenario-runs`,
  `branch-details`/`merge-request-commits`, `commit-id-display`, `mxevolve-illustration`,
  the existing `environment-config-audit` button + models (port to domains).
- **C4** Adding CI-only buttons to the shared `environment-status-panel` must be **backward compatible**
  (no visual/behaviour change for upgrade-process / prepare-setup consumers).
- **A1** The Build and Test "environment" bars are **standalone** `environment-status-panel` instances;
  per-TPK env panels inside `scenario-runs` cards are unchanged.

## Open Questions (summary — see decision-log.md)
- OQ1 (resolved): TR status click → **info icon + tooltip, no dialog**.
- OQ2 (resolved): Config Audit → **new endpoint under `domains/environment/data-access`** (+ unit + pact tests).
- OQ3 (resolved): Repush-latest-TPK + TPK-Details icons + Open Config Editor are **Build-section only**;
  Config Audit is **Test-section only** — accounted for in design.
- OQ4 (open): exact gateway path for the systematic config-audit read (verify against backend before pact).
- OQ5 (open): whether the new `build-and-test-process` feature lib scaffold is owned by 26641 or 26640.
