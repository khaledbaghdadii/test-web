import { ValidationProcessStage } from "../validation-process-stage";

export interface ValidationProcessCreateBranchStage
  extends ValidationProcessStage {
  developmentId: string;
  headCommitIdUponExecution: string;
  createdBranch: boolean;
}
