import { map, Observable } from "rxjs";
import {
  BusinessProcessDefinition,
  ValidationProcessExecution,
  ValidationProcessExecutionsQueryRequest,
  ValidationProcessExecutionsQueryResponse,
  ValidationProcessListingService,
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

export const VAL_ACTIVE_STATUSES: ExecutionStatus[] = [
  ExecutionStatus.RUNNING,
  ExecutionStatus.PENDING_INPUT,
  ExecutionStatus.ABORTING,
];

export const VAL_HISTORY_STATUSES: ExecutionStatus[] = Object.values(
  ExecutionStatus
).filter((status) => !VAL_ACTIVE_STATUSES.includes(status));

export interface ValidationRunsFilters {
  namePhrase?: string;
  statuses?: ExecutionStatus[];
  officiality?: string[];
  businessProcessQualityLevel?: string[];
  ownerPhrase?: string;
  definitionIds?: string[];
  processNames?: string[];
  startDateRange?: Date[];
  endDateRange?: Date[];
  expiryDateRange?: Date[];
}

export const resolveValidationDefinitionIds = resolveDefinitionIds;

export function toValidationQuery(
  req: ActivityRunsPageRequest,
  definitions: readonly BusinessProcessDefinition[]
): ValidationProcessExecutionsQueryRequest {
  const filters = (req.filters ?? {}) as ValidationRunsFilters;
  const query: ValidationProcessExecutionsQueryRequest = {
    page: req.page,
    pageSize: req.pageSize,
    statuses: resolveStatuses(
      req.statuses as ExecutionStatus[],
      filters.statuses
    ),
    officiality: nonEmpty(filters.officiality),
    businessProcessQualityLevel: nonEmpty(filters.businessProcessQualityLevel),
    namePhrase: filters.namePhrase || undefined,
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
  result: ValidationProcessExecutionsQueryResponse
): ActivityRunsPage<ValidationProcessExecution> {
  return { rows: result.executions, total: result.total };
}

export function validationLoadPage(
  service: ValidationProcessListingService,
  projectId: string,
  definitions: readonly BusinessProcessDefinition[]
): (
  req: ActivityRunsPageRequest
) => Observable<ActivityRunsPage<ValidationProcessExecution>> {
  return (req) =>
    service
      .getValidationProcessExecutions(
        projectId,
        toValidationQuery(req, definitions)
      )
      .pipe(map(toActivityRunsPage));
}
