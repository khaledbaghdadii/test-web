# Story S1 — Prepare Build Stage Component

> Feature: VAL-26640 [UI/UX][CI] Prepare Setup Step  
> Story jira key: *(create from VAL-26640 epic, same component: ATLANTIS)*  
> Depends on: **VAL-26634** (CI shell + stepper + `build-and-test` data-access must be merged first)  
> Template story: VAL-26642 (Convert Binary migration)  
> Status: Ready for implementation

---

## Goal
Create `prepare-build-stage.component.ts/html/spec.ts` under the new **domains** architecture.
The component wraps `mxevolve-scenario-runs` with `subContextId="PREPARE_BUILD_ENVIRONMENT"` and is
slotted into the Build & Test stepper by the execution view owned by VAL-26634.

Functionally identical to what `web/apps/ci-process-mfe` does today, but using the same architecture
as the already-migrated **Convert Binary** stage in the Upgrade Process.

---

## Figma & Visual References
> **All nodes are in the `MxEvolve` file (`8Z7emdDFkZapK3nmVP2HsA`).  
> Use the query-figma skill: `python scripts/query_figma.py file nodes <url> --ids <node-id>`**

| # | Node ID | Description | URL |
|---|---------|-------------|-----|
| 1 | `5628-131855` | **Full Page** — complete Prepare Setup step layout | [Open](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=5628-131855&t=rZjkJqWIj8Gm24GO-0) |
| 2 | `5628-132285` | **The TPK Section** — scenario-runs panel in context | [Open](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=5628-132285&t=rZjkJqWIj8Gm24GO-0) |
| 3 | `5628-132399` | **Feature entry point** (user shared — starting view) | [Open](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=5628-132399&t=rZjkJqWIj8Gm24GO-0) |
| 4 | `9615-68110` | **Dev mode — stage detail** (spacing / token reference) | [Open (dev)](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) |
| 5 | `9766-55448` | **Prepare And Build Skipped** state *(owned by VAL-26634 stepper, DO NOT implement here)* | [Open (dev)](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9766-55448&m=dev) |

---

## Scope — In This Story
- Create `prepare-build-stage.component.ts` with inputs `projectId`, `processId`, `stageStatus`.
- Create `prepare-build-stage.component.html` wrapping `mxevolve-scenario-runs`.
- Create `prepare-build-stage.component.spec.ts` (shallow unit tests).
- Export from the feature lib barrel.
- Register the component in the stepper config of the build-and-test execution view (VAL-26634's file).

## Out of Scope
| Item | Owner |
|------|-------|
| CI execution view, stepper, run header | VAL-26634 |
| `BuildAndTestProcessExecution` model + `prepareBuildStage` | VAL-26634 |
| Skipped-step rendering (greyed out, non-clickable) | VAL-26634 stepper |
| Backported-BP p-message | VAL-26634 header |
| `repush-` / `stop-prepare-build-environment` endpoints | **Dropped** (replaced by widget Rerun/Abort) |
| Stage-level error banner | **Dropped** (process errors → shell's `execution-alert-display`) |
| Legacy `ci-process-mfe` deletion | S3 (future story) |

---

## Architecture Conventions

### Target path
```
web/libs/domains/business-process/feature/src/lib/
  build-and-test-process/
    prepare-build-stage/
      prepare-build-stage.component.ts
      prepare-build-stage.component.html
      prepare-build-stage.component.spec.ts
```

### Library and import rules
- The component lives in `@mxflow/domains/business-process/feature` (same barrel as convert-binary-stage).
- Import `mxevolve-scenario-runs` from `@mxevolve/domains/test/widget` — never deep-import.
- Import containers from `@mxflow/domains/business-process/ui`.
- Import the state-updater service from `@mxflow/domains/business-process/data-access`.
- Do NOT import from `@mxflow/domains/business-process/feature` within this component (same lib).

### Angular 21+ conventions
- `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`.
- All inputs via `input.required<T>()` (no `@Input()` decorator).
- `host: { style: 'display: contents;' }` on the component.
- No `ngOnInit`, no NgRx, no `takeUntil`, no `BehaviorSubject`.
- Reload via `(scenarioChanged)` → `stateUpdater.reloadProcessDetails(processId(), projectId())`.

---

## Template to Implement

### `prepare-build-stage.component.ts`

Exact pattern from `convert-binary-stage.component.ts` — only names changed:

```typescript
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ScenarioRunsComponent } from '@mxevolve/domains/test/widget';
import { StageContainerComponent } from '@mxflow/domains/business-process/ui';
import { BusinessProcessContentContainerComponent } from '@mxflow/domains/business-process/ui';
import { BuildAndTestProcessStateUpdaterService } from '@mxflow/domains/business-process/data-access';
import { StepStatus } from '@mxflow/domains/business-process/util';

@Component({
  selector: 'mxflow-prepare-build-stage',
  templateUrl: './prepare-build-stage.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents;' },
  imports: [
    ScenarioRunsComponent,
    StageContainerComponent,
    BusinessProcessContentContainerComponent,
  ],
  providers: [BuildAndTestProcessStateUpdaterService],
})
export class PrepareBuildStageComponent {
  protected readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);

  readonly projectId   = input.required<string>();
  readonly processId   = input.required<string>();
  readonly stageStatus = input.required<StepStatus>();

  protected reloadExecution(): void {
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }
}
```

> **Note on `BuildAndTestProcessStateUpdaterService`:** This service must parallel
> `UpgradeProcessStateUpdaterService`. If it does not exist yet, VAL-26634 owns creating it.
> Its `reloadProcessDetails(processId, projectId)` method triggers the CI execution fetcher to
> re-fetch `GET /executions/ci-process/:id`.

### `prepare-build-stage.component.html`

```html
<mxevolve-stage-container>
  <mxevolve-business-process-content-container header="Prepare Setup">
    <mxevolve-scenario-runs
      class="col-span-12"
      [projectId]="projectId()"
      [contextId]="processId()"
      subContextId="PREPARE_BUILD_ENVIRONMENT"
      [showEnvironmentLink]="false"
      [showHistory]="true"
      [showHistorySummary]="true"
      [showTopBarActions]="false"
      [detailsExpandedByDefault]="false"
      (scenarioChanged)="reloadExecution()"
    >
      <ng-template #topBar>Latest Scenario Run</ng-template>
    </mxevolve-scenario-runs>
  </mxevolve-business-process-content-container>
</mxevolve-stage-container>
```

> **Critical differences from Convert Binary:**
> - `subContextId="PREPARE_BUILD_ENVIRONMENT"` (not `"TECHNICAL_UPGRADE"`)
> - `[detailsExpandedByDefault]="false"` (collapsed by default — wiki Q6)
> - **No** `mxevolve-pick-reference-scenario` footer section (that is Upgrade-specific)
> - `header="Prepare Setup"` (not `"Convert Binary"`)
> - selector `mxflow-prepare-build-stage`

---

## Reference: Convert Binary (the template to copy from)

```
web/libs/domains/business-process/feature/src/lib/
  upgrade-process/
    convert-binary-stage/
      convert-binary-stage.component.ts    ← copy and rename
      convert-binary-stage.component.html  ← copy and modify (see diff above)
      convert-binary-stage.component.spec.ts ← copy and adapt tests
```

**Key verified code details:**
- `convert-binary-stage.component.ts` provides `UpgradeProcessStateUpdaterService` and calls
  `this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId())`.
- `subContextId="TECHNICAL_UPGRADE"` → change to `"PREPARE_BUILD_ENVIRONMENT"`.
- The footer (`mxevolve-pick-reference-scenario`) is Upgrade-specific — **omit it**.

---

## `subContextId` Verification

`"PREPARE_BUILD_ENVIRONMENT"` is confirmed in two places:
1. **Backend integration test:**
   `business-process-management/business-process-execution-service/src/test/java/.../CiWorkflowV2PrepareBuildEnvironmentIntegrationTest.java`
   — constant `PREPARE_BUILD_ENVIRONMENT = "PREPARE_BUILD_ENVIRONMENT"`.
2. **Dev HTTP requests:**
   `business-process-management/business-process-execution-service/src/test/resources/http/build-and-test-events.http`

---

## Data-Access / Input Sources

### `prepareBuildStage` payload (from `BuildAndTestProcessExecution`)
```json
{
  "status": "RUNNING | COMPLETED | FAILED | SKIPPED",
  "startDate": "...",
  "endDate": "...",
  "requester": "...",
  "latestScenarioExecutionId": "..."
}
```
Source: `business-process-management/business-process-execution-service/src/test/resources/data/insert_build_and_test_read_model.sql`

The component inputs `stageStatus` derives from `prepareBuildStage.status`.
The widget internally uses `latestScenarioExecutionId` for the TPK run display.

---

## Tasks

1. **Verify VAL-26634 data-access exists on target branch** — confirm `BuildAndTestProcessStateUpdaterService` and `BuildAndTestProcessExecution.prepareBuildStage` are merged/available.
2. **Create component files** at `web/libs/domains/business-process/feature/src/lib/build-and-test-process/prepare-build-stage/` (copy + modify convert-binary-stage).
3. **Export** `PrepareBuildStageComponent` from the feature barrel.
4. **Wire into stepper** — register `{ stepType: 'PREPARE_BUILD_ENVIRONMENT', component: PrepareBuildStageComponent }` in the build-and-test execution view's stepper config (VAL-26634's file).
5. **Write unit tests** (see section below).
6. **Run lint and tests** — `nx test business-process-feature --testPathPattern=prepare-build-stage`.

---

## Unit Tests

Mirror `convert-binary-stage.component.spec.ts`. Key assertions:

```typescript
describe('PrepareBuildStageComponent', () => {
  let component: PrepareBuildStageComponent;
  let fixture: ComponentFixture<PrepareBuildStageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepareBuildStageComponent],
      declarations: [],
    })
    .overrideComponent(PrepareBuildStageComponent, {
      remove: { imports: [ScenarioRunsComponent] },
      add:    { imports: [MockComponent(ScenarioRunsComponent)] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrepareBuildStageComponent);
    component = fixture.componentInstance;
    setComponentInputs(component, {
      projectId: 'proj-1',
      processId: 'proc-1',
      stageStatus: 'RUNNING',
    });
    fixture.detectChanges();
  });

  it('should pass correct inputs to ScenarioRunsComponent', () => {
    const runs = fixture.debugElement.query(By.directive(MockComponent(ScenarioRunsComponent)));
    expect(runs.componentInstance.projectId).toBe('proj-1');
    expect(runs.componentInstance.contextId).toBe('proc-1');
    expect(runs.componentInstance.subContextId).toBe('PREPARE_BUILD_ENVIRONMENT');
    expect(runs.componentInstance.showEnvironmentLink).toBe(false);
    expect(runs.componentInstance.showHistory).toBe(true);
    expect(runs.componentInstance.showHistorySummary).toBe(true);
    expect(runs.componentInstance.showTopBarActions).toBe(false);
    expect(runs.componentInstance.detailsExpandedByDefault).toBe(false);
  });

  it('should call reloadProcessDetails when scenarioChanged emits', () => {
    const stateUpdater = TestBed.inject(BuildAndTestProcessStateUpdaterService);
    jest.spyOn(stateUpdater, 'reloadProcessDetails');

    const runs = fixture.debugElement.query(By.directive(MockComponent(ScenarioRunsComponent)));
    runs.componentInstance.scenarioChanged.emit();

    expect(stateUpdater.reloadProcessDetails).toHaveBeenCalledWith('proc-1', 'proj-1');
  });
});
```

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC1 | `PrepareBuildStageComponent` exists at the target path in the domains architecture |
| AC2 | `mxevolve-scenario-runs` receives `subContextId="PREPARE_BUILD_ENVIRONMENT"` |
| AC3 | Panel is **collapsed by default** (`detailsExpandedByDefault=false`) |
| AC4 | No environment link shown (`showEnvironmentLink=false`) |
| AC5 | History + history summary shown (`showHistory=true`, `showHistorySummary=true`) |
| AC6 | Top bar actions hidden (`showTopBarActions=false`) |
| AC7 | `(scenarioChanged)` triggers the state-updater reload |
| AC8 | Component exported from the feature barrel |
| AC9 | Registered in build-and-test stepper config |
| AC10 | Unit tests pass (all input assertions + reload assertion) |
| AC11 | `nx build business-process-feature` passes with no new warnings |
| AC12 | SonarQube quality gate passes |

---

## Definition of Done
- [ ] Component created at correct path
- [ ] Barrel export added
- [ ] Stepper registration added
- [ ] Unit tests written and passing
- [ ] `nx lint` and `nx build` pass
- [ ] SonarQube gate passes
- [ ] PR reviewed (not breaking VAL-26634 integration)
