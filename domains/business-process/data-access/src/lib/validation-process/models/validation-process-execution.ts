import { ValidationProcessExecutionInput } from "./validation-process-execution-input";
import { ValidationProcessCreateBranchStage } from "./stage/create-branch/validation-process-create-branch-stage";
import { ValidationProcessTagArchivalStage } from "./stage/tag-archival-branch/validation-process-tag-archival-stage";
import { ValidationProcessIntegrateFixesStage } from "./stage/integrate-fixes/validation-process-integrate-fixes-stage";
import { ValidationProcessExecuteQualityGateStage } from "./stage/execute-quality-gate/validation-process-execute-quality-gate-stage";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";

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
  description?: string;
  hidden: boolean;
  errorMessage: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  notificationsRecipients?: string[];
  businessProcessQualityLevel: string;
  officiality: string;
  daysExtended: number;
  status: ExecutionStatus;
  input: ValidationProcessExecutionInput;
  createBranchStage: ValidationProcessCreateBranchStage;
  executeQualityGatesStage: ValidationProcessExecuteQualityGateStage;
  tagArchivalBranchStage: ValidationProcessTagArchivalStage;
  integrateFixesStage: ValidationProcessIntegrateFixesStage;
}
