import {
  ExecutionStatus,
  UpgradeProcessInput,
} from "@mxevolve/domains/business-process/util";
import { BusinessProcessOfficialStatus } from "@mxflow/features/business-process";

export class BinaryUpgradeExecutionsQueryResult {
  content: BinaryUpgradeExecutionSummary[];
  totalElements: number;
}

export class BinaryUpgradeExecutionSummary {
  id: string;
  name: string;
  definitionName: string;
  processName: string;
  owner: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  status: ExecutionStatus;
  daysExtended: number;
  officiality: BusinessProcessOfficialStatus;
  input: UpgradeProcessInput;
}
