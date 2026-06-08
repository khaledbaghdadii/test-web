import { UpgradeProcessStage } from "./upgrade-process-stage";

export interface UpgradeProcessTagStage extends UpgradeProcessStage {
  tagName?: string;
  taggedCommitId?: string;
}
