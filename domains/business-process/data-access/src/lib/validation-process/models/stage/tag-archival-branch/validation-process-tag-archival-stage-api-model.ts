import { ValidationProcessStageApiModel } from "../validation-process-stage-api-model";
import { ArchivalUserStoriesUpdateStatus } from "./archival-user-stories-update-status";

export interface ValidationProcessTagArchivalBranchStageApiModel
  extends ValidationProcessStageApiModel {
  configTagName: string;
  configCommitId: string;
  rtpTagName: string;
  rtpCommitId: string;
  promotedFinalProductId: string;
  promotionSuccessful: boolean;
  promotionErrorMessage: string;
  archivalUserStoriesUpdateStatus?: ArchivalUserStoriesUpdateStatus;
}
