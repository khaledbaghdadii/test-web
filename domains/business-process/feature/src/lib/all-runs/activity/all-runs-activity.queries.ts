import { defer, map, Observable, shareReplay } from "rxjs";
import {
  AllExecutionSummary,
  AllExecutionsService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import type {
  ActivityRunsPage,
  ActivityRunsPageRequest,
} from "@mxevolve/domains/business-process/widget";

export const ALL_RUNS_ACTIVE_STATUSES: ExecutionStatus[] = [
  ExecutionStatus.RUNNING,
  ExecutionStatus.PENDING_INPUT,
  ExecutionStatus.ABORTING,
];

export const ALL_RUNS_HISTORY_STATUSES: ExecutionStatus[] = Object.values(
  ExecutionStatus
).filter((status) => !ALL_RUNS_ACTIVE_STATUSES.includes(status));

export interface AllRunsFilters {
  namePhrase?: string;
  statuses?: string[];
  officiality?: string[];
  ownerPhrase?: string;
  startDateRange?: Date[];
  endDateRange?: Date[];
  expiryDateRange?: Date[];
  businessProcessDefinitionNamePhrase?: string;
}

export function allRunsLoadPage(
  service: AllExecutionsService,
  projectId: string
): (
  req: ActivityRunsPageRequest
) => Observable<ActivityRunsPage<AllExecutionSummary>> {
  const executions$ = defer(() => service.getAllExecutions(projectId)).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  return (req) => executions$.pipe(map((rows) => toAllRunsPage(rows, req)));
}

export function toAllRunsPage(
  rows: AllExecutionSummary[],
  req: ActivityRunsPageRequest
): ActivityRunsPage<AllExecutionSummary> {
  const filters = (req.filters ?? {}) as AllRunsFilters;
  const selectedStatuses = toStringArray(filters.statuses);
  const selectedOfficialities = toStringArray(filters.officiality);
  const allowedStatuses = new Set(req.statuses);
  const ownerPhrase = filters.ownerPhrase || req.ownerPhrase;

  const filteredRows = rows.filter((row) => {
    const status = row.status ?? ExecutionStatus.NA;
    return (
      allowedStatuses.has(status) &&
      (!selectedStatuses.length || selectedStatuses.includes(status)) &&
      (!selectedOfficialities.length ||
        selectedOfficialities.includes(row.officiality ?? "NA")) &&
      matchesText(row.name, filters.namePhrase) &&
      matchesText(row.owner, ownerPhrase) &&
      matchesDateRange(row.startDate, filters.startDateRange) &&
      matchesDateRange(row.endDate, filters.endDateRange) &&
      matchesDateRange(row.expiryDate, filters.expiryDateRange) &&
      matchesText(
        row.businessProcessDefinitionName,
        filters.businessProcessDefinitionNamePhrase
      )
    );
  });

  const sortedRows = sortRows(filteredRows, req.sort);
  const start = req.page * req.pageSize;

  return {
    rows: sortedRows.slice(start, start + req.pageSize),
    total: sortedRows.length,
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function matchesText(value: string | undefined, phrase: string | undefined) {
  if (!phrase) {
    return true;
  }
  return (
    value?.toLocaleLowerCase().includes(phrase.toLocaleLowerCase()) ?? false
  );
}

function matchesDateRange(
  value: string | undefined,
  range: Date[] | undefined
) {
  if (!range?.[0] || !range?.[1]) {
    return true;
  }
  if (!value) {
    return false;
  }
  const timestamp = new Date(value).getTime();
  return (
    Number.isFinite(timestamp) &&
    timestamp >= range[0].getTime() &&
    timestamp <= range[1].getTime()
  );
}

function sortRows(
  rows: AllExecutionSummary[],
  sort: string | undefined
): AllExecutionSummary[] {
  const [field = "startDate", direction = "desc"] = sort?.split(",") ?? [];
  const sortField = field as keyof AllExecutionSummary;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort(
    (left, right) =>
      compareValues(left[sortField], right[sortField]) * multiplier
  );
}

function compareValues(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  const leftText =
    typeof left === "string" || typeof left === "number" ? String(left) : "";
  const rightText =
    typeof right === "string" || typeof right === "number" ? String(right) : "";
  return leftText.localeCompare(rightText, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
