# Step 9: Build & Test definition executor (Page 2, Reactive Forms)

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 1, Step 8, Step 11
**AC:** AC-11, AC-12, AC-13, AC-14

## Summary
Migrate the Build & Test definition executor to a clean **signals + Angular Reactive Forms** component
rendered as Dialog **Page 2**. No `viewchild`/`initializeForm`. Shows the prefilled fields on expand
(Step 11) and a form of only non-prefilled fields; submits via the existing execute service.

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/build-and-test/executor/build-and-test-executor.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/build-and-test/executor/build-and-test-executor.form.ts` (new — Reactive Forms `FormGroup` factory + validators)
- `web/libs/domains/business-process/composite-widget/src/lib/build-and-test/executor/build-and-test-executor.component.spec.ts` (new)
- `web/libs/domains/business-process/composite-widget/src/index.ts` (mod — export)

## Implementation Details
- Legacy source (do not lose any field): `build-and-test-definition-executor.component.ts` +
  `ExecuteBuildAndTestProcessInputComponent`. Fields: `name` (required), `repositoryId`,
  `configurationBranchName` (branch validator), `configurationParentBranch` (branch validator),
  `skipEnvironmentDeployment` (toggle; controls visibility of next), `buildScenarioDefinitionId`
  (multi-select; only when `!skipEnvironmentDeployment`), `userStoryIds` (required; user-story input with
  the `user-story-validation-and-transition` feature flag), `buildEnvironmentInfraGroup`,
  `buildAndTestInfraGroup`, `notificationsRecipients` (optional).
- Build with **Angular Reactive Forms** (`FormGroup`/`FormControl`, `ReactiveFormsModule`) — a typed
  `FormGroup` factory with validators and computed disabled/visibility (decision 2026-06-30 / PR #11556:
  Signal Forms are still dev-preview, **not** used — change #3). Consume the **new-arch** leaf selectors
  from `@mxevolve/domains/business-process/ui` (Step 11 — `mxevolve-business-process-infra-group-selector`,
  `mxevolve-business-process-scenario-definition-selector`,
  `mxevolve-business-process-notifications-recipients-input`, `mxevolve-user-story-input`) as child form
  controls — **no legacy `libs/ui/inputs` import** (change #7). Any raw single/multi-select uses the shared
  `mxevolve-single-select-dropdown` / `mxevolve-multiselect-dropdown`.
- **Visibility**: use Step 11 `shouldShowInForm` + `InputAccessMode` to render only **non-prefilled** form
  fields; the **expand-arrow** panel shows `mxevolve-build-and-test-prefilled-inputs` (Step 11).
- **Feature flag** `user-story-validation-and-transition` preserved via `FeatureFlagResolver` for the
  user-story validation behaviour.
- **Run/Build**: submit to `BuildAndTestProcessExecutorService.executeBuildAndTestProcessDefinition(projectId,
  request)` (`POST executions/ci-process`). Use rxResource/imperative one-shot with `catchError → showError`
  (keep any special-case handling). On success, close the dialog + emit a `created` output (page refreshes).
- Horizontal scroll of inputs on Run as per design (CSS); ignore "additional settings" panel.

### Captured-design layout (2026-06-30 — `designs/jira-1901576.png`)
- Page 2 reuses the **same generic dialog** (Step 1), not a new modal. Header = **back chevron ‹** + the
  **template name** as title + **X close** (back chevron returns to Page 1 inside the same dialog).
- Directly under the title a **collapsible "{template name} Details" panel** with a chevron; expanding it
  reveals the **prefilled** fields (Step 11 `mxevolve-build-and-test-prefilled-inputs`) — this IS the
  "expand-arrow shows prefilled inputs" requirement.
- Below it, the input form shows only **non-prefilled** fields, **grouped under section headings** (e.g.
  a **"User Stories"** heading over the user-story row).
- The user-story row = a labeled **"User Story ID"** input with an **inline validity-check icon** and a blue
  **"+" add** button to add another story. The **magnifier/search icon** in the mock is **not** needed — keep
  the feature-flagged validation logic (`user-story-validation-and-transition`).
- Prefilled fields display **read-only-style** (e.g. "Run Name" = "Build - 000001", "Configuration Branch
  Name" = "Branch-000001 / VAL-123-VAL-124").
- An **"Additional settings" expander** near the bottom is **OUT OF SCOPE** (do not build).
- A **centered primary "Build" button** submits (the execute endpoint). Horizontal scroll appears when many
  inputs are shown (CSS).

## Code Shape
```typescript
@Component({ selector: "mxevolve-build-and-test-executor", standalone: true,
  imports: [ReactiveFormsModule, /* new-arch selectors, prefilled display */] })
export class BuildAndTestExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<DefinitionApiModel>();
  readonly created = output<void>();
  readonly accessMode = computed<InputAccessMode>(() => /* from definition.providedInputs */);
  readonly prefilled = computed(() => this.definition().providedInputs.filter(isPrefilled));
  // Reactive Forms FormGroup (typed); validators incl. branch + required + conditional scenario
  readonly form = buildBuildAndTestForm(/* non-prefilled inputs */);
  build() { /* this.executorService.executeBuildAndTestProcessDefinition(...).pipe(catchError(showError)) */ }
}
```

## Sub-steps
- [x] 9a. Define the Reactive Forms `FormGroup` + validators (branch validators, required, conditional scenario via skipEnvironmentDeployment).
- [x] 9b. Render non-prefilled fields only (Step 11 visibility) via the new-arch selectors + expand-arrow prefilled panel.
- [x] 9c. Wire user-story input + `user-story-validation-and-transition` flag.
- [x] 9d. Wire Build submit to the execute service (rxResource/one-shot, catchError → showError); close + emit on success.
- [x] 9e. Spec: all fields present; conditional visibility; flag behaviour; submit payload matches legacy; error toast.

## Tests
- Component spec (field presence vs legacy, validation, submit payload, error path).

## Test Obligations
- Production files: executor component + form schema.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`.

## Template
Legacy `build-and-test-definition-executor` + `ExecuteBuildAndTestProcessInputComponent` (behaviour reference); Angular **Reactive Forms** (`ReactiveFormsModule`); new-arch selectors + Step 11.

## Manual Verification
Run a Build & Test template: header shows back chevron + template name + X; the collapsible "{name} Details" panel expands to show prefilled (read-only-style) fields; the form below shows only non-prefilled fields grouped under headings (e.g. "User Stories"); the User Story ID row has a validity-check icon + blue "+" add (no magnifier); validations match legacy; a centered Build executes; errors toast.

## Risk
High — Reactive-Forms migration; must reproduce every field, validator, conditional, flag, and the submit payload exactly.
