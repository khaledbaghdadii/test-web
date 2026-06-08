# Story 3 — CI Run Header composite-widget (VAL-26634)

> Slice **S4**. Self-contained, AI-implementable. Mirrors the upgrade-process
> `ExecutionRunHeaderComponent`. **Migrate to domains only — never depend on legacy.**
> **Depends on:** Story 1 Part A (data-access), Story 2 (Run Details widget).

## Goal
Build the CI **run header** composite-widget: Run Name + Process Status + Expiry tag + Abort, with a
tab strip exposing **Run Details** and **Branch Details** (NO Reference Environment tab).

## Figma & visual references
| Ref | What it shows |
|-----|---------------|
| [9615-68110](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) | Run header layout (name, status, expiry, tabs, abort) |

## Where
- `web/libs/domains/business-process/composite-widget/src/lib/build-and-test/execution-run-header/`
  - `execution-run-header.component.ts` / `.html` / `.spec.ts`
- Export via `composite-widget/src/index.ts`.
- Selector: `mxevolve-build-and-test-run-header`.
- Template reference: upgrade-process
  `web/libs/domains/business-process/composite-widget/src/lib/upgrade-process/execution-run-header/`.

## Composition (verified selectors + imports)
| Sub-component | Selector | Import barrel | Inputs to pass |
|---------------|----------|---------------|----------------|
| Status tag | `mxevolve-execution-status-tag` | `@mxevolve/domains/business-process/ui` | `[status]="execution().status"` |
| Expiry chip | `mxevolve-expiry-chip` | `@mxevolve/domains/business-process/ui` | `[expiryDate]="execution().expiryDate"` — show unless finished |
| Abort | `mxevolve-execution-abort-button` | `@mxevolve/domains/business-process/composite-widget` | `[projectId]`, `[processId]=execution().id`, `[status]`, `[familyId]=ExecutionFamily.USER_STORY_BUILD_AND_TEST` |
| Run Details | `mxevolve-build-and-test-activity-run-details` | `@mxevolve/domains/business-process/widget` | `[execution]="execution()"` (Story 2) |
| Branch Details | `mxevolve-branch-details` | `@mxevolve/domains/business-process/composite-widget` | `[projectId]`, `[processId]`, `[branchCreation]`, `[development]`, `[commitsBehindCount]` (reused as-is) |

## Component shape (mirror upgrade-process, drop Reference Env)
```ts
export class BuildAndTestRunHeaderComponent {
  readonly execution = input.required<BuildAndTestProcessExecution>();
  readonly familyId = ExecutionFamily.USER_STORY_BUILD_AND_TEST;   // already defined in util

  // Reuse the upgrade-process pattern for branch creation + development + commits-behind:
  readonly branchCreationDetails = computed(() => /* from execution().createBranchStage */);
  // developmentResource + commitsBehindResource via DevelopmentService / CommitsService (scm/data-access)
  readonly development = computed(...);
  readonly commitsBehindCount = computed(...);

  readonly selectedTab = linkedSignal<string>(() =>
    this.branchCreationDetails()?.failed ? "branch-details" : "");

  readonly tabOptions = computed<TabOption[]>(() => {
    const tabs: TabOption[] = [];
    // NO Reference Environment tab for CI
    if (this.branchCreationDetails()) tabs.push({ label: "Branch Details", value: "branch-details" });
    tabs.push({ label: "Activity Run Details", value: "activity-run-details" });
    return tabs;
  });
}
```
> **Difference vs upgrade:** remove the `referenceEnvironmentDeployment.supported` branch and the
> `ReferenceEnvironmentsComponent` import entirely. Keep the rest of the branch/development/commits
> logic identical (reuse `DevelopmentService`, `CommitsService` from `@mxevolve/domains/scm/data-access`).
> Use a CI state-updater (`reloadProcessDetails`) — either reuse the upgrade one if generic, or add a
> CI equivalent in `build-and-test` data-access.

## Tests
- `tabOptions` yields **only** Branch Details (when branch creation exists) + Activity Run Details — never
  a Reference Environment tab.
- Status tag receives `execution().status`; expiry chip shown unless the process is finished.
- Abort button receives `familyId === USER_STORY_BUILD_AND_TEST`, correct `projectId`/`processId`/`status`.
- `selectedTab` defaults to `branch-details` when branch creation failed, else empty.
- Branch Details receives `branchCreation` + `development` + `commitsBehindCount`.

## Acceptance criteria
- Header matches the upgrade-process structure **minus** the Reference Environment tab.
- Expiry tag always shown unless process finished; abort wired with the CI family; Run Details +
  Branch Details reused.
- No legacy imports.

## Definition of Done
- Lint + Nx boundaries pass; unit tests green (via `web-unit-test-runner`).
