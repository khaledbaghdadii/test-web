# Decision Log — VAL-26640: [UI/UX][CI] Prepare Setup Step

## Dependency Classification
| Dependency | Class | Notes |
|------------|-------|-------|
| `mxevolve-scenario-runs` widget | in-repo verified | `web/libs/domains/test/widget/src/lib/scenario-runs/` |
| `StageContainerComponent` | in-repo verified | `web/libs/domains/business-process/ui/` |
| `BusinessProcessContentContainerComponent` | in-repo verified | `web/libs/domains/business-process/ui/` |
| `BuildAndTestProcessExecution` (incl. `prepareBuildStage`) | in-repo verified (VAL-26634) | `web/libs/domains/business-process/data-access/build-and-test/` — owned by VAL-26634 |
| `ProcessStateUpdaterService` | in-repo verified | mirrors `UpgradeProcessStateUpdaterService` |
| `PREPARE_BUILD_ENVIRONMENT` sub-context string | in-repo verified | `CiWorkflowV2PrepareBuildEnvironmentIntegrationTest.java`; used in `build-and-test-events.http` |
| Skipped-step rendering | known from Jira/docs (VAL-26634) | Not in scope here; stepper handles it |
| Backported-BP p-message | known from Jira/docs (VAL-26634) | Header level; not in stage body |

## Decisions
| Date | Decision | Made by | Rationale |
|------|----------|---------|-----------|
| 2026-06-05 | Use `convert-binary-stage` as direct template | Developer (Khaled) + Feature Architect | Jira states: "use the same component as convert binary" |
| 2026-06-05 | Target lib folder: `build-and-test-process` | Developer (Khaled) | Aligns with VAL-26642 and domain conventions |
| 2026-06-05 | Drop `repush-` and `stop-prepare-build-environment` endpoints | Developer (Khaled) | Wiki Note 6: replaced by widget Rerun/Abort |
| 2026-06-05 | Drop stage-level error banner | Feature Architect (verified) | Convert Binary has none; shell `execution-alert-display` covers process errors |
| 2026-06-05 | Skipped rendering owned by VAL-26634 stepper | Feature Architect | Confirmed by architecture review — stage body never mounts when step is skipped |
| 2026-06-05 | `showEnvironmentLink=false`, `showHistory=true`, `showHistorySummary=true`, `showTopBarActions=false` | Feature Architect (verified) | Exact copy of Convert Binary config; wiki Q3 + Note 3 |
| 2026-06-05 | `detailsExpandedByDefault=false` | Developer (Khaled) via wiki Q6 | Panel collapsed by default per UX |

## Open Questions
All resolved. No remaining open items.
