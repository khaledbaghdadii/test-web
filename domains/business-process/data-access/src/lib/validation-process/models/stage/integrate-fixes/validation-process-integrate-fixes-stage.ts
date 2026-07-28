import { ValidationProcessStage } from "../validation-process-stage";
import { FinalProductPublishing } from "./final-product-publishing";

export interface ValidationProcessIntegrateFixesStage
  extends ValidationProcessStage {
  latestMergeJobId: string;
  stopActionMaker: string;
  skipActionMaker: string;
  finalProductPublishing: FinalProductPublishing;
}
