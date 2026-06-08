import { BuildAndTestProcessExecutionInput } from "../../stage/build-and-test-process-execution-input";
import { Backport } from "../../stage/build-and-test-process-integrate-changes-stage";
import { FinalProductPublishing } from "../../../final-product-publishing/model/final-product-publishing";
import { BuildAndTestSource } from "../../build-and-test-process-execution";

export class BuildAndTestProcessExecutionApiModel {
  id: string;
  name: string;
  projectId: string;
  definitionId: string;
  owner: string;
  errorMessage?: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  supportsResourceManagement: boolean;
  hasPredefinedMergeRequestInputs: boolean;
  notificationsRecipients?: string[];
  status: string;
  ciVersion: number;
  source: BuildAndTestSource;
  input: BuildAndTestProcessExecutionInput;
  createBranchStage: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    errorMessage?: string;
    createBranch: boolean;
    repositoryId: string;
    developmentId: string;
  };
  prepareBuildStage: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    errorMessage?: string;
    requester: string;
    latestScenarioExecutionId?: string;
  };
  buildAndTestStage: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    errorMessage?: string;
    requester: string;
    scenarioExecutionGroup: string | null;
    technicalReseedExecutionGroupId: string | null;
    readyForBuildAndTest: boolean;
    cherryPickRunning: boolean;
    cherryPickFailed: boolean;
  };
  integrateChangesStage: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    errorMessage?: string;
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
  };
}
