import { ValidationProcessStageApiModel } from "../validation-process-stage-api-model";
import { FinalProductPublishing } from "./final-product-publishing";

export interface ValidationProcessIntegrateFixesStageApiModel
  extends ValidationProcessStageApiModel {
  latestMergeJobId: string;
  stopActionMaker: string;
  skipActionMaker: string;
  finalProductPublishing: FinalProductPublishing;
}
