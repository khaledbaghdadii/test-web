# Step 13: Validation landing page + nav tab/route

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 3, Step 4, Step 12
**AC:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6

## Summary
Create the **Validation Activity** landing feature (route + page) mirroring Step 6: Active Runs + Show
History tables (validation columns), My Builds, sticky Actions, and a **new nav tab** inserted **directly
after "Build & Test Activity" and before "Upgrade Activity"/"Business Process"** (fixed order Build & Test
→ Validation → Upgrade, all before "Business Processes").

## Files
- `web/libs/domains/business-process/feature/src/lib/validation-process/activity/validation-activity.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/feature/src/lib/validation-process/activity/validation-activity.routes.ts` (new)
- `web/libs/domains/business-process/feature/src/lib/validation-process/activity/validation-activity.component.spec.ts` (new)
- `web/libs/domains/business-process/feature/src/index.ts` (mod — export routes)
- `web/apps/shell/src/app/layout/app-layout/app-layout.component.ts` (mod — insert "Validation Activity" tab directly after "Build & Test Activity", before "Business Process")
- `web/apps/shell/src/app/layout/app-layout/app-layout-routing.module.ts` (mod — register route)

## Implementation Details
- Same container pattern as Step 6 with **validation columns** in legacy order: Execution Name, Status,
  Official Status, BP Quality Level, Owner, Start Date, End Date, Expiry Date. Owner hidden when My Builds
  on. Name-mapping labels applied.
- `loadPage` = Step 12 adapters (active pageSize 5; history pageSize 10). Actions cell (abort + repush).
  Build button opens the Validation templates dialog (Step 14).
- Nav tab "Validation Activity" inserted **directly after "Build & Test Activity"** (so the block reads
  Build & Test → Validation → Upgrade), still before "Business Process"; lazy route registered; preserve
  guards/data authorization.

### Captured-design layout (2026-06-30 — reuse the Build & Test frames; Validation analogues)
- Same structure as Step 6 with **Validation** labels: breadcrumb "🏠 › {Project} › Validation Activity";
  page title "List of Validation runs" (analogue); the **My Build** toggle (label per activity if legacy
  differs) immediately left of the primary **Build** button. The out-of-scope summary cards row is NOT built.
- **Active Runs** + **Inactive Runs** each have their own column-settings gear (**no free-text Search box** —
  column filters only, decision 2026-06-30 / PR #11556); Status renders as a colored badge; **both tables
  carry a sticky-right Actions column** (repush + abort) — on **Inactive Runs the abort is disabled**
  (terminal rows), repush available (Step 4 / change #4).
- **Reconciliation:** the Figma shows the Build & Test column set; map it to the **validation** legacy columns
  (Execution Name, Status, Official Status, BP Quality Level, Owner, Start/End/Expiry Date) and **keep every
  legacy validation column** the static design omits (gear-toggle / scroll). **Column-filter parity with the
  current validation table is a hard requirement** (confirmed PR #11556) — keep the **same column filters as
  the current table** for the columns we have today. Both Active and History expose Actions (history abort
  disabled), so there is no Active-only/History-none discrepancy to flag.

## Code Shape
```typescript
@Component({ selector: "mxevolve-validation-activity", standalone: true,
  imports: [ActivityRunsTableComponent, MyBuildsToggleComponent, ValidationTemplatesDialogComponent] })
export class ValidationActivityComponent {
  readonly projectId = input.required<string>();
  readonly historyShown = signal(false);
  readonly columnDefs = computed<ColDef[]>(() => /* validation legacy order */);
}
```

## Sub-steps
- [ ] 13a. Generate activity component + routes; export.
- [ ] 13b. Render Active + History tables (validation columns/order) + My Builds + Actions.
- [ ] 13c. Wire Build button to the Validation templates dialog (Step 14).
- [ ] 13d. Insert "Validation Activity" tab directly after "Build & Test Activity" (before "Business Process") + register lazy route (preserve guards/data auth).
- [ ] 13e. Spec: statuses/pageSize; My Builds; history reveal; columns.

## Tests
- Component spec.

## Test Obligations
- Production files: activity component + routes + shell edits.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-feature`.

## Template
Step 6; legacy `validation-process-executions` table columns.

## Manual Verification
"Validation Activity" tab appears second (after Build & Test, before Upgrade/Business Processes); page shows validation columns/filters/sort/page sizes; both Active and Inactive tables have a sticky Actions column (history abort disabled); no free-text Search box; My Builds + abort + repush work.

## Risk
Medium — additive new route; validation column/filter parity + tab placement + guard preservation.
