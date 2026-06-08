import { BusinessProcessExecutionStatus } from "../../business-process-execution-status/business-process-execution-status";
import { BusinessProcessOfficialStatus } from "../../business-process-official-status/business-process-official-status";

export interface BusinessProcessExecution {
  id: string;
  name: string;
  definitionId: string;
  definitionName: string | null;
  startDate: string;
  endDate: string;
  expiryDate: string;
  daysExtended: number;
  status: BusinessProcessExecutionStatus;
  familyId: string;
  owner: string;
  officiality: BusinessProcessOfficialStatus;
}
