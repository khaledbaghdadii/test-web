import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";
import { ValidationProcessExecution } from "./model/validation-process-execution";
import { ValidationProcessStage } from "./model/stage/validation-process-stage";
import { ValidationProcessExecutionStageStatus } from "./model/stage/validation-process-execution-stage-status";
import { ValidationProcessExecutionApiModel } from "./model/validation-process-execution-api-model";
import { Stage, StageStatus } from "@mxflow/ui/horizontal-timeline";
import {
  BusinessProcessExecutionStatus,
  QualityGateValidationDecision,
} from "@mxflow/features/business-process";

const validationExecution: ValidationProcessExecution = {
  id: "id",
  name: "name",
  status: BusinessProcessExecutionStatus.PASSED,
  notificationsRecipients: ["recipient1", "recipient2"],
  startDate: "startDate",
  endDate: "endDate",
  errorMessage: "errorMessage",
  definitionId: "definitionId",
  definitionName: "definitionName",
  processName: "processName",
  expiryDate: "expiryDate",
  owner: "owner",
  projectId: "projectId",
  input: {
    archivalBranchName: "archivalBranchName",
    createBranch: true,
    parentBranch: "parentBranchName",
    repositoryId: "repoId",
    scenarioDefinitionIds: ["scenarioDefinitionId"],
    businessProcessQualityLevel: "businessProcessQualityLevel",
    finalProductId: "finalProductId",
    configCommitId: "configCommitId",
    rtpCommitId: "rtpCommitId",
    nightlyRepusherEnabled: true,
    qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
  },
  createBranchStage: {
    name: "create branch stage",
    status: ValidationProcessExecutionStageStatus.PASSED,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    route: "create-branch",
    developmentId: "developmentId",
    createdBranch: true,
    headCommitIdUponExecution: "parentCommitId",
  },
  executeQualityGatesStage: {
    name: "run test suite stage",
    status: ValidationProcessExecutionStageStatus.FAILED,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    validationResult: {
      requester: "requester",
      comment: "comment",
      decision: QualityGateValidationDecision.PASSED,
    },
    route: "execute-quality-gates",
  },
  tagArchivalBranchStage: {
    name: "tag archival stage",
    status: ValidationProcessExecutionStageStatus.PENDING_INPUT,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    route: "tag-archival",
    configTagName: "configTagName",
    configCommitId: "configCommitId",
    rtpTagName: "rtpTagName",
    rtpCommitId: "rtpCommitId",
    promotionSuccessful: true,
    promotedFinalProductId: "latestFinalProductId",
    promotionErrorMessage: "promotionErrorMessage",
    archivalUserStoriesUpdateStatus: {
      startDate: "startDate",
      facedTechnicalIssues: false,
      result: [{ userStoryId: "issueId", updated: false }],
    },
  },
  integrateFixesStage: {
    name: "integrate fixes stage",
    status: ValidationProcessExecutionStageStatus.STOPPED,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    route: "integrate-fixes",
    latestMergeJobId: "latestMergeJobId",
    stopActionMaker: "requester",
    skipActionMaker: "requester",
    finalProductPublishing: {
      id: "newFinalProductId",
      publishingStartDate: "startDate",
      publishingEndDate: "startDate",
      finalProductFailure: "finalProductFailure",
    },
  },
};

const masterValidationExecutionApiModel: ValidationProcessExecutionApiModel = {
  id: "id",
  name: "name",
  status: "PASSED",
  notificationsRecipients: ["recipient1", "recipient2"],
  startDate: "startDate",
  endDate: "endDate",
  definitionId: "definitionId",
  definitionName: "definitionName",
  processName: "processName",
  errorMessage: "errorMessage",
  owner: "owner",
  expiryDate: "expiryDate",
  projectId: "projectId",
  input: {
    archivalBranchName: "archivalBranchName",
    createBranch: true,
    parentBranch: "parentBranchName",
    repositoryId: "repoId",
    scenarioDefinitionIds: ["scenarioDefinitionId"],
    businessProcessQualityLevel: "businessProcessQualityLevel",
    finalProductId: "finalProductId",
    configCommitId: "configCommitId",
    rtpCommitId: "rtpCommitId",
    nightlyRepusherEnabled: true,
    qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
  },
  createBranchStage: {
    name: "create branch stage",
    status: "PASSED",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    createdBranch: true,
    developmentId: "developmentId",
    headCommitIdUponExecution: "parentCommitId",
  },
  executeQualityGatesStage: {
    name: "run test suite stage",
    status: "FAILED",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    validationResult: {
      requester: "requester",
      comment: "comment",
      decision: "VALIDATION_PASSED",
    },
  },
  tagArchivalBranchStage: {
    name: "tag archival stage",
    status: "PENDING_INPUT",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    configTagName: "configTagName",
    configCommitId: "configCommitId",
    rtpTagName: "rtpTagName",
    rtpCommitId: "rtpCommitId",
    promotionSuccessful: true,
    promotedFinalProductId: "latestFinalProductId",
    promotionErrorMessage: "promotionErrorMessage",
    archivalUserStoriesUpdateStatus: {
      startDate: "startDate",
      facedTechnicalIssues: false,
      result: [{ userStoryId: "issueId", updated: false }],
    },
  },
  integrateFixesStage: {
    name: "integrate fixes stage",
    status: "STOPPED",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    latestMergeJobId: "latestMergeJobId",
    stopActionMaker: "requester",
    skipActionMaker: "requester",
    finalProductPublishing: {
      id: "newFinalProductId",
      publishingStartDate: "startDate",
      publishingEndDate: "startDate",
      finalProductFailure: "finalProductFailure",
    },
  },
};

const masterValidationTimelineStages: Stage[] = [
  {
    name: "create branch stage",
    status: StageStatus.PASSED,
    startDate: "startDate",
    endDate: "endDate",
  },
  {
    name: "run test suite stage",
    status: StageStatus.FAILED,
    startDate: "startDate",
    endDate: "endDate",
  },
  {
    name: "tag archival stage",
    status: StageStatus.PENDING_INPUT,
    startDate: "startDate",
    endDate: "endDate",
  },
  {
    name: "integrate fixes stage",
    status: StageStatus.STOPPED,
    startDate: "startDate",
    endDate: "endDate",
  },
];

describe("Master Validation Execution Mapper Service Test", () => {
  let masterValidationExecutionMapperService: ValidationProcessExecutionMapperService;

  beforeEach(() => {
    masterValidationExecutionMapperService =
      new ValidationProcessExecutionMapperService();
  });

  it("should map the master validation execution api model correctly", () => {
    expect(
      masterValidationExecutionMapperService.toMasterValidationExecution(
        masterValidationExecutionApiModel
      )
    ).toStrictEqual(validationExecution);
  });

  it("should map the master validation execution stages to timeline stages correctly", () => {
    expect(
      masterValidationExecutionMapperService.toTimelineStages(
        getMasterValidationStage(validationExecution)
      )
    ).toStrictEqual(masterValidationTimelineStages);
  });

  it("should map the master validation stage to timeline stage correctly", () => {
    expect(
      masterValidationExecutionMapperService.toTimelineStage(
        validationExecution.createBranchStage
      )
    ).toStrictEqual(masterValidationTimelineStages[0]);
  });
});

function getMasterValidationStage(
  masterValidationExecution: ValidationProcessExecution
): ValidationProcessStage[] {
  return [
    masterValidationExecution.createBranchStage,
    masterValidationExecution.executeQualityGatesStage,
    masterValidationExecution.tagArchivalBranchStage,
    masterValidationExecution.integrateFixesStage,
  ];
}
