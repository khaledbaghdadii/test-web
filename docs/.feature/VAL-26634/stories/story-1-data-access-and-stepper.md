# Story 1 — CI Data-Access + Stepper `skipped` status (VAL-26634)

> Groups slices **S1 (data-access)** + **S2 (stepper status)**. Self-contained, AI-implementable.
> **Migrate to the new domains architecture only — never depend on legacy `web/libs/features/*`.**

## Goal
Provide the foundation for the CI run header/stepper migration:
1. A new **`build-and-test`** data-access folder in `domains/business-process/data-access` with the CI
   execution fetcher + models (copied/enhanced from the legacy CI MFE), with unit tests.
2. Extend the shared **`mxevolve-stepper`** with a new `"skipped"` step status (greyed checkmark,
   non-clickable, `"- Skipped"` title suffix), with unit tests.

## Out of scope
- The run header, run details, execution view (Stories 2–4).
- User-input action services (only migrate if a later stage story needs them).

## Figma & visual references
| Ref | What it shows |
|-----|---------------|
| [9615-68110](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) | Run header + stepper |
| `docs/.feature/VAL-26634/wiki-context/jira_skip_step.png` | Skipped step look: `Prepare Setup - Skipped` greyed + checkmark |

## Architecture conventions (MUST follow — upgrade-process template)
- Services: `@Injectable()`, `inject(HttpClient)`, `inject<AppConfig>(APP_CONFIG)`, return `Observable<T>`.
- Models: plain TS `interface`/`enum` in `util` or `data-access` (mirror upgrade-process placement).
- **Nx boundary:** a domains lib MUST NOT depend on `web/libs/features/*` (tagged `type:legacy`).
- Cross-domain imports via barrels only.

---

## Part A — CI data-access (`build-and-test`)

### Where
- Models → `web/libs/domains/business-process/util/src/lib/build-and-test/` (mirror where
  `UpgradeProcessExecution` lives in `util`).
- Fetcher service → `web/libs/domains/business-process/data-access/src/lib/build-and-test/`.
- Export both via the respective barrels (`util/src/index.ts`, `data-access/src/index.ts`).

### Models to create (copy + enhance from legacy)
Source: `web/libs/features/business-process/src/lib/build-and-test/*`.

```ts
// build-and-test-process-execution.ts
export interface BuildAndTestProcessExecution {
  id: string;
  name: string;
  projectId: string;
  definitionId: string;
  definitionName: string;     // Template Name (add if missing in legacy — used by Run Details)
  familyName: string;         // Activity Type left part
  processName: string;        // Activity Type right part
  owner: string;
  notificationsRecipients?: string[];
  errorMessage?: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  supportsResourceManagement: boolean;
  hasPredefinedMergeRequestInputs: boolean;
  ciVersion: number;
  source: BuildAndTestSource;
  status: ExecutionStatus;     // reuse domains ExecutionStatus (not legacy BusinessProcessExecutionStatus)
  input: BuildAndTestProcessExecutionInput;
  createBranchStage: BuildAndTestProcessStage;
  prepareBuildStage: BuildAndTestProcessStage;
  buildAndTestStage: BuildAndTestProcessStage;
  integrateChangesStage: BuildAndTestProcessStage;
}

export interface BuildAndTestProcessExecutionInput {
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  userStoryIds: string[];
  buildAndTestInfraGroup: string;        // → displayed as "Test Environment Infra Group"
  buildEnvironmentInfraGroup: string;    // → displayed as "Build Environment Infra Group"
  buildEnvironment: BuildAndTestProcessBuildEnvironmentInput;
}

export interface BuildAndTestProcessBuildEnvironmentInput {
  skipEnvironmentDeployment: boolean;    // drives the "skipped" stepper status
  scenarioDefinitionId: string;          // Build Scenario Definition
}

export interface BuildAndTestProcessStage {
  name: string;
  status: StageStatus;          // reuse domains StageStatus enum
  startDate?: string;           // shown in stepper tooltip
  endDate?: string;             // shown in stepper tooltip
  route: string;
  errorMessage?: string;
  developmentId?: string;       // present on createBranchStage when PASSED (mirror upgrade)
}

export interface BuildAndTestSource { id: string; type: BuildAndTestSourceType; }
export enum BuildAndTestSourceType { BUSINESS_PROCESS = "BUSINESS_PROCESS", USER = "USER" }
```
> **Enhancement note:** Replace legacy `BusinessProcessExecutionStatus` / `BuildAndTestProcessStageStatus`
> with the domains `ExecutionStatus` / `StageStatus` enums from `@mxevolve/domains/business-process/util`
> (the same ones upgrade-process uses). Map legacy values during the fetch if the wire format differs.

### Fetcher service (mirror `ExecutionFetcherService`)
```ts
@Injectable()
export class BuildAndTestExecutionFetcherService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  fetchExecution(projectId: string, processId: string): Observable<BuildAndTestProcessExecution> {
    return this.httpClient
      .get<BuildAndTestProcessExecution>(`${this.getApiUrl(projectId)}/${processId}`)
      .pipe(catchError((e) => throwError(() => new Error(e.error.message))));
  }

  private getApiUrl(projectId: string) {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process`;
  }
}
```
> Endpoint verified from legacy `BuildAndTestProcessExecutionFetcherService`:
> `GET {gw}projects/{projectId}/business-process/executions/ci-process/{ciProcessId}`.

### Tests (Part A)
- `BuildAndTestExecutionFetcherService` spec: builds the correct URL, maps the response, surfaces
  `error.message` on failure. Reuse fixtures from the legacy CI MFE spec as the response body.

---

## Part B — Stepper `skipped` status (shared primitive)

### Where
`web/libs/shared/ui/primitive/src/lib/stepper/` — files: `step.ts`, `stepper.component.ts`,
`stepper.component.html`, `stepper.component.spec.ts`.

### Changes
1. **`step.ts`** — extend the union:
   ```ts
   export type StepStatus = "active" | "inactive" | "completed" | "failed" | "skipped";
   ```
2. **`stepper.component.ts`**
   - `iconName()`: add `case "skipped": return "circle_dot_completed";` (greyed via CSS) **or** a
     dedicated `circle_dot_skipped` icon if one exists — check `shared/ui/primitive/.../icons` first;
     fall back to `circle_dot_inactive`-style greyed checkmark. Decide based on available icon assets.
   - `onStepClick()`: keep non-clickable. Current guard is `if (step.status !== "inactive")`. Change to
     also block skipped: `if (step.status !== "inactive" && step.status !== "skipped")`.
3. **`stepper.component.html`** (both horizontal & vertical templates)
   - The clickable/cursor + `role` bindings currently key off `step.status !== 'inactive'`. Introduce a
     helper `isClickable(step)` (= not inactive and not skipped) OR replicate the inactive condition for
     skipped on: `[class.cursor-pointer]`, `[class.cursor-default]`, `[attr.role]`, and the connector
     line colour (`bg-primary` vs `bg-surface-300`). A skipped step renders like a reached-but-muted
     step (checkmark) yet is non-interactive.
   - Title: skipped steps render with a `" - Skipped"` suffix and muted text. Append the suffix in the
     component (e.g. a `displayTitle(step)` helper) rather than in each call site, so callers just set
     `status: "skipped"` and `title: "Prepare Setup"`.

### Tests (Part B)
- `stepper.component.spec.ts`: parametrised over all 5 statuses — assert icon name, clickability
  (skipped + inactive NOT clickable; active/completed/failed clickable), and that a skipped step's
  title shows the `"- Skipped"` suffix with muted styling.
- Sanity: existing consumers (`merge-request-stepper`, upgrade-process view) still compile and their
  specs pass (they never pass `"skipped"`, so behaviour is unchanged).

## Acceptance criteria
- `build-and-test` data-access compiles, exports models + `BuildAndTestExecutionFetcherService` via
  barrels; no import of `@mxflow/features/*`.
- Fetcher hits `.../executions/ci-process/{id}` and maps to the domains `ExecutionStatus`/`StageStatus`.
- `StepStatus` includes `"skipped"`; skipped steps are greyed, show a checkmark, are non-clickable, and
  display the `"- Skipped"` suffix; existing steppers unaffected.

## Definition of Done
- Lint + Nx module boundaries pass (no domains→legacy edges).
- Unit tests green (run via the `web-unit-test-runner` skill).
