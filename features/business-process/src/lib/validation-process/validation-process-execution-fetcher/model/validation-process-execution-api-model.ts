import { ValidationProcessExecutionInputApiModel } from "./validation-process-execution-input-api-model";
import { ValidationProcessCreateBranchStageApiModel } from "./stage/create-branch/validation-process-create-branch-stage-api-model";
import { ValidationProcessIntegrateFixesStageApiModel } from "./stage/integrate-fixes/validation-process-integrate-fixes-stage-api-model";
import { ValidationProcessTagArchivalBranchStageApiModel } from "./stage/tag-archival-branch/validation-process-tag-archival-stage-api-model";
import { ValidationProcessExecuteQualityGatesStageApiModel } from "./stage/execute-quality-gate/validation-process-execute-quality-gates-stage-api-model";
import { BusinessProcessOfficialStatus } from "../../../business-process-official-status/business-process-official-status";

export interface ValidationProcessExecutionApiModel {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  owner: string;
  sourceDefinitionId: string;
  definitionId: string;
  definitionName: string;
  familyId: string;
  familyName: string;
  processName: string;
  errorMessage: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  status: string;
  notificationsRecipients?: string[];
  input: ValidationProcessExecutionInputApiModel;
  createBranchStage: ValidationProcessCreateBranchStageApiModel;
  executeQualityGatesStage: ValidationProcessExecuteQualityGatesStageApiModel;
  tagArchivalBranchStage: ValidationProcessTagArchivalBranchStageApiModel;
  integrateFixesStage: ValidationProcessIntegrateFixesStageApiModel;
  daysExtended: number;
  officiality: BusinessProcessOfficialStatus;
  hidden: boolean;
  businessProcessQualityLevel: string;
}
