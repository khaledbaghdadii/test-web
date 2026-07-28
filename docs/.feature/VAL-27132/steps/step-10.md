# Step 10: Backport definition executor (Page 2, Reactive Forms)

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 1, Step 8, Step 11
**AC:** AC-11, AC-12, AC-13

## Summary
Migrate the **Backport** definition executor (Build & Test sub-family `on-demand-backport`) to a clean
**signals + Angular Reactive Forms** component rendered as Dialog Page 2 when the selected template's
`sourceDefinitionId === "on-demand-backport"`. Separate component from the standard BT executor (req #9).

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/backport/executor/backport-executor.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/backport/executor/backport-executor.form.ts` (new — Reactive Forms `FormGroup` factory)
- `web/libs/domains/business-process/composite-widget/src/lib/backport/executor/backport-executor.component.spec.ts` (new)
- `web/libs/domains/business-process/ui/src/lib/inputs/reviewers-autocomplete/reviewers-autocomplete.component.{ts,html,spec.ts}` (new — new-arch reviewers selector rebuilt fresh on the shared dropdown; no legacy import)
- `web/libs/domains/business-process/composite-widget/src/index.ts` (mod — export)

## Implementation Details
- Legacy source (behaviour reference only): `backport-definition-executor.component.ts` +
  `ExecuteBackportProcessInputComponent`.
  Fields: `name` (required), `pullRequestId` (required, standard selectable validators), `userStoryIds`
  (required; `forceShow`), `pullRequestTitle` (required), `pullRequestReviewers` (required multi-select via
  the new-arch reviewers selector), `notificationsRecipients` (optional).
- Build with **Angular Reactive Forms** (`FormGroup`/`FormControl`, `ReactiveFormsModule`) — change #3
  (Signal Forms not used). Consume the **new-arch** `mxevolve-user-story-input` +
  `mxevolve-business-process-notifications-recipients-input` (Step 11) and a **new-arch reviewers selector**
  (`mxevolve-reviewers-autocomplete`, rebuilt fresh on the shared `mxevolve-multiselect-dropdown`) — **no
  legacy `libs/ui/inputs` import** (change #7). Reviewers depend on the repository (`ReviewersService` →
  `repositoryId`).
- Visibility: same Step 11 `shouldShowInForm` + expand-arrow prefilled panel
  (`mxevolve-backport-prefilled-inputs`).
- **Build** submit → `BackportProcessExecutorService.executeBackportProcessDefinition(projectId, request)`
  (`POST executions/ci-process/backport`); `catchError → showError` (keep special-case handling).
- Selected by the templates dialog (Step 8) when sub-family is on-demand-backport.

### Captured-design layout (2026-06-30 — `designs/jira-1901576.png`, same dialog chrome as Step 9)
- Same generic-dialog Page 2 chrome: header = **back chevron ‹** + **template name** title + **X close**;
  a collapsible **"{template name} Details"** panel reveals the prefilled fields (`mxevolve-backport-prefilled-inputs`).
- Non-prefilled fields grouped under section headings; the user-story row = labeled **"User Story ID"** input
  with a validity-check icon + a blue **"+" add** (no magnifier; keep feature-flagged validation).
- A **centered primary "Build" button** submits; the **"Additional settings"** expander stays OUT OF SCOPE;
  horizontal scroll when many inputs show.

## Code Shape
```typescript
@Component({ selector: "mxevolve-backport-executor", standalone: true, imports: [ReactiveFormsModule, /* new-arch reviewers, user-story, prefilled */] })
export class BackportExecutorComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<DefinitionApiModel>();
  readonly created = output<void>();
  readonly form = buildBackportForm(/* required validators incl. PR id/title, reviewers, user stories */);
  build() { /* backportExecutorService.executeBackportProcessDefinition(...).pipe(catchError(showError)) */ }
}
```

## Sub-steps
- [x] 10a. Reactive Forms `FormGroup` + validators (PR id/title required, reviewers required, user stories required).
- [x] 10b. Rebuild the new-arch reviewers selector (on the shared dropdown) tied to the repository; render fields + expand-arrow prefilled panel.
- [x] 10c. Wire Build submit to backport execute service (catchError → showError); close + emit on success.
- [x] 10d. Spec: field presence vs legacy; validation; submit payload; error path.

## Tests
- Component spec.

## Test Obligations
- Production files: backport executor + form schema.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`.

## Template
Legacy `backport-definition-executor` + `ExecuteBackportProcessInputComponent` (behaviour reference); Step 11; Angular **Reactive Forms**.

## Manual Verification
Run an On-Demand-Backport template: same dialog chrome (back chevron + name + X, collapsible "{name} Details" prefilled panel); all backport fields present, reviewers load for the repository, User Story ID row has "+" add; a centered Build executes; errors toast.

## Risk
High — Reactive-Forms migration; must reproduce every backport field/validator and the submit payload exactly.
