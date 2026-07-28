# Step 16: Upgrade executions data-access split

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 4
**AC:** AC-2, AC-3, AC-16

## Summary
Adapt `UpgradeProcessListingService` for the Upgrade landing page: two backend-paginated queries (active =
`running,pending_input,aborting`; history = the rest) to `executions/binary-upgrade`, mirroring Steps 5/12.

## Files
- `web/libs/domains/business-process/data-access/src/lib/upgrade-process/upgrade-process-listing.service.ts` (verify; extend only if a filter param is missing)
- `web/libs/domains/business-process/feature/src/lib/upgrade-process/activity/upgrade-activity.queries.ts` (new — active/history mappers)
- `*.spec.ts` for the mapper (new)

## Implementation Details
- Reuse `UpgradeProcessListingService.getBinaryUpgradeExecutions(projectId, queryParams)` →
  `executions/binary-upgrade`. Do not duplicate.
- `loadPage` adapter mapping `ActivityRunsPageRequest` → `BinaryUpgradeExecutionsQueryRequest` and result →
  `{ rows, total }`. Active (statuses `[running, pending_input, aborting]`, pageSize 5); history (other
  statuses, pageSize 10); `hidden=false`, `sort=startDate,desc`.
- Preserve every legacy upgrade filter param (mirror `BinaryUpgradeExecutionsTableComponent` query).

## Code Shape
```typescript
export function toUpgradeQuery(req: ActivityRunsPageRequest): BinaryUpgradeExecutionsQueryRequest {
  return { page: req.page, pageSize: req.pageSize, statuses: req.statuses,
    ownerPhrase: req.ownerPhrase, hidden: false, sort: req.sort, ...req.filters };
}
export const UPG_ACTIVE_STATUSES = ["running", "pending_input", "aborting"];
export const UPG_HISTORY_STATUSES = [/* all non-active */];
```

## Sub-steps
- [ ] 16a. Confirm the service covers all upgrade filter params; extend only if needed.
- [ ] 16b. Write active/history mappers + status constants.
- [ ] 16c. Spec the mappers.

## Tests
- Query-mapper spec.

## Test Obligations
- Production files: query mapper (+ service if extended).
- Required tests: mapper spec; service spec if touched.
- Targeted test command: Nx Jest for `domains-business-process-data-access` / `…-feature`.

## Template
Steps 5/12; `UpgradeProcessListingService` + `BinaryUpgradeExecutionsTableComponent`.

## Manual Verification
Active table shows running/pending_input/aborting upgrade runs; history shows the rest; filters match legacy upgrade table.

## Risk
Medium — mapping/reuse; preserve upgrade-specific filters.
