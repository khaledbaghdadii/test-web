# Step 3: Reusable AG Grid landing-table widget

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** none
**AC:** AC-2, AC-3, AC-4

## Summary
Create a reusable, configurable **AG Grid** table widget (serverSide row model, backend pagination,
custom header filter controls, sticky last column) that all three activities reuse to render both the
**Active Runs** and **Show History** tables. Column defs, filters, page size, and the data loader are
provided by the consumer so it stays activity-agnostic.

## Files
- `web/libs/domains/business-process/widget/src/lib/activity-runs-table/activity-runs-table.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/widget/src/lib/activity-runs-table/activity-runs-table.types.ts` (new — column/filter config + datasource contract)
- `web/libs/domains/business-process/widget/src/lib/activity-runs-table/activity-runs-table.component.spec.ts` (new)
- `web/libs/domains/business-process/widget/src/index.ts` (mod — export)

## Implementation Details
- Template: `web/libs/domains/scm/widget/src/lib/paginated-commits-difference` (AG Grid serverSide):
  `rowModelType: "serverSide"`, `[pagination]="true"`, `paginationPageSize`, `cacheBlockSize`,
  `IServerSideDatasource.getRows`.
- Inputs (signals): `projectId`, `columnDefs` (`ColDef[]` signal), `pageSize` (default configurable),
  `loadPage` (a function `(request: ActivityRunsPageRequest) => Observable<{ rows; total }>` provided by
  the consumer — wraps the per-activity executions service + status filter + ownerPhrase + sort), and
  `actionsCellRenderer`/`actionsColumn` config for the sticky Actions column.
- **Custom header filter controls** mapped to the same query params (name, status checkbox, date ranges,
  owner, definition/process-name, etc.). Filter changes update a `filters` signal → triggers datasource
  refresh (purge server-side cache). Do NOT use AG Grid built-in filter UI (decision #4). **Column-filter
  parity with the current table is a hard requirement** (confirmed PR #11556) — keep the **same column
  filters as the current table** for the columns we have today; no free-text Search box (change #2).
- **Sticky Actions** column: pin last column (`pinned: "right"`) + scss so it stays visible; renders the
  consumer-provided actions cell (abort + repush, Step 4).
- Loading/empty overlays: reuse `TableLoadingOverlayComponent` / `TableNoRowsOverlayComponent`
  (`@mxevolve/shared/ui/table`).
- All data via the consumer's `loadPage` (rxResource-friendly); no direct HTTP here.

### Captured-design layout (2026-06-30 — `designs/figma-5164-183241.png`, `figma-3138-28712.png`, `jira-1901569.png`)
- The widget header area shows the section heading (e.g. "Active Runs") with a **column-settings gear**
  icon. **There is no free-text Search box** (decision 2026-06-30 / PR #11556 — a search box would require
  backend changes; filtering is **column-based only**). Expose a configurable header slot (heading text +
  optional gear) for each table instance (Active / Inactive). The **My Builds toggle** (Step 4) stays and
  filters by owner via the toggle — it is not a search box.
- **Status** cell = a **colored badge**, not plain text: Pending Input = amber/warning, Running = blue/info,
  Passed = green/success, Cancelled = red/danger (reuse the existing status-badge styling).
- **Name** and **User Stories ID** cells render as **links** (consumer supplies the cell renderers).
- **Sticky Actions** column (pinned-right) holds two **icon buttons** in the design: **repush** (blue
  refresh/repeat icon) + **abort** (red power icon) — the consumer-provided actions cell (Step 4). The widget
  supports the Actions column on **both** the Active and History instances; the consumer passes the actions
  config to each (history rows render abort **disabled** — Step 4 / change #4).
- The design is **styling/layout authority only**: the visible Figma column set is the activity consumer's
  concern (Steps 6/13/17); this widget stays activity-agnostic. **Column-filter parity with the current
  table is a hard requirement** (confirmed PR #11556): the widget must reproduce **every** column filter the
  consumer passes — the new tables keep the **same column filters as the current table** for the columns we
  have today.

## Code Shape
```typescript
export interface ActivityRunsPageRequest {
  page: number; pageSize: number;
  statuses: string[];            // active: [running, pending_input, aborting]; history: the rest
  ownerPhrase?: string;          // My Builds toggle (owner filter — NOT a free-text search box)
  sort: string;                  // "startDate,desc"
  filters: Record<string, unknown>; // mapped per-activity query params
}
export interface ActivityRunsPage<T> { rows: T[]; total: number; }

@Component({ selector: "mxevolve-activity-runs-table", standalone: true, imports: [AgGridAngular, /* overlays, filter controls */] })
export class ActivityRunsTableComponent<T = unknown> {
  readonly projectId = input.required<string>();
  readonly columnDefs = input.required<ColDef<T>[]>();
  readonly pageSize = input<number>(10);
  readonly statuses = input.required<string[]>();
  readonly ownerPhrase = input<string | undefined>(undefined);
  readonly loadPage = input.required<(req: ActivityRunsPageRequest) => Observable<ActivityRunsPage<T>>>();
  private readonly filters = signal<Record<string, unknown>>({});
  // serverSide datasource calls loadPage(); filters/ownerPhrase changes purge + reload
}
```

## Sub-steps
- [ ] 3a. Generate widget + types; wire AG Grid serverSide datasource calling `loadPage`.
- [ ] 3b. Implement custom header filter controls + `filters` signal → datasource refresh.
- [ ] 3c. Sticky (pinned-right) Actions column + loading/no-rows overlays.
- [ ] 3d. Export from widget barrel; eslint.
- [ ] 3e. Spec: datasource requests correct page/pageSize/statuses/sort; filter change reloads; sticky column present.

## Tests
- `activity-runs-table.component.spec.ts` with a stub `loadPage`.

## Test Obligations
- Production files: the widget + types.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-widget`.

## Template
`scm/widget/.../paginated-commits-difference` (serverSide datasource), `@mxevolve/shared/ui/table` overlays.

## Manual Verification
Render with a stub loader; paginate; toggle column filters; confirm Actions column stays pinned/visible on horizontal scroll. Status renders as a colored badge; Name + User Stories ID are links; each instance has its own column-settings gear (no Search box — column filters only); column filters match the current table for the columns we have today.

## Risk
High — central reusable component; must reproduce legacy pagination + every filter behaviour 1:1 and stay activity-agnostic.
