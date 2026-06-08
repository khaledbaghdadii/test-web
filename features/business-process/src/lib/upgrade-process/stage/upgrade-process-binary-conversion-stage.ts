import { UpgradeProcessStage } from "./upgrade-process-stage";

export interface UpgradeProcessBinaryConversionStage
  extends UpgradeProcessStage {
  actionRequester: string;
  referenceExecutionId: string;
  decision: string;
}
