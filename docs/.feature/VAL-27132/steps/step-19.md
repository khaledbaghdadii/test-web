# Step 19: Upgrade executor (Page 2) + prefilled display

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 1, Step 11, Step 18
**AC:** AC-11, AC-12, AC-13

## Summary
Migrate the Upgrade definition executor to **signals + Angular Reactive Forms** as Dialog Page 2, with an
upgrade prefilled-display component (Step 11 pattern). Largest field set; no conditional flag-gated field.

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/upgrade-process/executor/upgrade-executor.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/upgrade-process/executor/upgrade-executor.form.ts` (new — Reactive Forms `FormGroup` factory)
- `web/libs/domains/business-process/ui/src/lib/prefilled-inputs/upgrade-prefilled-inputs.component.{ts,html}` (new)
- `*.spec.ts` for component, form, prefilled component (new)
- `…/composite-widget/src/index.ts`, `…/ui/src/index.ts` (mod — exports)

## Implementation Details
- Legacy source: `upgrade-process-definition-executor-modal.component.ts` +
  `ExecuteUpgradeProcessDefinitionInputsComponent` + `UpgradeProcessConfigurationParamsInputsComponent`.
  Fields (do not lose any): `official`, `name`, MX params (`factoryProduct`, `parentMxArchivalBranch`,
  `upgradeJump`), config params (`repositoryId`, `businessProcessQualityLevel`, `createBranch`,
  `configurationBranchName`, `configurationParentBranch`), infra (`qualityGateExecutionInfraGroupId`,
  `binaryConversionInfraGroupId`), tests (`testScenarioIds` multi, `technicalUpgradeTestScenarioId` single),
  reference env (`referenceCommitId`, `referenceEnvironmentDefinitionId`, `referenceFactoryProduct`,
  `referenceEnvironmentInfraGroupId`), `notificationsRecipients` (optional). All groups always rendered.
- Build with **Angular Reactive Forms** (`FormGroup`/`FormControl`, `ReactiveFormsModule`) — change #3
  (Signal Forms not used). Consume the **new-arch** selectors, **rebuilt fresh** in `business-process/ui` on
  the shared `mxevolve-single-select-dropdown` / `mxevolve-multiselect-dropdown` — **no legacy
  `libs/ui/inputs` import** (change #7): factory-product, upgrade-jump, infra-group, scenario-definition,
  environment-definition, notifications-recipients selectors.
- Note legacy upgrade executor uses constructor injection + a `mapRequest()` mapper and a locally-provided
  service — preserve the request mapping in the new submit path.
- Visibility (non-prefilled vs prefilled) via Step 11; expand-arrow shows `mxevolve-upgrade-prefilled-inputs`.
- **Build** → `UpgradeProcessDefinitionExecutorService.executeUpgradeProcessDefinition(request)`
  (`POST executions/binary-upgrade/execute`); `catchError → showError`; close + emit on success.

### Captured-design layout (2026-06-30 — `designs/jira-1901576.png`, same dialog chrome as Step 9)
- Page 2 reuses the **same generic dialog**: header = **back chevron ‹** + **template name** title + **X close**;
  a collapsible **"{template name} Details"** panel reveals the prefilled fields (`mxevolve-upgrade-prefilled-inputs`).
- Non-prefilled fields grouped under their section headings (MX params, config, infra, tests, reference env,
  notifications). A **centered primary "Build" button** submits; the **"Additional settings"** expander stays
  OUT OF SCOPE; horizontal scroll when many inputs show.

## Code Shape
```typescript
@Component({ selector: "mxevolve-upgrade-executor", standalone: true,
  providers: [UpgradeProcessDefinitionExecutorService], imports: [ReactiveFormsModule, /* new-arch selectors, prefilled */] })
export class UpgradeExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<DefinitionApiModel>();
  readonly created = output<void>();
  readonly form = buildUpgradeForm(/* validators incl. factoryProduct */);
  build() { /* mapRequest(form.getRawValue()) → executeUpgradeProcessDefinition(...).pipe(catchError(showError)) */ }
}
```

## Sub-steps
- [ ] 19a. Reactive Forms `FormGroup` + validators for all upgrade fields (incl. factoryProduct validators).
- [ ] 19b. Render fields by group via the new-arch selectors + expand-arrow prefilled (upgrade) panel; preserve `mapRequest` payload.
- [ ] 19c. Wire Build to upgrade execute service (catchError → showError); close + emit on success.
- [ ] 19d. Spec: field presence vs legacy; submit payload (via mapper); error path.

## Tests
- Component + form + prefilled-component specs.

## Test Obligations
- Production files: executor + form + prefilled component.
- Required tests: the specs above.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`, `…-ui`.

## Template
Legacy upgrade executor + config-params + `mapRequest` (behaviour reference); Steps 9/11; Angular **Reactive Forms**.

## Manual Verification
Run an upgrade template: all groups/fields present (MX, config, infra, tests, reference env, notifications); Build executes with the correct payload; errors toast.

## Risk
High — largest field set + request mapper; must reproduce every field and the mapped submit payload exactly.
