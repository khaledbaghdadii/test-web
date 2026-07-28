# Step 12: Validation executions data-access split

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 4
**AC:** AC-2, AC-3, AC-16

## Summary
Adapt `ValidationProcessListingService` for the Validation landing page: two backend-paginated queries
(active = `running,pending_input,aborting`; history = the rest) to `executions/master-validation`,
mirroring Step 5.

## Files
- `web/libs/domains/business-process/data-access/src/lib/validation-process/validation-process-listing.service.ts` (verify; extend only if a filter param is missing)
- `web/libs/domains/business-process/feature/src/lib/validation-process/activity/validation-activity.queries.ts` (new — active/history query mappers)
- `*.spec.ts` for the mapper (new)

## Implementation Details
- Reuse `ValidationProcessListingService.getValidationProcessExecutions(projectId, queryParams)` →
  `executions/master-validation`. Do not duplicate.
- `loadPage` adapter: map `ActivityRunsPageRequest` → `ValidationProcessExecutionsQueryRequest` and result
  `{ content, totalElements }` → `{ rows, total }`. Active (statuses `[running, pending_input, aborting]`,
  pageSize 5); history (other statuses, pageSize 10); `hidden=false`, `sort=startDate,desc`.
- Preserve every legacy validation filter: `namePhrase, statuses, officiality,
  businessProcessQualityLevel, ownerPhrase, definitionIds, processNames, startDateRange, endDateRange,
  expiryDateRange, sortByStartDate, sortByExpiryDate, sortByDaysExtended`.

## Code Shape
```typescript
export function toValidationQuery(req: ActivityRunsPageRequest): ValidationProcessExecutionsQueryRequest {
  return { page: req.page, pageSize: req.pageSize, statuses: req.statuses,
    ownerPhrase: req.ownerPhrase, hidden: false, sort: req.sort, ...req.filters };
}
export const VAL_ACTIVE_STATUSES = ["running", "pending_input", "aborting"];
export const VAL_HISTORY_STATUSES = [/* all non-active */];
```

## Sub-steps
- [ ] 12a. Confirm the service covers all validation filter params; extend the query type only if needed.
- [ ] 12b. Write active/history mappers + status constants.
- [ ] 12c. Spec the mappers (param fidelity, status split).

## Tests
- Query-mapper spec.

## Test Obligations
- Production files: query mapper (+ service if extended).
- Required tests: mapper spec; service spec if touched.
- Targeted test command: Nx Jest for `domains-business-process-data-access` / `…-feature`.

## Template
Step 5; existing `ValidationProcessListingService` + `validation-process-executions-table-query.ts`.

## Manual Verification
Active table shows running/pending_input/aborting validation runs; history shows the rest; filters match legacy validation table.

## Risk
Medium — mapping/reuse; preserve validation-specific filters (officiality, BP quality level).
