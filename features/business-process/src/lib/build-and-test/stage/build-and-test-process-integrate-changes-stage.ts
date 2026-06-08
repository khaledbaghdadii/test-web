import { BuildAndTestProcessStage } from "./build-and-test-process-stage";
import { FinalProductPublishing } from "../../../index";

export interface BuildAndTestProcessIntegrateChangesStage
  extends BuildAndTestProcessStage {
  latestMergeJobId: string;
  requester: string;
  backportRequested: boolean;
  willPublishFinalProduct: boolean;
  backportStopRequester?: string;
  canStopBackport: boolean;
  backportExecutions: string[];
  failedBackportDefinitions: string[];
  backports: Backport[];
  finalProductPublishing: FinalProductPublishing;
  backportMergeConfigurationIds: string[];
}

export interface Backport {
  mergeConfigurationId?: string;
  startDate: string;
  endDate: string;
  willPublishFinalProduct: boolean;
  initializeDevelopmentState: InitializeDevelopmentState;
  applyBackportDevelopmentState: ApplyBackportDevelopmentState;
  mergeDevelopmentState: MergeDevelopmentState;
  finalProductPublishing: FinalProductPublishing;
}

export interface InitializeDevelopmentState {
  startDate: string;
  endDate: string;
  destinationBranchName: string;
  cherryPickBranchName: string;
  developmentId: string;
}

export interface ApplyBackportDevelopmentState {
  startDate: string;
  endDate: string;
  requester: string;
  cherryPickStatus: CherryPickStatus;
}

export interface MergeDevelopmentState {
  startDate: string;
  endDate: string;
  latestMergeJobId: string;
  requester: string;
  mergeJobIds: string[];
  canRepush: boolean;
}

export enum CherryPickStatus {
  AUTOMATIC_CHERRY_PICK_IN_PROGRESS = "automatic-cherry-pick-in-progress",
  AUTOMATIC_CHERRY_PICK_FAILED = "automatic-cherry-pick-failed",
  COMMITS_CHERRY_PICKED = "commits-cherry-picked",
}
