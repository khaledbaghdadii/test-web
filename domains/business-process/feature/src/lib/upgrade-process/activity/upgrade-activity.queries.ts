import { map, Observable } from "rxjs";
import {
  BinaryUpgradeExecutionsQueryRequest,
  BinaryUpgradeExecutionsQueryResult,
  BinaryUpgradeExecutionSummary,
  BusinessProcessDefinition,
  UpgradeProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import type {
  ActivityRunsPage,
  ActivityRunsPageRequest,
} from "@mxevolve/domains/business-process/widget";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import {
  nonEmpty,
  resolveDefinitionIds,
  resolveStatuses,
  toDateRange,
  withoutUndefined,
} from "../../activity-runs/activity-runs-query.utils";

export const UPG_ACTIVE_STATUSES: ExecutionStatus[] = [
  ExecutionStatus.RUNNING,
  ExecutionStatus.PENDING_INPUT,
  ExecutionStatus.ABORTING,
];

export const UPG_HISTORY_STATUSES: ExecutionStatus[] = Object.values(
  ExecutionStatus
).filter((status) => !UPG_ACTIVE_STATUSES.includes(status));

export interface UpgradeRunsFilters {
  namePhrase?: string;
  statuses?: ExecutionStatus[];
  officiality?: string[];
  businessProcessQualityLevel?: string[];
  parentMxArchivalBranchPhrase?: string;
  mxVersionPhrase?: string;
  mxBuildIdPhrase?: string;
  configurationBranchNamePhrase?: string;
  ownerPhrase?: string;
  definitionIds?: string[];
  processNames?: string[];
  startDateRange?: Date[];
  endDateRange?: Date[];
  expiryDateRange?: Date[];
}

export const resolveUpgradeDefinitionIds = resolveDefinitionIds;

export function toUpgradeQuery(
  req: ActivityRunsPageRequest,
  definitions: readonly BusinessProcessDefinition[]
): BinaryUpgradeExecutionsQueryRequest {
  const filters = (req.filters ?? {}) as UpgradeRunsFilters;
  const query: BinaryUpgradeExecutionsQueryRequest = {
    page: req.page,
    pageSize: req.pageSize,
    statuses: resolveStatuses(
      req.statuses as ExecutionStatus[],
      filters.statuses
    ),
    officiality: nonEmpty(filters.officiality),
    businessProcessQualityLevel: nonEmpty(filters.businessProcessQualityLevel),
    namePhrase: filters.namePhrase || undefined,
    parentMxArchivalBranchPhrase:
      filters.parentMxArchivalBranchPhrase || undefined,
    mxVersionPhrase: filters.mxVersionPhrase || undefined,
    mxBuildIdPhrase: filters.mxBuildIdPhrase || undefined,
    configurationBranchNamePhrase:
      filters.configurationBranchNamePhrase || undefined,
    ownerPhrase: filters.ownerPhrase || req.ownerPhrase,
    definitionIds: resolveDefinitionIds(
      definitions,
      filters.definitionIds,
      filters.processNames
    ),
    hidden: false,
    sort: req.sort,
    ...toDateRange("startDateRange", filters.startDateRange),
    ...toDateRange("endDateRange", filters.endDateRange),
    ...toDateRange("expiryDateRange", filters.expiryDateRange),
  };
  return withoutUndefined(query);
}

export function toActivityRunsPage(
  result: BinaryUpgradeExecutionsQueryResult
): ActivityRunsPage<BinaryUpgradeExecutionSummary> {
  return { rows: result.content, total: result.totalElements };
}

export function upgradeLoadPage(
  service: UpgradeProcessListingService,
  projectId: string,
  definitions: readonly BusinessProcessDefinition[]
): (
  req: ActivityRunsPageRequest
) => Observable<ActivityRunsPage<BinaryUpgradeExecutionSummary>> {
  return (req) =>
    service
      .getBinaryUpgradeExecutions(projectId, toUpgradeQuery(req, definitions))
      .pipe(map(toActivityRunsPage));
}
