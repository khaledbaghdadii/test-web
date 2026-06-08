# Decision Log — VAL-26634: [UI/UX][CI] Build & Test Run Page Header & Run Stepper

## Dependency Classification
| Dependency | Class | Notes |
|------------|-------|-------|
| Upgrade Process migrated pattern (`feature/.../upgrade-process`, `composite-widget/.../execution-run-header`) | in-repo verified | Reference implementation to mirror |
| Legacy CI MFE (`web/apps/ci-process-mfe`) + `BusinessProcessExecutionProgressComponent` | in-repo verified | Source of migration; legacy header to remove |
| Legacy fetcher `BuildAndTestProcessExecutionFetcherService` + DTOs (`@mxflow/features/business-process`) | in-repo verified | Copied/adapted into new data-access |
| Shared `mxevolve-stepper` (`shared/ui/primitive`) | in-repo verified | `StepDefinition.tooltip` exists; needs new `skipped` status |
| `merge-request-stepper` tooltip-date pattern | in-repo verified | Template for start/end-date tooltips |
| Reused atoms: `execution-status-tag`, `expiry-chip`, `execution-abort-button`, `branch-details`, `mxevolve-illustration` | in-repo verified | Reused as-is |
| `ExecutionFamily.USER_STORY_BUILD_AND_TEST` | in-repo verified | Already defined; no new enum needed |
| Gateway CI endpoints (`executions/ci-process/*`) | in-repo verified | No contract change |
| Functional answers (start/end dates needed, expiry rules, branch-details same, no Reference Env) | known from Jira/docs | Wiki MVF/950870852 Q&A |
| Figma node `9615-68110` | known from Jira/docs | Visual reference; not pulled (no Figma token configured this session) |
| 3 screenshots (config params, skip-step, wiki image) | user-provided | Downloaded to `wiki-context/`; reviewed by agent |
| Reference Environment (Roma, future PI) | known from Jira/docs | Out of scope for this feature |

## Decisions
| Date | Decision | Made by | Rationale |
|------|----------|---------|-----------|
| 2026-06-05 | Feature scope = run header + run stepper only; stages later; wire into existing MFE | Khaled | Incremental migration |
| 2026-06-05 | Omit Reference Environments tab for CI | Khaled / Wiki | Not needed for CI |
| 2026-06-05 | Start/End dates carried in `StepDefinition.tooltip` (no stepper date API) | Khaled + code verify | `tooltip` exists; matches merge-request-stepper |
| 2026-06-05 | Add new `"skipped"` `StepStatus` (greyed checkmark, non-clickable, "- Skipped" suffix) | Khaled + code verify | Skipped ≠ inactive; screenshot shows checkmark |
| 2026-06-05 | Renames: `buildAndTestInfraGroup` → "Test Environment Infra Group"; `buildEnvironmentInfraGroup` stays "Build Environment Infra Group" | Khaled | Wiki/UX labels |
| 2026-06-05 | New data-access folder named `build-and-test` | Khaled | Naming preference |
| 2026-06-05 | No NgRx; signals + `rxResource` | Feature Architect / code verify | Matches Upgrade Process |
| 2026-06-05 | Copy legacy DTOs/services into new data-access (no dependency on legacy lib) | Feature Architect | Self-contained domain libs; legacy deleted later |

## Open Questions
| # | Question | Impact | Status |
|---|----------|--------|--------|
| — | None blocking — all functional/technical questions resolved via wiki + code verification | — | Resolved |

> Note: Figma visuals were not pulled this session (no Figma token). The 3 wiki/Jira screenshots
> were downloaded and reviewed; if pixel-accurate spacing matters, pull Figma node 9615-68110 later.
