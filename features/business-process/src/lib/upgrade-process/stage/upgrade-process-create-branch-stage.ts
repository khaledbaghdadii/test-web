import { UpgradeProcessStage } from "./upgrade-process-stage";

export interface UpgradeProcessCreateBranchStage extends UpgradeProcessStage {
  developmentId: string;
  createBranch: boolean;
  repositoryId: string;
  lastCommitId?: string;
}
