import { BusinessProcessExecutionStatus } from "@mxflow/features/business-process";

export interface CiProcessExecutionsQueryResultApiModel {
  content: CiProcessExecutionSummaryApiModel[];
  totalElements: number;
}

export interface CiProcessExecutionSummaryApiModel {
  id: string;
  name: string;
  owner: string;
  status: BusinessProcessExecutionStatus;
  endDate: string;
  startDate: string;
  expiryDate: string;
  daysExtended?: number;
  input: CiProcessInputSummary;
  definitionName: string;
  processName: string;
}

export class CiProcessInputSummary {
  configurationBranchName: string;
  userStoryIds: string[];
}
