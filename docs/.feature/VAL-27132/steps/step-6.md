# Step 6: Build & Test landing page + first nav tab/route

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 3, Step 4, Step 5
**AC:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7

## Summary
Create the Build & Test Activity landing **feature** (route + page container) with the **Active Runs** and
**Show History** tables (two `mxevolve-activity-runs-table` instances), My Builds toggle, sticky Actions,
and a **new nav tab placed first**. Wires the Build button (opens the dialog from Step 8).

## Files
- `web/libs/domains/business-process/feature/src/lib/build-and-test/activity/build-and-test-activity.component.{ts,html,scss}` (new — page container)
- `web/libs/domains/business-process/feature/src/lib/build-and-test/activity/build-and-test-activity.routes.ts` (new)
- `web/libs/domains/business-process/feature/src/lib/build-and-test/activity/all-runs-activity.component.spec.ts` (new)
- `web/libs/domains/business-process/feature/src/index.ts` (mod — export routes)
- `web/apps/shell/src/app/layout/app-layout/app-layout.component.ts` (mod — add "Build & Test Activity" tab as the FIRST of the three activity tabs in `initializeMenuItems()`, immediately before "Business Process")
- `web/apps/shell/src/app/layout/app-layout/app-layout-routing.module.ts` (mod — register the lazy route)

## Implementation Details
- Container holds: a **Build** button (opens the multi-page dialog — Step 8), a **My Builds** toggle, the
  **Active Runs** table (`pageSize=5`, statuses `[running, pending_input, aborting]`), and a **Show History**
  button revealing the **History** table (`pageSize=10`, history statuses). Use a signal `historyShown`.

### Captured-design layout (2026-06-30 — `designs/figma-5164-183241.png`, `figma-3138-28712.png`, `jira-1901569.png`)
- **Breadcrumb row** above the page title: "🏠 › {Project} › Build & Test Activity" (reuse the app breadcrumb).
- **Header**: left = page title **"List of Build & Test runs"**; right = the **"My Build" toggle** immediately
  left of the primary **"Build" button** (the Run trigger that opens the dialog). The out-of-scope summary
  **cards** row sits between header and tables — do **not** build it (see Out of Scope).
- **Active Runs** heading + a **column-settings gear** (Step 3 header slot). **No free-text Search box**
  (decision 2026-06-30 / PR #11556 — filtering is **column-based only**; the My Build toggle filters by owner).
  **Visible Figma columns in order: Name · Status · User Stories ID · Current Step · Step Details · Type ·
  Branch Name · Actions** (Name + User Stories ID as links; Status as a colored badge; **Actions sticky-right**
  = repush + abort icons).
- **Show History ⌄** button below Active Runs toggles the **"Inactive Runs"** table (its own column-settings
  gear, no Search box) with **visible Figma columns in order: Name · Status · User Stories ID · Branch Name ·
  Type · Owner · Start Date** plus a sticky-right **Actions** column (decision 2026-06-30 / PR #11556 —
  **History now also has an Actions column**, with **abort disabled** on the terminal history rows and repush
  available; the reused new-arch abort component already handles the disabled state — Step 4 / change #4).
- **Reconciliation (design = styling, not column completeness):** the Figma may omit legacy columns/filters.
  Compare the visible set above against the legacy CI table columns (Execution Name, Status, User Stories IDs,
  Configuration Branch Name, Owner, Start Date, End Date, Expiry Date, Days Extended, Duration, Business
  Process Definition, Process Name). **Keep every legacy column the design omits** (behind the column-settings
  gear / horizontal scroll) and keep column **sort** behaviour. **Column-filter parity with the current table
  is a hard requirement** (confirmed PR #11556) — the new tables keep the **same column filters as the current
  table** for the columns we have today. Both Active and History expose the Actions column (history abort
  disabled), so there is **no Active-only/History-none discrepancy** to flag.
- Column defs below = the full legacy column set in legacy order; the **visible/primary** ordering follows the
  Figma sets above, with the remaining legacy columns retained (gear-toggle / scroll).
- Column defs = legacy CI columns in order: Execution Name, Status, User Stories IDs, Configuration Branch
  Name, Owner, Start Date, End Date, Expiry Date, Days Extended, Duration, Business Process Definition,
  Process Name. Owner column hidden when My Builds on. Apply name-mapping labels (Process Run / Process
  Family etc.) in headers.
- `loadPage` = the active/history adapters from Step 5; pass `ownerPhrase` from My Builds; resolve
  jira-details **once** (Step 4 dedupe) and share to the User-Stories cell.
- Actions column uses `mxevolve-run-actions-cell` (abort + repush) on **both** Active and History tables;
  history rows render with abort **disabled** (terminal) — Step 4.
- **Nav tab**: the three activity tabs form a contiguous block placed **before** "Business Process",
  in fixed left-to-right order **Build & Test Activity → Validation Activity → Upgrade Activity**
  (final decision 2026-06-30). This step inserts **"Build & Test Activity" as the first item, immediately
  before "Business Process"** in `initializeMenuItems()`; Validation (Step 13) and Upgrade (Step 17) are
  inserted directly after it, still ahead of "Business Process". RouterLink to the new route. **Route**:
  lazy-load
  `build-and-test-activity.routes.ts` under `:projectId` children. Preserve existing route guards/data
  authorization pattern used by sibling routes.

## Code Shape
```typescript
@Component({ selector: "mxevolve-build-and-test-activity", standalone: true,
  imports: [ActivityRunsTableComponent, MyBuildsToggleComponent, MultiPageDialogComponent, /* dialog pages */] })
export class AllRunsActivityComponent {
  readonly projectId = input.required<string>(); // from route
  readonly historyShown = signal(false);
  readonly myBuildsUser = signal<string | undefined>(undefined);
  readonly activeColumnDefs = computed<ColDef[]>(() => /* legacy order */);
  readonly loadActive = (req) => toActivePage(req);   // Step 5 adapter
  readonly loadHistory = (req) => toHistoryPage(req);
}
// app-layout.component.ts initializeMenuItems(): insert Build & Test Activity tab
// directly before the "Business Process" item (first of the 3-tab activity block)
```

## Sub-steps
- [ ] 6a. Generate activity feature component + routes; export routes from barrel.
- [ ] 6b. Render Active + Show-History tables with legacy column defs/order + My Builds + Actions.
- [ ] 6c. Wire Build button placeholder to open the dialog (filled in Step 8).
- [ ] 6d. Add the "Build & Test Activity" tab immediately before "Business Process" (first of the 3-tab block) + register the lazy route (preserve guards/data auth).
- [ ] 6e. Spec: tables receive correct statuses/pageSize; My Builds hides Owner + sets ownerPhrase; history reveal.

## Tests
- Component spec; verify menu insertion order (tab is first) if testable at shell level.

## Test Obligations
- Production files: activity component + routes + shell menu/route edits.
- Required tests: activity component spec.
- Targeted test command: Nx Jest for `domains-business-process-feature` (+ shell spec if menu order asserted).

## Template
Legacy CI table columns/order; `validation-process-executions` container; sibling route registration in shell.

## Manual Verification
"Build & Test Activity" appears first; breadcrumb shows above the title; header has "List of Build & Test runs" + My Build toggle + Build button; Active Runs shows the Figma columns (Name · Status · User Stories ID · Current Step · Step Details · Type · Branch Name · Actions) with sticky repush+abort; Show History reveals Inactive Runs (Name · Status · User Stories ID · Branch Name · Type · Owner · Start Date) **with its own sticky Actions column (abort disabled, repush available)**; no free-text Search box (column filters only); all legacy columns + the same column filters as the current table still reachable; correct page sizes; My Builds + abort + repush work; one project-details call.

## Risk
Medium — additive new route; care on column/filter parity and correct first-position tab + guard preservation.
