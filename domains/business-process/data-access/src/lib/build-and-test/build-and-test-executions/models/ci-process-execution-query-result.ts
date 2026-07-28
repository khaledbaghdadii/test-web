import { BusinessProcessExecutionStatus } from "@mxflow/features/business-process";

export class CiProcessExecutionsQueryResult {
  content: CiProcessExecutionSummary[];
  totalElements: number;
}
export class CiProcessExecutionSummary {
  id: string;
  name: string;
  owner: string;
  status: BusinessProcessExecutionStatus;
  endDate: string;
  startDate: string;
  expiryDate: string;
  daysExtended?: number;
  configurationBranchName: string;
  businessProcessDefinitionName: string;
  processName: string;
  userStoryIds: string[];
}
