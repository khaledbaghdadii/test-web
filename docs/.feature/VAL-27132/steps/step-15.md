# Step 15: Validation executor (Page 2) + prefilled display + flag-gated field

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 1, Step 11, Step 14
**AC:** AC-11, AC-12, AC-13, AC-14

## Summary
Migrate the Validation definition executor to **signals + Angular Reactive Forms** as Dialog Page 2,
including the **conditional** `validationScopeStartCommitId` field gated by the `jira-user-story-archival`
flag + its multi-condition visibility, plus a validation prefilled-display component (Step 11 pattern).

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/validation-process/executor/validation-executor.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/validation-process/executor/validation-executor.form.ts` (new — Reactive Forms `FormGroup` factory)
- `web/libs/domains/business-process/ui/src/lib/prefilled-inputs/validation-prefilled-inputs.component.{ts,html}` (new)
- `web/libs/domains/business-process/util/src/lib/definition-inputs/validation-scope-visibility.ts` (new — `validationScopeStartCommitId` visibility resolver migrated from legacy)
- `*.spec.ts` for component, form, prefilled component, visibility resolver (new)
- `…/composite-widget/src/index.ts`, `…/ui/src/index.ts`, `…/util/src/index.ts` (mod — exports)

## Implementation Details
- Legacy source: `validation-process-definition-executor.component.ts` +
  `ExecuteValidationProcessInputComponent` + `ValidationProcessConfigurationParametersComponent`.
  Fields (do not lose any): `official` (radio), `name` (required), config-params (`repositoryId`,
  `archivalBranchName` required, `parentBranchName`, `finalProductId`, `businessProcessQualityLevel`,
  `createBranch`, `rtpCommitId`, `configCommitId`), `qualityGateScenarioDefinitionIds` (multi),
  `nightlyRepusherEnabled` (radio), `validationScopeStartCommitId` (conditional),
  `qualityGateInfraGroupId`, `notificationsRecipients` (optional).
- **`validationScopeStartCommitId` visibility** (migrate `ValidationScopeStartCommitIdStateResolverService.isVisible`):
  show only if ALL of — flag `jira-user-story-archival` enabled, `official === true`,
  `businessProcessQualityLevel === "MQG"`, a parent branch resolvable, and the createBranch/parentBranch/
  archivalBranchName rule. When hidden: clear validators + reset. Implement as a computed signal from the
  Signal Forms model + the flag.
- Signal Forms schema + validators (`required` on name/archivalBranchName, `standardSelectableInputValidators`
  equivalents). **Build with Angular Reactive Forms** (`FormGroup`/`FormControl`, `ReactiveFormsModule`) —
  change #3 (Signal Forms not used). Consume the **new-arch** selectors (infra group, scenario definition,
  notifications — Step 11) plus the **validation-specific config-params and scope-commit inputs rebuilt fresh
  in new-arch** on the shared `mxevolve-single-select-dropdown` / `mxevolve-multiselect-dropdown` — **no
  legacy `libs/ui/inputs` import** (change #7).
- Visibility (non-prefilled vs prefilled) via Step 11; expand-arrow shows `mxevolve-validation-prefilled-inputs`.
- **Build** → `ValidationProcessExecutorService.executeValidationProcessDefinition(projectId, request)`
  (`POST executions/master-validation/execute`); `catchError → showError`; close + emit on success.

### Captured-design layout (2026-06-30 — `designs/jira-1901576.png`, same dialog chrome as Step 9)
- Page 2 reuses the **same generic dialog**: header = **back chevron ‹** + **template name** title + **X close**;
  a collapsible **"{template name} Details"** panel reveals the prefilled fields (`mxevolve-validation-prefilled-inputs`).
- Non-prefilled fields grouped under section headings; the user-story row (where present) = labeled
  **"User Story ID"** input with a validity-check icon + blue **"+" add** (no magnifier; keep the
  `user-story-validation-and-transition` logic). The conditional `validationScopeStartCommitId` field appears
  in-form only under its full visibility condition set.
- A **centered primary "Build" button** submits; the **"Additional settings"** expander stays OUT OF SCOPE;
  horizontal scroll when many inputs show.

## Code Shape
```typescript
@Component({ selector: "mxevolve-validation-executor", standalone: true, imports: [/* … */] })
export class ValidationExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<DefinitionApiModel>();
  readonly created = output<void>();
  private readonly flags = inject(FeatureFlagResolver);
  readonly archivalFlag = signal(false); // resolved from jira-user-story-archival
  // Reactive Forms FormGroup (typed); validators below
  readonly form = buildValidationForm(/* … */);
  readonly showScopeStartCommit = computed(() => isValidationScopeVisible(this.form.getRawValue(), this.archivalFlag()));
  build() { /* validationExecutorService.executeValidationProcessDefinition(...).pipe(catchError(showError)) */ }
}
```

## Sub-steps
- [x] 15a. Migrate the scope-commit visibility resolver to util + spec (all 5 conditions).
- [x] 15b. Reactive Forms `FormGroup` + validators for all validation fields (incl. new-arch config-params/scope-commit inputs).
- [x] 15c. Render non-prefilled fields + conditional scope-commit + expand-arrow prefilled (validation) panel.
- [x] 15d. Resolve `jira-user-story-archival` flag; clear/reset scope-commit when hidden.
- [x] 15e. Wire Build to validation execute service (catchError → showError); close + emit.
- [x] 15f. Spec: field presence vs legacy; scope-commit visibility matrix; submit payload; error path.

## Tests
- Component + form + visibility-resolver + prefilled-component specs.

## Test Obligations
- Production files: executor + form + prefilled component + visibility resolver.
- Required tests: the four specs above.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`, `…-ui`, `…-util`.

## Template
Legacy validation executor + config-params + scope-commit resolver (behaviour reference); Step 9/11; Angular **Reactive Forms**.

## Manual Verification
Run a validation template: all fields present; scope-commit appears only under the full condition set + flag; Build executes; errors toast.

## Risk
High — most complex executor (conditional flag-gated field); must reproduce every field + the visibility matrix exactly.
