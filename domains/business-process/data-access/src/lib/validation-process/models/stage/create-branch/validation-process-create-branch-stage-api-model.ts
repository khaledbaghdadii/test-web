import { ValidationProcessStageApiModel } from "../validation-process-stage-api-model";

export interface ValidationProcessCreateBranchStageApiModel
  extends ValidationProcessStageApiModel {
  developmentId: string;
  headCommitIdUponExecution: string;
  createdBranch: boolean;
}
