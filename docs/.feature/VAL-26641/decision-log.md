# Decision Log — VAL-26641: CI "Build & Test" step migration

## Dependency Classification
| Dependency | Class | Notes |
|------------|-------|-------|
| Legacy `ci-process-mfe` build-and-test stage (source of truth for behaviour) | in-repo verified | Read `build-and-test-stage.component.{ts,html}` + subfolders directly. |
| Migrated upgrade-process (reference architecture) | in-repo verified | `domains/business-process/feature/src/lib/upgrade-process/`. |
| `environment-status-panel`, `scenario-runs`, `merge-request-commits`/`branch-details`, `commit-id-display`, `illustrations`, `stepper` | in-repo verified | Confirmed paths/inputs via Explore + file reads. |
| `environment-config-audit` button + models (port source) | in-repo verified | `features/environment/.../environment-config-audit/`. |
| `technical-reseed` component + models (port source) | in-repo verified | `features/environment/.../technical-reseed/`; uses NgRx + legacy artifact-manager FinalProductService. |
| VAL-26634 shell/data-access/model/stepper/"skipped"/state-updater | known from Jira/docs | `docs/.feature/VAL-26634/`; must be merged first. |
| VAL-26640 prepare-setup, VAL-26642 merge | known from Jira/docs | Sibling features; 26642 owns merge step body. |
| Figma frames + wiki MVF 950870859 | known from Jira/docs | Exported to `figma/`, cleaned to `wiki-context/`. |
| Config Audit gateway endpoint exact path | unknown external | OQ4 — verify against backend before writing the pact. |
| Whether CI execution model already exposes story ids / audit env id | unknown external | X2 — coordinate with VAL-26634 owner; add additively if missing. |

## Decisions
| Date | Decision | Made by | Rationale |
|------|----------|---------|-----------|
| 2026-06-05 | TR status click → **info icon + tooltip, NO dialog**. | Khaled | Keep legacy lightweight behaviour. |
| 2026-06-05 | Config Audit gets a **new `domains/environment/data-access` endpoint** with unit + **pact** tests; button widget in `domains/environment/widget`. | Khaled | Correct layering; contract-test the newly web-consumed endpoint. |
| 2026-06-05 | Open Config Editor + Repush-latest-TPK + TPK-Details = **Build env bar only**; Config Audit = **Test env bar only**. | Khaled + Figma | Matches Figma; these belong to the Build environment. |
| 2026-06-05 | Extend shared `environment-status-panel` with optional `[extraActions]` slot (backward compatible). | Feature Architect | Inject CI-only buttons without breaking upgrade/prepare. |
| 2026-06-05 | Story chips via `input()`/`rxResource`, no NgRx (wiki note 5). | Wiki + standard | New-architecture rule. |
| 2026-06-05 | Commits table reuses Branch Details `merge-request-commits` (wiki note 6). | Wiki | Single source of truth. |
| 2026-06-05 | Merge **trigger** (Create MR popup + backport) in 26641; **Merge step body** in 26642. | Feature Architect | Feature boundary. |
| 2026-06-05 | MFE removal = **tail story S6**, executed only after all 4 stage bodies + siblings merged. | Khaled | Shell route can switch only when all CI bodies exist. |
| 2026-06-05 | Execution order: **26634 → [26640 ∥ 26641] → 26642 → S6 (MFE removal)**. | Khaled + Feature Architect | Foundation first; independent bodies in parallel; merge last; cleanup tail. |

## Open Questions
| # | Question | Impact | Status |
|---|----------|--------|--------|
| OQ1 | TR status click → tooltip vs dialog | UI behaviour | **Resolved: tooltip, no dialog** |
| OQ2 | Config Audit data-access location | Architecture | **Resolved: new domains/environment/data-access endpoint + pact** |
| OQ3 | Repush/TPK-Details/Config-Audit placement (Build vs Test) | Scope/UI | **Resolved: Build-only vs Test-only as above** |
| OQ4 | Exact gateway path for systematic config-audit read | Contract | **Resolved: `GET {gateway}projects/{projectId}/environments/{environmentId}/systematic-config-audit`** (matches legacy ci-process-mfe EnvironmentConfigAuditService) |
| OQ5 | Owner of the new `build-and-test-process` feature-lib scaffold (26640 or 26641) | Coordination | **Resolved: 26641 owns it; lives at `feature/.../build-and-test/`** |
| OQ6 | Does VAL-26634's `BuildAndTestProcessExecution` already expose story ids + audit env id? | Cross-feature edit X2 | **Resolved: added `readyForBuildAndTest`/`cherryPickRunning`/`cherryPickFailed`/`technicalReseedExecutionGroupId` additively to `BuildAndTestProcessStage` in util** |
