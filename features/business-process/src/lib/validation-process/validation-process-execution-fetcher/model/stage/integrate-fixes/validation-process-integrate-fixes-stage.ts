import { ValidationProcessStage } from "../validation-process-stage";
import { FinalProductPublishing } from "@mxflow/features/business-process";

export interface ValidationProcessIntegrateFixesStage
  extends ValidationProcessStage {
  latestMergeJobId: string;
  stopActionMaker: string;
  skipActionMaker: string;
  finalProductPublishing: FinalProductPublishing;
}
