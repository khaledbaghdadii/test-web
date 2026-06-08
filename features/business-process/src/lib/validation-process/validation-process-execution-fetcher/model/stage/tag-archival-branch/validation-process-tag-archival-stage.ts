import { ValidationProcessStage } from "../validation-process-stage";
import { ArchivalUserStoriesUpdateStatus } from "./archival-user-stories-update-status";

export interface ValidationProcessTagArchivalStage
  extends ValidationProcessStage {
  configTagName: string;
  configCommitId: string;
  rtpTagName: string;
  rtpCommitId: string;
  promotedFinalProductId: string;
  promotionSuccessful: boolean;
  promotionErrorMessage: string;
  archivalUserStoriesUpdateStatus?: ArchivalUserStoriesUpdateStatus;
}
