# Story 4 — CI Execution View + Stepper, MFE wiring & legacy removal (VAL-26634)

> Groups slices **S5 (execution view + stepper)** + **S6 (wire into MFE, remove legacy header)**.
> Self-contained, AI-implementable. Mirrors `UpgradeProcessExecutionViewComponent`.
> **Migrate to domains only — never depend on legacy.**
> **Depends on:** Story 1 (data-access + stepper `skipped`), Story 2 (Run Details), Story 3 (Run Header).

## Goal
Build the CI **execution view** that fetches the execution, composes the run header + run stepper
(with per-stage start/end-date tooltips and skip-step handling + the create-branch loading
illustration), then **wire it into the existing `ci-process-mfe`** and **remove the legacy header
usage**. Stage bodies stay untouched (migrated later).

## Figma & visual references
| Ref | What it shows |
|-----|---------------|
| [9615-68110](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) | Full run page: header + stepper |
| `docs/.feature/VAL-26634/wiki-context/jira_skip_step.png` | Skipped step in the stepper |

## Where
- View → `web/libs/domains/business-process/feature/src/lib/build-and-test/build-and-test-execution-view/`
  - `build-and-test-execution-view.component.ts` / `.html` / `.spec.ts`
- Export via `feature/src/index.ts`. Selector: `mxevolve-build-and-test-execution-view`.
- Template reference:
  `web/libs/domains/business-process/feature/src/lib/upgrade-process/upgrade-process-execution-view/`.

## Component shape (mirror upgrade-process view)
```ts
@Component({
  selector: "mxevolve-build-and-test-execution-view",
  providers: [BuildAndTestExecutionFetcherService],
  imports: [
    BuildAndTestRunHeaderComponent,      // Story 3
    MxevolveIllustrationComponent,       // @mxevolve/shared/ui/primitive
    StepperComponent, StepComponent,     // @mxevolve/shared/ui/primitive
    ExecutionAlertDisplayComponent,      // @mxevolve/domains/business-process/ui
    // NOTE: stage bodies are NOT migrated here — render placeholders or keep MFE stage routing.
  ],
  host: { style: "display: contents;" },
})
export class BuildAndTestExecutionViewComponent {
  readonly projectId = input.required<string>();
  readonly executionId = input.required<string>();

  private readonly fetcher = inject(BuildAndTestExecutionFetcherService);
  readonly selectedStepId = signal<string | undefined>(/* from ?step= query param */);

  readonly executionDetails = rxResource({
    params: () => ({ projectId: this.projectId(), executionId: this.executionId() }),
    stream: ({ params }) => this.fetcher.fetchExecution(params.projectId, params.executionId),
  });

  readonly loading = computed(() => this.executionDetails.isLoading());
  readonly failedInBranchCreation = computed(() =>
    this.executionDetails.value()?.createBranchStage.status === StageStatus.FAILED);
  readonly executionReadyForDisplay = computed(() =>
    this.executionDetails.value()?.createBranchStage.status !== StageStatus.NOT_STARTED);

  readonly steps = computed<StepDefinition[]>(() => { /* see below */ });
}
```

### Steps computation (4 CI stages + skip + date tooltips)
Stages (verified): `createBranchStage`, `prepareBuildStage`, `buildAndTestStage`, `integrateChangesStage`.
Titles per Figma/Jira: e.g. **Create Branch**, **Prepare Setup**, **Build & Test**, **Merge**
(confirm exact titles against node 9615-68110).

```ts
readonly steps = computed<StepDefinition[]>(() => {
  const ex = this.executionDetails.value();
  if (!ex) return [];
  return [
    this.toStep("create-branch", "Create Branch", ex.createBranchStage, false),
    this.toStep("prepare-build", "Prepare Setup", ex.prepareBuildStage,
                ex.input.buildEnvironment.skipEnvironmentDeployment),
    this.toStep("build-and-test", "Build & Test", ex.buildAndTestStage, false),
    this.toStep("merge", "Merge", ex.integrateChangesStage, false),
  ];
});

private toStep(id, title, stage, skipped): StepDefinition {
  return {
    id, title,
    status: skipped ? "skipped" : this.mapStageStatusToStepStatus(stage.status),
    tooltip: this.dateTooltip(stage),   // "Start: ...\nEnd: ..." — pattern from merge-request-stepper
  };
}
```
- **Skip-step:** when `input.buildEnvironment.skipEnvironmentDeployment === true`, the prepare-build
  step gets `status: "skipped"` → renders greyed checkmark, non-clickable, `"Prepare Setup - Skipped"`
  (suffix added by the stepper from Story 1 Part B).
- **Start/End dates:** build the tooltip from `stage.startDate` / `stage.endDate` using a `DatePipe`,
  exactly like `MergeRequestStepperComponent.computeStepTooltip` /`formatDate`
  (`web/libs/domains/scm/widget/src/lib/merge-request-stepper/merge-request-stepper.component.ts`).
  Return `undefined` for not-started/inactive steps.
- **Status mapping:** reuse the upgrade-process `mapStageStatusToStepStatus` (NOT_STARTED/STOPPED/NA →
  inactive; RUNNING/PENDING_INPUT → active; PASSED → completed; FAILED → failed). `SKIPPED` stage status,
  if it ever arrives from the backend, also maps to the new `"skipped"`.

### Loading / first-creation state
- When the process is freshly created (createBranchStage `NOT_STARTED`), show the create-branch
  illustration instead of the legacy "business process execution is currently loading..." message:
  ```html
  <mxevolve-illustration name="designing_architecture_in_metaverse" size="xxl" />
  <span class="text-3xl font-bold">Your branch is being created</span>
  <span class="text-xl font-medium">Refresh your page in a bit!</span>
  ```
  (Same markup/illustration as the upgrade-process view.)
- `?step=` query-param sync + default-step selection: copy the two `effect()`s from the upgrade view.

## S6 — Wire into MFE & remove legacy
- **Consumer file:** `web/apps/ci-process-mfe/src/app/ci-process/ci-process-execution/ci-process-execution-details/ci-process-execution-details.component.{ts,html}`.
- Replace the legacy `<mxevolve-business-process-execution-progress>` header + legacy
  `<mxflow-status-bar>` stepper usage with `<mxevolve-build-and-test-execution-view [projectId] [executionId]>`.
- **Remove** the now-unused legacy header usage/imports from the MFE. Do **not** delete the legacy
  `BusinessProcessExecutionProgressComponent` source yet if other consumers exist — but remove the CI
  MFE's reference and any now-dead imports in this MFE.
- Keep the 4 stage components + their routing untouched (stage migration is a later feature).
- Route in `web/apps/shell/.../business-process-routing.module.ts` stays as-is (MFE still routed).

## Tests
- View: `steps()` computes 4 steps; skip flag → prepare-build `"skipped"`; tooltips contain
  Start/End for started/finished stages and are absent for not-started.
- Loading: create-branch `NOT_STARTED` → illustration shown; `FAILED` → failure path; ready → header +
  stepper shown.
- `?step=` sync + default-step selection behave like the upgrade view.
- MFE: `ci-process-execution-details` renders `mxevolve-build-and-test-execution-view`; the legacy
  header component is no longer referenced (assert no dead import / template usage).

## Acceptance criteria
- CI run page renders header + stepper from the fetched execution, mirroring upgrade-process structure.
- Skip-step shows greyed `"- Skipped"`, non-clickable; per-stage Start/End dates in tooltips.
- First creation shows the create-branch illustration (legacy loading text removed).
- New view is live inside `ci-process-mfe`; old header usage removed; stages untouched.

## Definition of Done
- Lint + Nx boundaries pass (no domains→legacy edges; the MFE may still host stages).
- Unit tests green (via `web-unit-test-runner`); no dead imports of the removed legacy header.
- Visual parity confirmed against Figma 9615-68110 + `jira_skip_step.png`.
