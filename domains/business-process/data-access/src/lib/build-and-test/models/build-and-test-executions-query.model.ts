import { ExecutionStatus } from "@mxevolve/domains/business-process/util";

export interface BuildAndTestExecutionsQuery {
  readonly ids?: string[];
  readonly page?: number;
  readonly pageSize?: number;
  readonly definitionIds?: string[];
  readonly userStoryIds?: string[];
  readonly statuses?: ExecutionStatus[];
  readonly hidden?: boolean;
  readonly configurationBranchNamePhrase?: string;
  readonly ownerPhrase?: string;
  readonly startDateRangeStart?: string;
  readonly startDateRangeEnd?: string;
  readonly endDateRangeStart?: string;
  readonly endDateRangeEnd?: string;
  readonly expiryDateRangeStart?: string;
  readonly expiryDateRangeEnd?: string;
  readonly namePhrase?: string;
  readonly sort?: string;
}

export interface BuildAndTestExecutionsQueryResult {
  readonly content: BuildAndTestExecutionSummary[];
  readonly totalElements: number;
}

export interface BuildAndTestExecutionSummary {
  readonly id: string;
  readonly name?: string;
  readonly owner?: string;
  readonly status?: ExecutionStatus;
  readonly endDate?: string;
  readonly startDate?: string;
  readonly expiryDate?: string;
  readonly daysExtended?: number;
  readonly configurationBranchName?: string;
  readonly businessProcessDefinitionName?: string;
  readonly processName?: string;
  readonly userStoryIds?: string[];
}
