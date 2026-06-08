import { ExecutionStatus } from "../execution-status";
import { Stage } from "../stage";

export interface BuildAndTestProcessExecution {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly definitionId: string;
  readonly definitionName: string;
  readonly familyName: string;
  readonly processName: string;
  readonly description?: string;
  readonly owner: string;
  readonly notificationsRecipients?: string[];
  readonly errorMessage?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly expiryDate?: string;
  readonly supportsResourceManagement: boolean;
  readonly hasPredefinedMergeRequestInputs: boolean;
  readonly ciVersion: number;
  readonly source: BuildAndTestSource;
  readonly status: ExecutionStatus;
  readonly input: BuildAndTestProcessExecutionInput;
  readonly createBranchStage: BuildAndTestProcessStage;
  readonly prepareBuildStage: BuildAndTestProcessStage;
  readonly buildAndTestStage: BuildAndTestProcessStage;
  readonly integrateChangesStage: BuildAndTestProcessStage;
}

export interface BuildAndTestProcessExecutionInput {
  readonly repositoryId: string;
  readonly configurationBranchName: string;
  readonly configurationParentBranch: string;
  readonly userStoryIds: string[];
  readonly buildAndTestInfraGroup: string;
  readonly buildEnvironmentInfraGroup: string;
  readonly buildEnvironment: BuildAndTestProcessBuildEnvironmentInput;
}

export interface BuildAndTestProcessBuildEnvironmentInput {
  readonly skipEnvironmentDeployment: boolean;
  readonly scenarioDefinitionId: string;
}

export interface BuildAndTestProcessStage extends Stage {
  readonly route: string;
  readonly developmentId?: string;
  // Latest deploy scenario for the stage (populated on prepareBuildStage). The
  // build/test environment id is resolved indirectly from this scenario, mirroring
  // the legacy `getScenarioExecution(...).environmentId` lookup.
  readonly latestScenarioExecutionId?: string;
  // Build & Test stage-specific fields (additive — populated only on buildAndTestStage).
  readonly readyForBuildAndTest?: boolean;
  readonly cherryPickRunning?: boolean;
  readonly cherryPickFailed?: boolean;
  readonly technicalReseedExecutionGroupId?: string;
  readonly scenarioExecutionGroup?: string;
  // Integrate Changes stage-specific fields (populated only on integrateChangesStage).
  readonly latestMergeJobId?: string;
  readonly requester?: string;
  readonly backportRequested?: boolean;
  readonly willPublishFinalProduct?: boolean;
  readonly finalProductPublishing?: FinalProductPublishing;
  readonly backportStopRequester?: string;
  readonly canStopBackport?: boolean;
  readonly backportExecutions?: string[];
  readonly failedBackportDefinitions?: string[];
  readonly backports?: BuildAndTestBackport[];
  readonly backportMergeConfigurationIds?: string[];
}

export interface FinalProductPublishing {
  readonly id?: string;
  readonly publishingStartDate?: string;
  readonly publishingEndDate?: string;
  readonly finalProductFailure?: FinalProductFailure | string;
}

export enum FinalProductFailure {
  FAILURE_PRE_PUBLISHING_REQUESTED = "FAILURE_PRE_PUBLISHING_REQUESTED",
}

export interface BuildAndTestBackport {
  readonly mergeConfigurationId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly willPublishFinalProduct?: boolean;
  readonly initializeDevelopmentState: InitializeDevelopmentState;
  readonly applyBackportDevelopmentState: ApplyBackportDevelopmentState;
  readonly mergeDevelopmentState: MergeDevelopmentState;
  readonly finalProductPublishing?: FinalProductPublishing;
}

export interface InitializeDevelopmentState {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly destinationBranchName?: string;
  readonly cherryPickBranchName?: string;
  readonly developmentId?: string;
}

export interface ApplyBackportDevelopmentState {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly requester?: string;
  readonly cherryPickStatus?: CherryPickStatus | string;
}

export interface MergeDevelopmentState {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly latestMergeJobId?: string;
  readonly requester?: string;
  readonly mergeJobIds?: string[];
  readonly canRepush?: boolean;
}

export enum CherryPickStatus {
  AUTOMATIC_CHERRY_PICK_IN_PROGRESS = "automatic-cherry-pick-in-progress",
  AUTOMATIC_CHERRY_PICK_FAILED = "automatic-cherry-pick-failed",
  COMMITS_CHERRY_PICKED = "commits-cherry-picked",
}

export interface BuildAndTestSource {
  readonly id: string;
  readonly type: BuildAndTestSourceType;
}

export enum BuildAndTestSourceType {
  BUSINESS_PROCESS = "BUSINESS_PROCESS",
  USER = "USER",
}
