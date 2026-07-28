# VAL-27132 — Implementation Log

Carry-forward notes for the next executors pass (Steps 9/10, then 15/19). Each entry is the
memory the next batch receives; transcribe mappings **verbatim** — do not re-derive.

---

## Batch 3 — Step 11 (input util + migrated/leaf widgets) & Step 8 (Build & Test templates dialog)

### Step 8 — Build & Test "Available Templates" dialog (Page 1) — DONE
- **Done:** `BuildAndTestTemplatesDialogComponent`
  (`composite-widget/src/lib/build-and-test/templates-dialog/`, selector
  `mxevolve-build-and-test-templates-dialog`, exported from `composite-widget/src/index.ts`).
  Hosts the Step-1 `mxevolve-multi-page-dialog`. Loads definitions **once** via
  `BusinessProcessDefinitionService.getBusinessProcessDefinitions({ projectId, extendable: false,
  executable: true })` with **`rxResource`** (no raw subscribe), filters to
  `family.id === ExecutionFamily.USER_STORY_BUILD_AND_TEST`. Sub-Family dropdown is the shared
  `mxevolve-single-select-dropdown` (NOT raw `p-select`) fed by the committed shared
  `deriveSubFamilies(defs)` helper (`composite-widget/src/lib/shared/derive-sub-families.ts`) via an
  in-memory `SubFamilyOptionsDataProvider` + `MxevolveSingleSelectFrontendStateProvider`. Table is
  PrimeNG `p-table`, UI-paginated size 5. Per-row **Run** sets `selected` + `dialog.goTo("executor")`;
  the dialog `header` binds to `selected()?.name`.
- **Decisions:**
  - `sub-family-options-data-provider.ts` is **kept** (it is NOT a duplicate of `deriveSubFamilies`):
    it only adapts the already-derived options to the dropdown's `MxEvolveSingleSelectDataProvider`
    frontend-state contract. The single source of derivation remains the shared `deriveSubFamilies`.
  - Spec opens the dialog via the component's **public `open()`** API. This is intentional: `open()`
    is the parent (Step-7 landing page) entry point and the service is a **component-level** provider
    (`providers: [BusinessProcessDefinitionService]`) that must be overridden with `componentProviders`
    on a **direct** render — so a host-template/DOM-button trigger is not viable. The dropdown child
    is mocked with `MockComponent`; the multi-page-dialog shell is kept real (it projects the pages
    via `contentChildren`, so mocking it would hide all page DOM). Recorded in `open-points.md` (#5).
  - All new files use **double quotes** (repo committed style). Do NOT run `:web:spotlessApply` to
    "fix" this — see the WARNING below.
- **Page 2 is still a placeholder** (`<p>{{ name }}</p>`); Steps 9/10 replace it (open-points #4).
- **Tests:** `build-and-test-templates-dialog.component.spec.ts` — **9/9 GREEN**
  (Angular Testing Library, `screen` role/text queries, `userEvent`, mocked dropdown via
  `MockComponent` + `ngMocks.input(...)`/`selectionChange.emit(...)`, `provideNoopAnimations()`).

### ⚠️ WARNING — do NOT run `:web:spotlessApply` on this branch
Spotless is configured `ratchetFrom("origin/main")` with Prettier **defaults** (printWidth 80 +
double quotes), but the committed branch style is **printWidth 120 + double quotes**. Running
`:web:spotlessApply` reformats **40+ already-committed files across the whole branch** (re-wrapping
long lines) — massive out-of-scope churn. The repo standard enforced in committed code is:
**double quotes, printWidth 120, long single-line exports kept on one line.** Match that by hand.

### Step 11 — accessMode mapping (per-field, authored in executor templates — NOT derived)
`business-process/util` (`@mxevolve/domains/business-process/util`) provides the generic boolean only:
`shouldShowInForm(control, mode, forceShow=false)`, `isInputEmpty(value)`, `isPrefilled(input)`, and
`type InputAccessMode = "ACCESS_ALL_INPUTS" | "ACCESS_INVALID_INPUTS_ONLY" | "ACCESS_EMPTY_OPTIONAL_INPUTS"`.
Rule: `forceShow || mode===ACCESS_ALL_INPUTS || (ACCESS_INVALID_INPUTS_ONLY && control.invalid) ||
(ACCESS_EMPTY_OPTIONAL_INPUTS && isInputEmpty(control.value))`.

The **mode per field is NOT computed from `providedInputs`** (open-points #3). It is authored
statically per field/group in the legacy executor templates. Transcribed **verbatim** below from
legacy (Steps 9/10 must replicate exactly; assign the group mode to `definition-input-group` and the
same mode to each child `definition-input`):

**Build & Test** — legacy `features/business-process/.../build-and-test-process-definition-executor/input/execute-build-and-test-process-input.component.html`:
| Group | Field (form control) | inputAccessMode |
|---|---|---|
| (top-level) | Execution Name (`nameFormControl`) | ACCESS_INVALID_INPUTS_ONLY |
| Configuration Parameters | group + repository / configurationBranchName / configurationParentBranch | ACCESS_INVALID_INPUTS_ONLY |
| Build Scenario | group | ACCESS_ALL_INPUTS |
| Build Scenario | Skip env deployment (`skipEnvironmentDeployment`, radial) | ACCESS_ALL_INPUTS |
| Build Scenario | Build Scenario (`buildScenarioDefinitionId`, shown only when **not** skipped) | ACCESS_INVALID_INPUTS_ONLY |
| User Story IDs | group + `userStoryIds` (`requiredInput=false`, `shouldValidate=true`) | ACCESS_INVALID_INPUTS_ONLY |
| Infrastructure Parameters | group | ACCESS_INVALID_INPUTS_ONLY |
| Infrastructure Parameters | Build Environment Infra Group (`buildEnvironmentInfraGroup`) | ACCESS_INVALID_INPUTS_ONLY |
| Infrastructure Parameters | Build and Test Infra Group (`buildAndTestInfraGroup`) | ACCESS_INVALID_INPUTS_ONLY |
| Notifications | group + `notificationsRecipients` | ACCESS_EMPTY_OPTIONAL_INPUTS |

**Backport** (`on-demand-backport`) — legacy `features/business-process/.../backport/backport-definition-executor/input/execute-backport-process-input.component.html`:
| Group | Field (form control) | inputAccessMode |
|---|---|---|
| (top-level) | Execution Name (`nameFormControl`) | ACCESS_INVALID_INPUTS_ONLY |
| (top-level) | Pull Request Id (`pullRequestIdFormControl`) | ACCESS_INVALID_INPUTS_ONLY |
| User Story IDs | group + `userStoryIds` — **`forceShow=true`** (`requiredInput=true`, `shouldValidate=false`) | ACCESS_INVALID_INPUTS_ONLY |
| (top-level row) | Merge Request Title (`pullRequestTitleFormControl`) | ACCESS_INVALID_INPUTS_ONLY |
| (top-level row) | Reviewers (`pullRequestReviewersFormControl`) | ACCESS_INVALID_INPUTS_ONLY |
| Notifications | group + `notificationsRecipients` | ACCESS_EMPTY_OPTIONAL_INPUTS |

### Step 11 — reused new-arch widgets (consume directly in Steps 9/10)
- **scm/widget** — `ReviewersAutoCompleteComponent`, selector **`mxevolve-autocomplete-reviewers`**,
  import `@mxevolve/domains/scm/widget`. Inputs: `[projectId]`, `[reviewersFormControl]`. Use for the
  Backport **Reviewers** field (replaces legacy `mxevolve-autocomplete-reviewers`).
- **test/widget** — `ScenarioDefinitionDropdownComponent`, selector
  **`mxevolve-scenario-definition-dropdown`**, import `@mxevolve/domains/test/widget`. Use for the
  Build & Test **Build Scenario** field (replaces legacy
  `mxevolve-business-process-scenario-definition-selector`). Confirm its control inputs against the
  component before wiring.

### Step 11 — fresh leaf selectors (self-fetching widgets) — `@mxevolve/domains/business-process/widget`
Under `business-process/widget/src/lib/inputs/`:
| Component | selector |
|---|---|
| `InfraGroupSelectorComponent` | `mxevolve-business-process-infra-group-selector` |
| `GroupDropdownSelectionComponent` | `mxevolve-group-dropdown-selection` |
| `NotificationsRecipientsInputComponent` | `mxevolve-notifications-recipients-input` |
| `ProjectUsersMultiselectComponent` | `mxevolve-project-users-multiselect` |
| `UserStoryInputComponent` | `mxevolve-user-story-input` |

### Step 11 — prefilled-display components — `@mxevolve/domains/business-process/widget`
Under `business-process/widget/src/lib/inputs/prefilled-inputs/` (shown on the executor expand panel,
read-only; replace the legacy generic input-view-resolver):
| Component | selector |
|---|---|
| `PrefilledInputsComponent` (generic shell) | `mxevolve-prefilled-inputs` |
| `BuildAndTestPrefilledInputsComponent` | `mxevolve-build-and-test-prefilled-inputs` |
| `BackportPrefilledInputsComponent` | `mxevolve-backport-prefilled-inputs` |
Row type `PrefilledInputRow` is exported from the same barrel.

### Gotchas for Steps 9/10
- The dialog selects BT vs Backport by `selected().sourceDefinitionId === "on-demand-backport"`.
- `type:widget` leaf selectors inject their own `data-access` services (decision VAL-27132) — pass
  only `projectId` + the relevant form control; do not fetch in the executor.
- Dropdowns: use the shared `mxevolve-single-select-dropdown` / the new-arch widget selectors above —
  **never** raw PrimeNG `p-select` for these fields.
- `rxResource` resolves asynchronously even with `of(...)`; in specs `waitFor()` before asserting
  loaded UI, and keep the dialog rendering its own loading state (don't `@if` async state inside the
  PrimeNG dialog).


---

## Batch 3b — Step 9 (Build & Test executor) & Step 10 (Backport executor) — DONE

Page-2 reactive-forms executors, projected into the Step-8 templates dialog. Both pass GREEN.

### Files (all `composite-widget`, double-quote / printWidth 120, hand-formatted)
- `build-and-test/executor/build-and-test-executor.{component.ts,component.html,component.scss,form.ts,component.spec.ts}`
- `backport/executor/backport-executor.{component.ts,component.html,component.scss,form.ts,component.spec.ts}`
- `shared/noop-value-accessor.directive.ts` (**new shared infra — reuse in Steps 15/19**, see gotcha below)
- Modified `build-and-test/templates-dialog/*` (Page-2 placeholder → executors; added `created` output +
  `onExecutorCreated()`; selects Backport by `selected().sourceDefinitionId === "on-demand-backport"`).
- Exported both executors from `composite-widget/src/index.ts`.

### Reused widgets wired (exact imports)
- `@mxevolve/domains/business-process/widget`: `BuildAndTestPrefilledInputsComponent`
  (`[providedInputs]`), `BackportPrefilledInputsComponent` (`[providedInputs]`), `InfraGroupSelectorComponent`
  (`mxevolve-business-process-infra-group-selector`, inputs `[projectId] [infraGroupFormControl]
  infraGroupFormControlName`), `UserStoryInputComponent` (CVA, `[projectId] [shouldValidate] [formControl]`),
  `NotificationsRecipientsInputComponent` (see noop gotcha).
- `@mxevolve/domains/test/widget`: `ScenarioDefinitionDropdownComponent`
  (`mxevolve-scenario-definition-dropdown`, **CVA** → `[projectId] [formControl]`).
- `@mxevolve/domains/scm/widget`: `ReviewersAutoCompleteComponent` (`mxevolve-autocomplete-reviewers`,
  inputs `[projectId] [reviewersFormControl]`; holds `Reviewer[]` from `@mxevolve/domains/scm/data-access`).
- `@mxevolve/domains/business-process/util`: `shouldShowInForm` for once-at-init visibility.
- Validators: `WhitespaceValidators.notBlank()` from `@mxevolve/shared/ui/form`; the branch
  valid-characters validator is **replicated inline** in `build-and-test-executor.form.ts`
  (`branchNameValidCharacters()`, regex copied verbatim from legacy `BranchNameValidators`) to avoid a
  legacy `libs/ui/inputs` import (change #7).

### ⚠️ GOTCHA for Steps 15/19 — notifications widget + `NoopValueAccessorDirective` (open-point #7)
`mxevolve-notifications-recipients-input` exposes a **`formControl` INPUT** (NOT a `ControlValueAccessor`).
Binding `[formControl]` to it activates Angular's `FormControlDirective`, which **throws `NG01203`** in
Angular 21 (proven empirically — the legacy identical pattern is broken on this Angular). Fix: attach the
new `mxevolveNoopValueAccessor` directive (`composite-widget/.../shared/noop-value-accessor.directive.ts`)
to that element — it provides a no-op `NG_VALUE_ACCESSOR` so `FormControlDirective` is satisfied while the
widget keeps driving the bound control (its `setValue` still flows back; verified). **Steps 15/19 MUST do the
same** for any notifications-recipients usage. (Infra-group + reviewers widgets avoid this by naming their
inputs `infraGroupFormControl` / `reviewersFormControl`.) Import `ReactiveFormsModule` as a whole — the
individual reactive directives are NOT standalone, so you cannot cherry-pick out `FormControlDirective`.

### Form-from-required-input pattern (reuse in 15/19)
`input.required()` is unreadable in the constructor/field-initializers. Build the FormGroup in a
`computed(() => buildXForm(this.definition().providedInputs))` — it memoises (definition is stable per
instance because the dialog recreates the executor via `@if (selected())`). Derive once-at-init field
visibility from `form()` in another `computed`. For the BT skip→scenario validator toggle, wire a single
`takeUntilDestroyed` subscription inside a guarded `effect(() => …)` that reads `this.form()` (effects run
after inputs are set). Submit = one-shot `service.execute(...).pipe(catchError → toast.showError(err.message)
→ EMPTY, takeUntilDestroyed).subscribe(() => { executing=false; created.emit(); })`. No router nav (close +
emit only). Visibility is evaluated ONCE at init (matches legacy `DefinitionInputComponent.shouldShow` =
ngOnInit boolean, NOT a live getter).

### Submit payloads reproduced (verbatim vs legacy)
**Build & Test** → `executeBuildAndTestProcessDefinition(projectId, req)` (POST `executions/ci-process`):
`{ definitionId: definition.id, name, repositoryId, configurationBranchName, configurationParentBranch,
userStoryIds, buildEnvironmentInfraGroup, buildAndTestInfraGroup, skipPrepareBuildEnvironment(=skip toggle),
buildEnvironmentScenarioDefinitionId(=buildScenarioDefinitionId), notificationsRecipients }`.
repository/branches/scenario/infra-groups are **prefilled seeds** from `providedInputs`; name + userStoryIds
user-entered; scenario validator cleared when skip=on.
**Backport** → `executeBackportProcessDefinition(projectId, req)` (POST `executions/ci-process/backport`):
`{ name, definitionId: definition.id, repositoryId(prefilled), destinationMergeConfigurationId(prefilled
=mergeConfigurationId), pullRequestToBeBackported(=pullRequestId), pullRequestTitle,
pullRequestReviewers(=reviewers.map(r => r.name)), userStoryIds, buildAndTestInfraGroup(prefilled),
notificationsRecipients }`. Migrated data-access request types matched exactly (no field changes).

### accessMode read from legacy directly
None re-derived — used the per-field table from the Step-11 log verbatim. The three backport prefilled IDs
(`repositoryId`, `mergeConfigurationId`, `buildAndTestInfraGroup`) and BT prefilled IDs come from
`definition.providedInputs`; legacy backport `getInputValue` **threw** on a missing prefilled value — the new
executor returns `""` instead (always present for real definitions; recorded as open-point #8).

### Tests — GREEN
- `build-and-test-executor.component.spec.ts` — **7/7** (field+heading presence, prefilled hidden→details
  panel, skip hides scenario, user-story `shouldValidate=true` wiring, exact submit payload, disabled-until-
  valid, error toast).
- `backport-executor.component.spec.ts` — **6/6** (all fields, prefilled panel, user-story
  `shouldValidate=false`, exact submit payload, disabled-until-valid, error toast).
- `build-and-test-templates-dialog.component.spec.ts` — **9/9** (updated: mock both executors in MOCK_IMPORTS).
- Angular Testing Library + `screen`/`userEvent` + `MockComponent`/`ngMocks.find`+`ngMocks.input`,
  `provideNoopAnimations()`. NO data-testid / NO_ERRORS_SCHEMA. Mocked-CVA children driven via
  `__simulateChange`; reviewers/infra controls set via `ngMocks.input(find(...), "xFormControl").setValue(...)`.

### Contract tests
None authored (open-point #1 unchanged) — re-confirmed the two executor services have no legacy pacts.


---

## Batch 4a — Step 12 (Validation data-access split), Step 13 (Validation landing page + nav tab), Step 14 (Validation templates dialog Page 1) — DONE

Mirrors committed BT Steps 5/6/8. Commits: Step 12 `f849e61761b`, Step 14 `952145de749`,
Step 13 `1e21f2ac44d` (Step 14 committed before 13 so the feature commit compiles — 13 imports the
dialog from composite-widget).

### Validation family + statuses
- Family id = `ExecutionFamily.VALIDATION_PROCESS` = **`"master-validation"`**.
- Active = `[RUNNING, PENDING_INPUT, ABORTING]` (`VAL_ACTIVE_STATUSES`); History = complement
  (`VAL_HISTORY_STATUSES = Object.values(ExecutionStatus).filter(!active)`), identical split to BT.

### Step 12 — `feature/.../validation-process/activity/validation-activity.queries.ts`
- **Reused the existing migrated `ValidationProcessListingService` UNCHANGED** (no endpoint copy, no
  service edit) → `getValidationProcessExecutions(projectId, ValidationProcessExecutionsQueryRequest)`
  hitting `executions/master-validation`. Response is `{ executions, total, last }` (NOT
  `{ content, totalElements }`), so `toActivityRunsPage` maps `{ rows: executions, total }`.
- `toValidationQuery(req, definitions)` preserves EVERY legacy validation param: `namePhrase`,
  `statuses`, `officiality`, `businessProcessQualityLevel`, `ownerPhrase`, `definitionIds`, `hidden=false`,
  `sort`, and the three split date ranges (`startDateRangeStart/End`, `endDateRange*`, `expiryDateRange*`).
- **Status column filter is functional** (intentional improvement over the BT mirror, which left
  `filters.statuses` unread): `resolveStatuses` intersects the picked statuses with the table's status set
  so the Active table never leaks history runs; empty intersection falls back to the table set.
- **Owner**: `filters.ownerPhrase` (Owner column text filter) takes precedence over `req.ownerPhrase`
  (My Builds). Owner column is hidden when My Builds is on (so the two never both apply).
- **Process Name → definitionIds**: backend has NO process-name param. `resolveValidationDefinitionIds`
  faithfully replicates the legacy `BusinessProcessDefinitionFilterResolverService` (only ids → ids;
  only names → ids carrying them; both → intersection; empty intersection → `["noMatch"]` sentinel).
- Spec is a plain unit spec (no HTTP) — 16/16 GREEN.

### Step 13 — `feature/.../validation-process/activity/validation-activity.{component,cells,routes}.ts`
- Container mirrors `AllRunsActivityComponent`. Providers: `ValidationProcessListingService` +
  `BusinessProcessDefinitionService` (component-level). Loads validation definitions ONCE via
  `getBusinessProcessDefinitions({ projectId })` (no extendable/executable — ALL defs, matching the
  legacy parent) filtered to the validation family, to feed the **Business Process Definition**
  (`definitionIds`) + **Process Name** (`processNames`) multiselect options.
- **Column/filter parity vs the legacy validation table (HARD requirement) — full, in legacy order:**
  | # | colId | header | filter (filterKey/type) | sortable |
  |---|-------|--------|--------------------------|----------|
  | 1 | name | Execution Name | namePhrase / text | no (link cell → `validation-activity/execution/{id}`) |
  | 2 | status | Status | statuses / multiselect (8 legacy statuses) | no (status-tag cell) |
  | 3 | officiality | Official Status | officiality / multiselect (OFFICIAL/UNOFFICIAL/NA) | no |
  | 4 | businessProcessQualityLevel | BP Quality Level | businessProcessQualityLevel / multiselect (DQG/MQG/NA) | no |
  | 5 | owner | Owner | ownerPhrase / text (hidden when My Builds) | no |
  | 6 | startDate | Start Date | startDateRange / dateRange | yes |
  | 7 | endDate | End Date | endDateRange / dateRange | no |
  | 8 | expiryDate | Expiry Date | expiryDateRange / dateRange | yes |
  | 9 | daysExtended | Days Extended | — | yes |
  | 10 | definitionName | Business Process Definition | definitionIds / multiselect (data-derived) | no |
  | 11 | processName | Process Name | processNames / multiselect (data-derived) | no |
  - colIds `startDate`/`expiryDate`/`daysExtended` are the backend sort fields (widget emits
    `${colId},${dir}`), matching legacy `sortByStartDate`/`sortByExpiryDate`/`sortByDaysExtended`.
  - **No free-text Search box** (column filters only). My Builds toggle stays (`mxevolve-my-builds-toggle`).
  - **Sticky Actions on BOTH tables** via `RunActionsCellComponent`; History passes
    `{ terminal: true }` (abort disabled, repush kept). Active 5 rows/page, History 10.
- **Reused widgets (NOT rebuilt):** `ActivityRunsTableComponent`, `ActivityRunsHeaderFilterComponent`,
  `MyBuildsToggleComponent` (`business-process/widget`); `RunActionsCellComponent`,
  `ValidationTemplatesDialogComponent` (`business-process/composite-widget`); `ExecutionStatusTagComponent`
  (`business-process/ui`). New cells: `ValidationRunNameCellComponent`, `ValidationRunStatusCellComponent`.
- **Build button** opens the Step-14 dialog via `viewChild.required(ValidationTemplatesDialogComponent)` →
  `open()` (the BT activity left its Build empty; validation wires it).
- **Nav tab** "Validation Activity" inserted in `app-layout.component.ts` **directly after "Build & Test
  Activity", before "Business Process"** (block reads Build & Test → Validation → Business Process),
  auth `attributes.familyId = "master-validation"`. Lazy route `validation-activity` registered in
  `app-layout-routing.module.ts` → `VALIDATION_ACTIVITY_ROUTES` (landing at "" + `execution/:executionId`
  → `ValidationProcessExecutionViewComponent` with `executionExistsGuard`, exported from feature index).
- Specs: component 10/10, routes 4/4 — GREEN (ATL `screen`/`userEvent`, `MockComponent` for the table /
  toggle / dialog, `jest.spyOn(dialog, "open")` for the Build click, `provideNoopAnimations()`).

### Step 14 — `composite-widget/.../validation-process/templates-dialog/validation-templates-dialog.component.ts`
- Exact mirror of `BuildAndTestTemplatesDialogComponent` with family `master-validation`. **Reuses the
  shared `deriveSubFamilies` helper** and **reuses BT's `SubFamilyOptionsDataProvider`** via a cross-folder
  relative import (`../../build-and-test/templates-dialog/sub-family-options-data-provider`) — not
  duplicated (open-point added). Title "Validation Available Templates"; Sub-Activity = shared
  `mxevolve-single-select-dropdown` defaulting to "All"; UI pagination size 5; Run → `goTo("executor")`;
  header binds `selected()?.name`. **Page 2 (`executor`) is a placeholder `<p>{{ name }}</p>`** — Step 15
  replaces it. Exported from `composite-widget/src/index.ts`. Spec 8/8 GREEN.

### What Step 15 (Validation executor, Page 2) needs
- Replace the dialog's `executor` placeholder with the validation Reactive-Forms executor, projected into
  the SAME multi-page dialog (header already binds the selected name). Pick the executor by validation
  `sourceDefinitionId`/family as needed.
- Apply the **`mxevolveNoopValueAccessor`** workaround (gotcha #7) for any
  `mxevolve-notifications-recipients-input` usage; reuse the leaf selectors in `business-process/widget`
  and the form-from-`providedInputs` `computed(buildXForm(...))` pattern from Steps 9/10.

### Contract tests
None authored. Step 12 reused `ValidationProcessListingService` **unchanged** (no endpoint copied/added),
so per the contract-test rule there is no new pact obligation; re-confirmed no legacy pact references
`executions/master-validation` for this listing.

### Hygiene
Did NOT run `:web:spotlessApply` (open-point #6). All new web files hand-formatted to double quotes /
printWidth 120. `eslint` on the new files is clean (fixed one `jest/no-done-callback` in the Step-12 spec
by switching to `firstValueFrom`/async — that fix rode in the Step-13 commit since Step 12 was already
committed and amending is disallowed).


---

## Batch 4b — Step 15 (Validation executor, Page 2 + flag-gated scope-commit + prefilled display) — DONE

Page-2 reactive-forms validation executor, projected into the Step-14 dialog. All specs GREEN.

### Files (kept from the errored partial run + new)
- **Kept verbatim from the partial run** (verified faithful vs legacy, all additive):
  - `business-process/data-access/.../validation-process/executor/validation-process-executor.service.{ts,spec.ts}`
    + `execute-validation-process-request.ts` + `execute-validation-process-response.ts` — migration of legacy
    `ValidationProcessExecutorService` (POST `executions/master-validation/execute`); `toErrorMessage` matches
    legacy `handleError`. Spec 2/2.
  - `business-process/data-access/src/index.ts` — exports `ValidationProcessExecutorService` +
    `ExecuteValidationProcessRequest`/`Response` types.
  - `scm/data-access/.../development/development.{model,service}.ts` + `scm/data-access/src/index.ts` — ADDED
    `Developments`/`DevelopmentFilters` types + `DevelopmentService.getDevelopments(projectId, filters)` (GET
    `scm-management/projects/{id}/developments?repositoryId=&name=`), migrated verbatim from legacy
    `ScmManagementService.getDevelopments`. **Purely additive** — the existing `getDevelopment` (singular) +
    its pact (`web-scm-management-service.pact.spec.ts`) are UNTOUCHED and still match.
- **New (this pass):**
  - `business-process/util/.../definition-inputs/validation-scope-visibility.{ts,spec.ts}` — pure
    `isValidationScopeStartCommitVisible(input, archivalFlagEnabled)` + matrix spec 10/10. Exported from util index.
  - `business-process/widget/.../prefilled-inputs/validation-prefilled-inputs.component.{ts,spec.ts}` +
    `VALIDATION_PREFILLED_LABELS` added to `prefilled-inputs.types.ts`. Spec 5/5. Exported from widget index
    (single-quote style to match the widget lib).
  - `business-process/composite-widget/.../validation-process/executor/validation-executor.{component.ts,html,scss,form.ts,component.spec.ts}`.
    Spec 12/12. Exported from composite-widget index.
  - Wired into `validation-templates-dialog.component.{ts,html}` (placeholder `executor` page → real executor;
    added `created` output + `onExecutorCreated()` close+emit). Dialog spec updated (mock executor) 8/8.

### Scope-commit visibility rule (migrated VERBATIM from `ValidationScopeStartCommitIdStateResolverService.isVisible`)
Show `validationScopeStartCommitId` ONLY if ALL hold:
1. flag `jira-user-story-archival` enabled (via `FeatureFlagResolver.isFeatureEnabled(projectId, flag)` from
   `@mxflow/feature-flags`), AND
2. `official === true` (strict), AND
3. `businessProcessQualityLevel === "MQG"`, AND
4. `resolvedParentBranch !== null`, AND
5. if `createBranch === true` → `!!parentBranchName`; else → `!!archivalBranchName`.
`resolvedParentBranch` is resolved exactly like the legacy parent-branch resolver: `combineLatest` of
createBranch/parentBranchName/archivalBranchName/repositoryId valueChanges → `switchMap`: createBranch true →
`parentBranchName ?? null`; else if no repository or no archival → null; else
`DevelopmentService.getDevelopments(projectId, {repositoryId, name: archivalBranchName})` → `content[0]?.source ?? null`
(`catchError → null`). When hidden: `clearValidators()` + `reset(null,{emitEvent:false})`; when visible:
`setValidators([required])` — mirrors legacy `updateCommitIdValidators`. Implemented as a pure util + computed
signal combining `scopeSnapshot()` (form values) + `resolvedParentBranch()` + `archivalFlag()`, with one effect
applying the validators.

### Submit payload (verbatim vs legacy `getExecuteValidationProcessRequest`)
`ValidationProcessExecutorService.executeValidationProcessDefinition(projectId, req)` →
`{ name, definitionId, official, notificationsRecipients,
configurationParameters: { repositoryId, businessProcessQualityLevel, createBranch, parentBranchName,
archivalBranchName, configCommitId, rtpCommitId, finalProductId },
testParameters: { qualityGateScenarioDefinitionIds, nightlyRepusherEnabled },
infrastructureParameters: { qualityGateInfraGroupId },
validationScopeParameters: { startCommitId } }`. `startCommitId` is null when the scope field is hidden.
`catchError → toast.showError(err.message) → EMPTY`; on success `created.emit()` (no router nav). Control keys
match the legacy form; `createBranch` seeded via legacy `mapCreateBranchToBoolean` ("true"/"false"/bool → bool, else null).

### accessMode per field (from legacy `execute-validation-process-input.component.html`, verbatim)
ALL fields `ACCESS_INVALID_INPUTS_ONLY` **except** notifications = `ACCESS_EMPTY_OPTIONAL_INPUTS` and the
conditional scope-commit group = `ACCESS_ALL_INPUTS` (but additionally gated by the visibility rule above).
Prefilled (valid) fields hide from the form → shown read-only in the "{name} Details" panel via
`mxevolve-validation-prefilled-inputs`. Optional `parentBranchName` (no validators) is never editable → details-only.

### Reused widgets / noop accessor
- `business-process/widget`: `ValidationPrefilledInputsComponent`, `InfraGroupSelectorComponent`
  (`[infraGroupFormControl] infraGroupFormControlName`), `NotificationsRecipientsInputComponent`.
- **Reused noop gotcha #7:** `mxevolveNoopValueAccessor` on `mxevolve-notifications-recipients-input`
  (`[formControl]` input) to avoid NG01203.
- Config/test/scope-commit fields rendered as plain `pInputText`/radio fallbacks (always prefilled for real
  defs; see open-points #13/#14/#15). No legacy `libs/ui/inputs` import.

### Contract tests
None authored. Verified no legacy pact exists for `POST executions/master-validation/execute` (legacy executor
service has a unit spec only) nor for the `GET …/developments` LIST endpoint (`features/scm` has zero pacts; the
new-arch scm pact covers only `getDevelopment` singular, unaffected). Recorded as open-point #16.

### For Step 19 (Upgrade executor) to reuse
- The form-from-`providedInputs` `computed(buildXForm(...))` + once-at-init `shouldShowInForm` visibility pattern.
- The flag-gated conditional-field pattern: pure util in `business-process/util` + `FeatureFlagResolver` +
  computed signal + validator-toggle effect (clear+reset on hide, required on show).
- `DevelopmentService.getDevelopments` (scm/data-access) for any branch/source resolution.
- The `mxevolveNoopValueAccessor` workaround for notifications-recipients.

### Hygiene
Did NOT run `:web:spotlessApply`. New composite-widget/util files hand-formatted to double quotes / printWidth
120; new widget files to single quotes (matching the widget lib). `eslint` clean on all new/changed files
(incl. module boundaries: composite-widget → `@mxflow/feature-flags` + `@mxevolve/domains/scm/data-access`).


---

## Batch 5a — Step 16 (Upgrade data-access split), Step 17 (Upgrade landing page + nav tab), Step 18 (Upgrade templates dialog Page 1) — DONE

Mirrors committed Validation Steps 12/13/14. Commits: Step 16 `d555454d569`, Step 18 `dd00a98c095`,
Step 17 `4d82e1d8bda` (Step 18 committed before 17 so the feature commit compiles — 17 imports the
dialog from composite-widget).

### Upgrade family + statuses
- Family id = `ExecutionFamily.UPGRADE_PROCESS` = **`"binary-upgrade"`**.
- Active = `[RUNNING, PENDING_INPUT, ABORTING]` (`UPG_ACTIVE_STATUSES`); History = complement
  (`UPG_HISTORY_STATUSES`), identical split to BT/Validation.

### Step 16 — `feature/.../upgrade-process/activity/upgrade-activity.queries.ts`
- **Reused the existing migrated `UpgradeProcessListingService` UNCHANGED** (no endpoint copy, no
  service edit) → `getBinaryUpgradeExecutions(projectId, BinaryUpgradeExecutionsQueryRequest)` hitting
  `executions/binary-upgrade`. Response is `{ content, totalElements }` (NOT `{ executions, total, last }`),
  so `toActivityRunsPage` maps `{ rows: result.content, total: result.totalElements }`.
- `toUpgradeQuery(req, definitions)` preserves EVERY legacy upgrade param (verbatim from the legacy
  `BinaryUpgradeExecutionsTableComponent.mapToDomain`): `namePhrase`, `statuses`, `officiality`,
  `businessProcessQualityLevel`, `parentMxArchivalBranchPhrase`, `mxVersionPhrase`, `mxBuildIdPhrase`,
  `configurationBranchNamePhrase`, `ownerPhrase`, `definitionIds`, `hidden=false`, `sort`, and the three
  split date ranges (`startDateRangeStart/End`, `endDateRange*`, `expiryDateRange*`).
- Same functional Status filter (`resolveStatuses` intersect) + owner precedence (column filter over My
  Builds) + Process Name→definitionIds resolver (`resolveUpgradeDefinitionIds`, faithful to legacy
  `BusinessProcessDefinitionFilterResolverService`, `noMatch` sentinel) as the Validation mapper.
- Spec is a plain unit spec (no HTTP) — 16/16 GREEN.

### Step 17 — `feature/.../upgrade-process/activity/upgrade-activity.{component,cells,routes}.ts`
- Container mirrors `ValidationActivityComponent`. Providers: `UpgradeProcessListingService` +
  `BusinessProcessDefinitionService` (component-level). Loads upgrade definitions ONCE via
  `getBusinessProcessDefinitions({ projectId })` filtered to the upgrade family, feeding the Business
  Process Definition (`definitionIds`) + Process Name (`processNames`) multiselect options.
- **Column/filter parity vs the legacy `binary-upgrade-executions` table (HARD requirement) — full,
  in legacy order:**
  | # | colId | header | filter (filterKey/type) | sortable |
  |---|-------|--------|--------------------------|----------|
  | 1 | name | Execution Name | namePhrase / text | no (link cell → `upgrade-activity/execution/{id}`) |
  | 2 | status | Status | statuses / multiselect (8 statuses) | no (status-tag cell) |
  | 3 | officiality | Official Status | officiality / multiselect (OFFICIAL/UNOFFICIAL/NA) | no |
  | 4 | businessProcessQualityLevel | BP Quality Level | businessProcessQualityLevel / multiselect (DQG/MQG/NA) | no (field `input.businessProcessQualityLevel`) |
  | 5 | parentMxArchivalBranch | Parent MX Archival Branch | parentMxArchivalBranchPhrase / text | no (field `input.parentMxArchivalBranch`) |
  | 6 | mxVersion | MX Version | mxVersionPhrase / text | no (field `input.mxVersion`) |
  | 7 | mxBuildId | MX Build ID | mxBuildIdPhrase / text | no (field `input.mxBuildId`) |
  | 8 | configurationBranchName | Configuration Branch Name | configurationBranchNamePhrase / text | no (field `input.configurationBranchName`) |
  | 9 | owner | Owner | ownerPhrase / text (hidden when My Builds) | no |
  | 10 | startDate | Start Date | startDateRange / dateRange | yes |
  | 11 | endDate | End Date | endDateRange / dateRange | no |
  | 12 | expiryDate | Expiry Date | expiryDateRange / dateRange | yes |
  | 13 | daysExtended | Days Extended | — | yes (valueFormatter "N Day(s)"/"-", legacy `daysCount`) |
  | 14 | duration | Duration | — | no (valueGetter "{h}h {m}m {s}s", legacy `DurationFormatterPipe` reproduced inline) |
  | 15 | definitionName | Business Process Definition | definitionIds / multiselect (data-derived) | no |
  | 16 | processName | Process Name | processNames / multiselect (data-derived) | no |
  - colIds `startDate`/`expiryDate`/`daysExtended` are the backend sort fields (widget emits
    `${colId},${dir}`), matching legacy `resolveSortParameters` (`startDate`/`expiryDate`/`daysExtended`).
  - **No free-text Search box** (column filters only). My Builds toggle stays (`mxevolve-my-builds-toggle`).
  - **Sticky Actions on BOTH tables** via `RunActionsCellComponent`; History passes `{ terminal: true }`
    (abort disabled, repush kept). Active 5 rows/page, History 10.
  - The 5 nested `input.*` columns (BP Quality Level, Parent MX Archival Branch, MX Version, MX Build ID,
    Configuration Branch Name) use ag-grid dot-path `field` and render plain text (new design language;
    same visual deviation as Validation open-point #9). Days Extended + Duration reproduce the legacy
    pipes inline (no legacy `@mxflow/pipe` import) — faithful format, not a behaviour change.
- **Reused widgets (NOT rebuilt):** `ActivityRunsTableComponent`, `ActivityRunsHeaderFilterComponent`,
  `MyBuildsToggleComponent` (`business-process/widget`); `RunActionsCellComponent`,
  `UpgradeTemplatesDialogComponent` (`business-process/composite-widget`); `ExecutionStatusTagComponent`
  (`business-process/ui`). New cells: `UpgradeRunNameCellComponent`, `UpgradeRunStatusCellComponent`.
- **Build button** opens the Step-18 dialog via `viewChild.required(UpgradeTemplatesDialogComponent)` → `open()`.
- **Nav tab** "Upgrade Activity" inserted in `app-layout.component.ts` **directly after "Validation
  Activity", before "Business Process"** (the three activity tabs now read Build & Test → Validation →
  Upgrade), auth `attributes.familyId = "binary-upgrade"`. Lazy route `upgrade-activity` registered in
  `app-layout-routing.module.ts` → `UPGRADE_ACTIVITY_ROUTES` (landing at "" + `execution/:executionId`
  → `UpgradeProcessExecutionViewComponent` with `executionExistsGuard`, exported from feature index).
- Specs: component 10/10, routes 4/4 — GREEN (ATL `screen`/`userEvent`, `MockComponent` for the table /
  toggle / dialog, `jest.spyOn(dialog, "open")` for the Build click, `provideNoopAnimations()`).

### Step 18 — `composite-widget/.../upgrade-process/templates-dialog/upgrade-templates-dialog.component.ts`
- Exact mirror of `ValidationTemplatesDialogComponent` with family `binary-upgrade`. **Reuses the shared
  `deriveSubFamilies` helper** and **reuses BT's `SubFamilyOptionsDataProvider`** via the same cross-folder
  relative import (`../../build-and-test/templates-dialog/sub-family-options-data-provider`). Title
  "Upgrade Available Templates"; Sub-Activity = shared `mxevolve-single-select-dropdown` defaulting to
  "All"; UI pagination size 5; Run → `goTo("executor")`; header binds `selected()?.name`.
  **Page 2 (`executor`) is a placeholder `<p>{{ definition.name }}</p>`** — Step 19 replaces it (no
  executor import / no `created` output yet). Exported from `composite-widget/src/index.ts`. Spec 8/8 GREEN.

### What Step 19 (Upgrade executor, Page 2) needs
- Replace the dialog's `executor` placeholder with the upgrade Reactive-Forms executor, projected into the
  SAME multi-page dialog (header already binds the selected name); add a `created` output +
  `onExecutorCreated()` (close + emit) and wire `(created)` on the executor element — mirror the Validation
  dialog's Step-15 wiring exactly.
- Reuse the form-from-`providedInputs` `computed(buildXForm(...))` + once-at-init `shouldShowInForm`
  visibility pattern; the `mxevolveNoopValueAccessor` workaround (gotcha #7) for any
  `mxevolve-notifications-recipients-input`; the leaf selectors in `business-process/widget`; and
  `DevelopmentService.getDevelopments` (scm/data-access) for any branch/source resolution.
- Legacy upgrade executor input template lives under `features/business-process/.../upgrade-process`
  (binary-upgrade definition executor) — transcribe its per-field `inputAccessMode` verbatim (do NOT
  derive), same discipline as Steps 9/10/15.

### Contract tests
None authored. Step 16 reused `UpgradeProcessListingService` **UNCHANGED** (no endpoint copied/added), and
that service **already has** a legacy/new-arch pact
(`data-access/.../contracts/upgrade-process/upgrade-process-listing-service.pact.spec.ts`, GET
`executions/binary-upgrade`) which is **unaffected** by this batch. So there is no new pact obligation and
the existing contract is preserved (verified 2026-07-01). Better position than the Validation mirror, which
had no listing pact at all.

### Hygiene
Did NOT run `:web:spotlessApply` (open-point #6). All new web files hand-formatted to double quotes /
printWidth 120; `index.ts` exports one-per-line double-quoted. `eslint` clean (exit 0) on all new/changed
files (feature activity dir, composite-widget templates-dialog dir, both barrels, shell routing module),
incl. `@nx/enforce-module-boundaries`.


---

## Batch 5b — Step 19 (Upgrade executor, Page 2 + prefilled display) — DONE — FEATURE COMPLETE (steps 1–19)

Page-2 reactive-forms upgrade executor (largest field set, no flag-gated field), projected into the
Step-18 dialog. All specs GREEN. **This is the final implementation step — the VAL-27132 feature
implementation is complete (steps 1–19).**

### Files
- **data-access** (`business-process/data-access/.../upgrade-process/executor/`, double-quote / printWidth 120):
  migrated legacy `UpgradeProcessDefinitionExecutorService` — `upgrade-process-definition-executor.service.{ts,spec.ts}`
  + `execute-upgrade-process-definition-{request,api-request,response,api-response}.ts`. Keeps the legacy
  `mapRequest` (strips `projectId` → URL, rebuilds the nested MX/config/infra/test/reference payload) +
  `mapResponse` (`{ id }` → `{ upgradeProcessExecutionId }`) + `toErrorMessage` (mirrors legacy `handleError`).
  Signature `executeUpgradeProcessDefinition(request)` (request carries `projectId`), matching legacy. Spec 2/2.
  Exported from `data-access/src/index.ts` (service + request/param types + response type).
- **widget** (`business-process/widget/.../prefilled-inputs/`, single-quote widget style): new
  `UpgradePrefilledInputsComponent` (`mxevolve-upgrade-prefilled-inputs`) + `UPGRADE_PREFILLED_LABELS` +
  `toUpgradePrefilledRows` added to `prefilled-inputs.types.ts` (the two factory-product **objects** are
  expanded into MX Version / MX Build ID / BIP Version / BIP Build ID rows). Spec 6/6. Exported from widget index.
- **composite-widget** (`business-process/composite-widget/.../upgrade-process/executor/`, double-quote / 120):
  `upgrade-executor.{component.ts,html,scss,form.ts,component.spec.ts}`. Spec 5/5. Exported from composite-widget index.
- Wired into `upgrade-templates-dialog.component.{ts,html}` (placeholder `executor` page → real executor;
  added `created` output + `onExecutorCreated()` close+emit; import + imports-array). Dialog spec updated
  (mock executor in MOCK_IMPORTS) 8/8.

### accessMode per field (from legacy `execute-upgrade-process-definition-inputs.component.html`, verbatim)
ALL fields `ACCESS_INVALID_INPUTS_ONLY` **except** notifications = `ACCESS_EMPTY_OPTIONAL_INPUTS`. No
conditional/flag-gated field for upgrade (unlike Validation's scope-commit). Prefilled (valid) fields hide
from the form → shown read-only in the "{name} Details" panel via `mxevolve-upgrade-prefilled-inputs`.
Groups gated by `showXGroup()` (match committed BT/Validation executors — see open-point #24).

### Field / validator / group checklist (verbatim vs legacy `initializeForm`) — nothing lost
| Group | Field (form control) | Validators |
|---|---|---|
| (top) | official | required |
| (top) | name | required + notBlank |
| MX Parameters | factoryProduct | required + factoryProductAttributes (value.id truthy) |
| MX Parameters | parentMxArchivalBranch | required + notBlank + noWhitespaces |
| MX Parameters | upgradeJump | required |
| Configuration Parameters | repositoryId | required |
| Configuration Parameters | businessProcessQualityLevel | required |
| Configuration Parameters | createBranch (seeded via mapCreateBranchToBoolean) | required |
| Configuration Parameters | configurationBranchName | required |
| Configuration Parameters | configurationParentBranch | required |
| Infrastructure Parameters | qualityGateExecutionInfraGroupId | required |
| Infrastructure Parameters | binaryConversionInfraGroupId | required |
| Tests | testScenarioIds (multi) | required + minLength(1) |
| Tests | technicalUpgradeTestScenarioId | required |
| Reference Environment Parameters | referenceCommitId | required + notBlank + noWhitespaces |
| Reference Environment Parameters | referenceFactoryProduct | required + factoryProductAttributes |
| Reference Environment Parameters | referenceEnvironmentDefinitionId | required |
| Reference Environment Parameters | referenceEnvironmentInfraGroupId | required |
| Notifications | notificationsRecipients | none (optional) |
Validators reproduced inline (`factoryProductAttributes()` = legacy `FactoryProductValidator`; `notBlank`/
`noWhitespaces` from `@mxevolve/shared/ui/form`) — no legacy `libs/ui/inputs` import (change #7). All legacy
`InputValidationMode.VALIDATE_ALL_FIELDS`.

### Submit payload / `mapRequest` transcription (verbatim vs legacy `getExecuteUpgradeProcessRequest`)
`UpgradeProcessDefinitionExecutorService.executeUpgradeProcessDefinition(request)` (POST
`executions/binary-upgrade/execute`), request built in the component's `toRequest(form)`:
`{ projectId, name, definitionId(=definition.id), official, notificationsRecipients,
mxParameters: { parentMxArchivalBranch, upgradeJump,
  conversionFactoryProduct: { id, mxVersion, mxBuildId, bipVersion, bipBuildId }(=factoryProduct) },
configurationParameters: { repositoryId, createBranch, configurationBranchName,
  configurationParentBranchName(=configurationParentBranch), businessProcessQualityLevel },
infrastructureParameters: { qualityGateExecutionInfraGroupId, binaryConversionInfraGroupId },
testParameters: { binaryConversionScenarioDefinitionId(=technicalUpgradeTestScenarioId),
  qualityGateScenarioDefinitionIds(=testScenarioIds) },
referenceEnvironmentParameters: { referenceCommitId,
  referenceFactoryProduct: { id, mxVersion, mxBuildId, bipVersion, bipBuildId },
  referenceEnvironmentDefinitionId, referenceEnvironmentInfraGroupId } }`.
KEY REMAPS: form `technicalUpgradeTestScenarioId` → `testParameters.binaryConversionScenarioDefinitionId`;
form `testScenarioIds` → `testParameters.qualityGateScenarioDefinitionIds`; form `configurationParentBranch`
→ `configurationParameters.configurationParentBranchName`. The service's `mapRequest` then strips `projectId`
(→ URL) and re-emits the identical nested body. `catchError → toast.showError(err.message) → EMPTY`; on
success `created.emit()` (no router nav — close + emit only). Spec asserts the exact object above.

### Reused widgets / noop accessor / provider
- `business-process/widget`: `UpgradePrefilledInputsComponent`, `InfraGroupSelectorComponent`
  (`[infraGroupFormControl] infraGroupFormControlName`, x3 — quality-gate, binary-conversion, reference-env),
  `NotificationsRecipientsInputComponent`.
- **Reused noop gotcha #7:** `mxevolveNoopValueAccessor` on `mxevolve-notifications-recipients-input`
  (`[formControl]` input) to avoid NG01203.
- The two factory-product fields + the multi-select `testScenarioIds` render as read-only informational
  notes when non-prefilled (no editable rich picker; always prefilled for real defs — open-point #23). Other
  selectable string fields render as plain `pInputText` fallbacks. No legacy `libs/ui/inputs` import.
- Executor **self-provides** `UpgradeProcessDefinitionExecutorService` (`providers: [...]`, per step
  instruction + legacy); spec mocks it via Testing Library `componentProviders` (open-point #22 notes the
  divergence from BT/Validation which don't self-provide).

### Contract tests
None authored. Verified no legacy pact exists for `POST executions/binary-upgrade/execute` (legacy executor
service has a unit spec only). Recorded as open-point #21.

### Tests — GREEN
- `upgrade-process-definition-executor.service.spec.ts` — **2/2** (exact mapped api-request to the endpoint;
  mapped error message).
- `upgrade-prefilled-inputs.component.spec.ts` — **6/6** (flat MX/config/infra rows; conversion + reference
  factory-product object expansion; array comma-join; empty-value skip; unknown-input skip).
- `upgrade-executor.component.spec.ts` — **5/5** (all fields/groups present; prefilled hidden → details panel;
  exact submit payload + created emit; disabled-until-valid; error toast).
- `upgrade-templates-dialog.component.spec.ts` — **8/8** (updated: mock the executor in MOCK_IMPORTS).
Total **21** GREEN. Angular Testing Library + `screen`/`userEvent` + `MockComponent`/`ngMocks`,
`provideNoopAnimations()`. NO data-testid / NO_ERRORS_SCHEMA.

### Hygiene
Did NOT run `:web:spotlessApply` (open-point #6). New composite-widget/data-access files hand-formatted to
double quotes / printWidth 120; new widget files to single quotes (widget-lib style); barrels one-per-line
double-quoted. `eslint` clean (exit 0) on all new/changed files incl. module boundaries.

### FEATURE IMPLEMENTATION COMPLETE (steps 1–19)
All planned steps (Build & Test, Backport, Validation and Upgrade activity landing pages + Page-1 templates
dialogs + Page-2 reactive-forms executors + prefilled displays + data-access splits + nav tabs/routes) are
implemented. Remaining follow-ups live in `open-points.md` (#1–#24), chiefly provider-side pact verification
and deferred rich editable pickers for the always-prefilled fields.
