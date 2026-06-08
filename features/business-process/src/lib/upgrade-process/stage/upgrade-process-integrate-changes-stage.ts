import { UpgradeProcessStage } from "./upgrade-process-stage";

export interface UpgradeProcessIntegrateChangesStage
  extends UpgradeProcessStage {
  requester?: string;
  latestMergeJobId?: string;
}
