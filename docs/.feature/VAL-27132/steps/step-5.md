# Step 5: Build & Test executions data-access split + N+1 fix

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 4
**AC:** AC-2, AC-3, AC-7, AC-16

## Summary
Adapt the existing `BuildAndTestExecutionsService` usage to the new landing page: two backend-paginated
queries (active = `running,pending_input,aborting`; history = the rest) to `executions/ci-process`, and
ensure the jira-details call is made once (N+1 fix consumed here).

## Files
- `web/libs/domains/business-process/data-access/src/lib/build-and-test/build-and-test-executions/build-and-test-executions.service.ts` (verify; extend only if needed — it already builds the `ci-process` query)
- `web/libs/domains/business-process/feature/src/lib/build-and-test/activity/all-runs-activity.queries.ts` (new — map active/history `ActivityRunsPageRequest` → `BuildAndTestExecutionsQuery`)
- `*.spec.ts` for the query mapper (new)

## Implementation Details
- Reuse `BuildAndTestExecutionsService.getBuildAndTestExecutions(projectId, query)` →
  `Observable<BuildAndTestExecutionsQueryResult>` (already calls `executions/ci-process`). Do **not**
  duplicate the service.
- Define a `loadPage` adapter the table widget consumes: maps `ActivityRunsPageRequest` (page, pageSize,
  statuses, ownerPhrase, sort, filters) → `BuildAndTestExecutionsQuery` and the result `{ content,
  totalElements }` → `{ rows, total }`. Two configs: **active** (statuses `[running, pending_input,
  aborting]`, pageSize 5) and **history** (statuses = all others, pageSize 10), both `hidden=false`,
  `sort=startDate,desc`.
- Preserve every legacy filter param: `namePhrase, statuses, userStoryIds, configurationBranchNamePhrase,
  ownerPhrase, definitionIds, processNames, startDateRange, endDateRange, expiryDateRange,
  sortByStartDate, sortByExpiryDate, sortByDaysExtended`.
- N+1: jira-details resolved once at the activity container (Step 6) and shared; verify no per-row call.

## Code Shape
```typescript
export function toBuildAndTestQuery(req: ActivityRunsPageRequest): BuildAndTestExecutionsQuery {
  return {
    page: req.page, pageSize: req.pageSize, statuses: req.statuses,
    ownerPhrase: req.ownerPhrase, hidden: false, sort: req.sort,
    ...req.filters, // namePhrase, configurationBranchNamePhrase, userStoryIds, date ranges, etc.
  } as BuildAndTestExecutionsQuery;
}
export const BT_ACTIVE_STATUSES = ["running", "pending_input", "aborting"];
export const BT_HISTORY_STATUSES = [/* completed, failed, aborted, expired, … (all non-active) */];
```

## Sub-steps
- [ ] 5a. Confirm the existing service covers all query params; extend the query type only if a filter is missing.
- [ ] 5b. Write the active/history query mappers + status constants.
- [ ] 5c. Spec the mappers (param fidelity, active vs history status sets).
- [ ] 5d. Verify single jira-details call wiring (with Step 4 helper).

## Tests
- Query-mapper spec; reuse existing service spec (extend if the service changes).

## Test Obligations
- Production files: query mapper (+ service if extended).
- Required tests: mapper spec; service spec if touched (+ keep its contract test green if present).
- Targeted test command: Nx Jest for `domains-business-process-data-access` / `…-feature`.

## Template
Existing `BuildAndTestExecutionsService`; legacy CI table query `ci-process-executions-table-query.ts`.

## Manual Verification
Active table shows only running/pending_input/aborting; history shows the rest; filters/sort produce the same results as legacy.

## Risk
Medium — mostly mapping/reuse, but must preserve every filter param and the status split exactly.
