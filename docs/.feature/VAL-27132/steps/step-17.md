# Step 17: Upgrade landing page + nav tab/route

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 3, Step 4, Step 16
**AC:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6

## Summary
Create the **Upgrade Activity** landing feature (route + page) mirroring Steps 6/13: Active Runs + Show
History tables (upgrade columns), My Builds, sticky Actions, and a **new nav tab** inserted **directly
after "Validation Activity"** (so the three activity tabs read Build & Test → Validation → Upgrade), all
before "Business Processes".

## Files
- `web/libs/domains/business-process/feature/src/lib/upgrade-process/activity/upgrade-activity.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/feature/src/lib/upgrade-process/activity/upgrade-activity.routes.ts` (new)
- `web/libs/domains/business-process/feature/src/lib/upgrade-process/activity/upgrade-activity.component.spec.ts` (new)
- `web/libs/domains/business-process/feature/src/index.ts` (mod — export routes)
- `web/apps/shell/src/app/layout/app-layout/app-layout.component.ts` (mod — insert "Upgrade Activity" tab directly after "Validation Activity", before "Business Process")
- `web/apps/shell/src/app/layout/app-layout/app-layout-routing.module.ts` (mod — register route)

## Implementation Details
- Same container pattern as Steps 6/13 with **upgrade columns** in legacy order (mirror
  `BinaryUpgradeExecutionsTableComponent`). Owner hidden when My Builds on. Name-mapping labels.
- `loadPage` = Step 16 adapters (active pageSize 5; history pageSize 10). Actions cell (abort + repush).
  Build button opens the Upgrade templates dialog (Step 18).
- Nav tab "Upgrade Activity" inserted **directly after "Validation Activity"** (last of the three activity
  tabs), still before "Business Process"; lazy route registered; preserve guards/data authorization.
- The **final tab order is fixed** (decision 2026-06-30): **Build & Test Activity, Validation Activity,
  Upgrade Activity, then Business Process**.

### Captured-design layout (2026-06-30 — reuse the Build & Test frames; Upgrade analogues)
- Same structure as Steps 6/13 with **Upgrade** labels: breadcrumb "🏠 › {Project} › Upgrade Activity";
  page title "List of Upgrade runs" (analogue); the **My Build** toggle immediately left of the primary
  **Build** button. The out-of-scope summary cards row is NOT built.
- **Active Runs** + **Inactive Runs** each have their own column-settings gear (**no free-text Search box** —
  column filters only, decision 2026-06-30 / PR #11556); Status as a colored badge; **both tables carry a
  sticky-right Actions column** (repush + abort) — on **Inactive Runs the abort is disabled** (terminal
  rows), repush available (Step 4 / change #4).
- **Reconciliation:** map the Figma column set to the **upgrade** legacy columns
  (mirror `BinaryUpgradeExecutionsTableComponent`) and **keep every legacy upgrade column** the static
  design omits (gear-toggle / scroll). **Column-filter parity with the current upgrade table is a hard
  requirement** (confirmed PR #11556) — keep the **same column filters as the current table** for the columns
  we have today. Both Active and History expose Actions (history abort disabled), so there is no
  Active-only/History-none discrepancy to flag.

## Code Shape
```typescript
@Component({ selector: "mxevolve-upgrade-activity", standalone: true,
  imports: [ActivityRunsTableComponent, MyBuildsToggleComponent, UpgradeTemplatesDialogComponent] })
export class UpgradeActivityComponent {
  readonly projectId = input.required<string>();
  readonly historyShown = signal(false);
  readonly columnDefs = computed<ColDef[]>(() => /* upgrade legacy order */);
}
```

## Sub-steps
- [ ] 17a. Generate activity component + routes; export.
- [ ] 17b. Render Active + History tables (upgrade columns/order) + My Builds + Actions.
- [ ] 17c. Wire Build button to the Upgrade templates dialog (Step 18).
- [ ] 17d. Insert "Upgrade Activity" tab directly after "Validation Activity" (before "Business Process") + register lazy route; the three activity tabs read Build & Test → Validation → Upgrade.
- [ ] 17e. Spec: statuses/pageSize; My Builds; history reveal; columns.

## Tests
- Component spec.

## Test Obligations
- Production files: activity component + routes + shell edits.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-feature`.

## Template
Steps 6/13; legacy `binary-upgrade-executions` table columns.

## Manual Verification
"Upgrade Activity" tab appears among the first tabs; page shows upgrade columns/filters/sort/page sizes; both Active and Inactive tables have a sticky Actions column (history abort disabled); no free-text Search box; My Builds + abort + repush work; all three activity tabs precede Business Processes.

## Risk
Medium — additive new route; upgrade column/filter parity + guard preservation (tab order is now fixed).
