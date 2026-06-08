import { ValidationProcessStageApiModel } from "../validation-process-stage-api-model";
import { FinalProductPublishingApiModal } from "@mxflow/features/business-process";

export interface ValidationProcessIntegrateFixesStageApiModel
  extends ValidationProcessStageApiModel {
  latestMergeJobId: string;
  stopActionMaker: string;
  skipActionMaker: string;
  finalProductPublishing: FinalProductPublishingApiModal;
}
