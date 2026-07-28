import { map, Observable } from "rxjs";
import {
  BuildAndTestExecutionsQuery,
  BuildAndTestExecutionsQueryResult,
  BuildAndTestExecutionsService,
  BuildAndTestExecutionSummary,
} from "@mxevolve/domains/business-process/data-access";
import type {
  ActivityRunsPage,
  ActivityRunsPageRequest,
} from "@mxevolve/domains/business-process/widget";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";

/**
 * Statuses shown on the **Active Runs** table — runs that are still in-flight
 * (an `ABORTING` run has not yet reached a terminal state, so it stays active).
 */
export const BT_ACTIVE_STATUSES: ExecutionStatus[] = [
  ExecutionStatus.RUNNING,
  ExecutionStatus.PENDING_INPUT,
  ExecutionStatus.ABORTING,
];

/**
 * Statuses shown on the **Show History** table — everything that is not active.
 * Derived as the complement of {@link BT_ACTIVE_STATUSES} so the two backend
 * queries together cover every status with no overlap.
 */
export const BT_HISTORY_STATUSES: ExecutionStatus[] = Object.values(
  ExecutionStatus
).filter((status) => !BT_ACTIVE_STATUSES.includes(status));

/**
 * Column-filter values the Build & Test landing tables collect (keyed to match
 * {@link BuildAndTestExecutionsQuery}). Date-range filters arrive as a
 * `[from, to]` pair and are split into the backend's start/end params.
 */
export interface BuildAndTestRunsFilters {
  namePhrase?: string;
  statuses?: string[];
  userStoryIds?: string;
  configurationBranchNamePhrase?: string;
  definitionIds?: string[];
  startDateRange?: Date[];
  endDateRange?: Date[];
  expiryDateRange?: Date[];
}

/**
 * Maps a table {@link ActivityRunsPageRequest} (page, status split, owner
 * filter, sort, column filters) onto the backend
 * {@link BuildAndTestExecutionsQuery}. `hidden` is always `false` (parity with
 * the legacy CI table) and every legacy filter param is preserved.
 */
export function toBuildAndTestQuery(
  req: ActivityRunsPageRequest
): BuildAndTestExecutionsQuery {
  const filters = (req.filters ?? {}) as BuildAndTestRunsFilters;
  return {
    page: req.page,
    pageSize: req.pageSize,
    statuses: resolveStatuses(req.statuses, filters.statuses),
    ownerPhrase: req.ownerPhrase,
    hidden: false,
    sort: req.sort,
    namePhrase: filters.namePhrase,
    userStoryIds: filters.userStoryIds ? [filters.userStoryIds] : undefined,
    configurationBranchNamePhrase: filters.configurationBranchNamePhrase,
    definitionIds: filters.definitionIds,
    ...toDateRange("startDateRange", filters.startDateRange),
    ...toDateRange("endDateRange", filters.endDateRange),
    ...toDateRange("expiryDateRange", filters.expiryDateRange),
  };
}

/** Maps the backend result page onto the table widget's `{ rows, total }`. */
export function toActivityRunsPage(
  result: BuildAndTestExecutionsQueryResult
): ActivityRunsPage<BuildAndTestExecutionSummary> {
  return { rows: result.content, total: result.totalElements };
}

/**
 * Builds the `loadPage` adapter the {@link ActivityRunsTableComponent} consumes:
 * one backend-paginated `executions/ci-process` call per page (status split +
 * owner filter + sort + column filters), reusing the shared executions service
 * (no duplicate HTTP client).
 */
export function buildAndTestLoadPage(
  service: BuildAndTestExecutionsService,
  projectId: string
): (
  req: ActivityRunsPageRequest
) => Observable<ActivityRunsPage<BuildAndTestExecutionSummary>> {
  return (req) =>
    service
      .getBuildAndTestExecutions(projectId, toBuildAndTestQuery(req))
      .pipe(map(toActivityRunsPage));
}

/**
 * Narrows the table's status split with the optional Status column filter: when
 * the user selects statuses, only those that fall inside the active/history set
 * are queried, so the column filter never breaks the split.
 */
function resolveStatuses(
  splitStatuses: string[],
  selected: string[] | undefined
): ExecutionStatus[] {
  const base = splitStatuses as ExecutionStatus[];
  if (!selected?.length) {
    return base;
  }
  return base.filter((status) => selected.includes(status));
}

function toDateRange(
  field: "startDateRange" | "endDateRange" | "expiryDateRange",
  range: Date[] | undefined
): Record<string, string> {
  if (!range?.[0] || !range?.[1]) {
    return {};
  }
  return {
    [`${field}Start`]: range[0].toISOString(),
    [`${field}End`]: range[1].toISOString(),
  };
}
