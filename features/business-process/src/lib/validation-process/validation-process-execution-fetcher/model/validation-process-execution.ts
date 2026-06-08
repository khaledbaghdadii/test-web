import { ValidationProcessExecutionInput } from "./validation-process-execution-input";
import { ValidationProcessCreateBranchStage } from "./stage/create-branch/validation-process-create-branch-stage";
import { ValidationProcessTagArchivalStage } from "./stage/tag-archival-branch/validation-process-tag-archival-stage";
import { ValidationProcessIntegrateFixesStage } from "./stage/integrate-fixes/validation-process-integrate-fixes-stage";
import {
  BusinessProcessExecutionStatus,
  BusinessProcessOfficialStatus,
} from "@mxflow/features/business-process";
import { ValidationProcessExecuteQualityGateStage } from "./stage/execute-quality-gate/validation-process-execute-quality-gate-stage";

export interface ValidationProcessExecution {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  sourceDefinitionId: string;
  owner: string;
  familyId: string;
  familyName: string;
  definitionId: string;
  definitionName: string;
  processName: string;
  hidden: boolean;
  errorMessage: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  notificationsRecipients?: string[];
  businessProcessQualityLevel: string;
  officiality: BusinessProcessOfficialStatus;
  daysExtended: number;
  status: BusinessProcessExecutionStatus;
  input: ValidationProcessExecutionInput;
  createBranchStage: ValidationProcessCreateBranchStage;
  executeQualityGatesStage: ValidationProcessExecuteQualityGateStage;
  tagArchivalBranchStage: ValidationProcessTagArchivalStage;
  integrateFixesStage: ValidationProcessIntegrateFixesStage;
}
