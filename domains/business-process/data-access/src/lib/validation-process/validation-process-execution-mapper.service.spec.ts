import { TestBed } from "@angular/core/testing";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";
import { ValidationProcessExecutionApiModel } from "./models/validation-process-execution-api-model";
import { ValidationProcessStageStatus } from "./models/stage/validation-process-stage-status";
import {
  ExecutionStatus,
  QualityGateValidationDecision,
} from "@mxevolve/domains/business-process/util";

const buildApiModel = (
  overrides: Partial<ValidationProcessExecutionApiModel> = {}
): ValidationProcessExecutionApiModel => ({
  id: "exec-id",
  name: "exec-name",
  projectId: "proj-id",
  projectName: "proj-name",
  owner: "owner",
  sourceDefinitionId: "src-def-id",
  definitionId: "def-id",
  definitionName: "def-name",
  familyId: "fam-id",
  familyName: "fam-name",
  processName: "proc-name",
  errorMessage: "error",
  startDate: "2024-01-01",
  endDate: "2024-01-02",
  expiryDate: "2024-01-10",
  status: "RUNNING",
  daysExtended: 0,
  officiality: "OFFICIAL",
  hidden: false,
  businessProcessQualityLevel: "MQG",
  input: {
    repositoryId: "repo-id",
    createBranch: true,
    archivalBranchName: "archival-branch",
    parentBranch: "parent-branch",
    scenarioDefinitionIds: ["scenario-1"],
    businessProcessQualityLevel: "MQG",
    finalProductId: "final-product-id",
    qualityGateExecutionInfraGroupId: "infra-group-id",
    configCommitId: "config-commit-id",
    rtpCommitId: "rtp-commit-id",
    nightlyRepusherEnabled: true,
  },
  createBranchStage: {
    name: "Create Branch",
    status: "PASSED",
    startDate: "2024-01-01",
    endDate: "2024-01-01",
    errorMessage: "",
    developmentId: "dev-id",
    headCommitIdUponExecution: "head-commit",
    createdBranch: true,
  },
  executeQualityGatesStage: {
    name: "Execute Quality Gates",
    status: "RUNNING",
    startDate: "2024-01-01",
    endDate: "",
    errorMessage: "",
    validationResult: {
      requester: "user1",
      decision: "VALIDATION_PASSED",
      comment: "Looks good",
    },
  },
  tagArchivalBranchStage: {
    name: "Tag Archival",
    status: "NOT_STARTED",
    startDate: "",
    endDate: "",
    errorMessage: "",
    configTagName: "config-tag",
    configCommitId: "config-commit",
    rtpTagName: "rtp-tag",
    rtpCommitId: "rtp-commit",
    promotedFinalProductId: "promoted-fp",
    promotionSuccessful: false,
    promotionErrorMessage: "",
  },
  integrateFixesStage: {
    name: "Integrate Fixes",
    status: "NOT_STARTED",
    startDate: "",
    endDate: "",
    errorMessage: "",
    latestMergeJobId: "merge-job-id",
    stopActionMaker: "stopper",
    skipActionMaker: "skipper",
    finalProductPublishing: {
      id: "fp-pub-id",
      publishingStartDate: "2024-01-01",
    },
  },
  ...overrides,
});

describe("ValidationProcessExecutionMapperService", () => {
  let service: ValidationProcessExecutionMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValidationProcessExecutionMapperService],
    });
    service = TestBed.inject(ValidationProcessExecutionMapperService);
  });

  describe("input field mapping", () => {
    it("should map repositoryId from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.repositoryId).toBe("repo-id");
    });

    it("should map createBranch from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.createBranch).toBe(true);
    });

    it("should map archivalBranchName from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.archivalBranchName).toBe("archival-branch");
    });

    it("should map parentBranch from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.parentBranch).toBe("parent-branch");
    });

    it("should map finalProductId from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.finalProductId).toBe("final-product-id");
    });

    it("should map qualityGateExecutionInfraGroupId from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.qualityGateExecutionInfraGroupId).toBe(
        "infra-group-id"
      );
    });

    it("should map configCommitId from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.configCommitId).toBe("config-commit-id");
    });

    it("should map rtpCommitId from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.rtpCommitId).toBe("rtp-commit-id");
    });

    it("should map nightlyRepusherEnabled from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.nightlyRepusherEnabled).toBe(true);
    });

    it("should map businessProcessQualityLevel from input", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.input.businessProcessQualityLevel).toBe("MQG");
    });
  });

  describe("execution status mapping", () => {
    it("should map execution status as ExecutionStatus", () => {
      const result = service.toValidationProcessExecution(
        buildApiModel({ status: "RUNNING" })
      );
      expect(result.status).toBe(ExecutionStatus.RUNNING);
    });
  });

  describe("createBranchStage mapping", () => {
    it("should set route to create-branch", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.createBranchStage.route).toBe("create-branch");
    });

    it("should map createBranchStage status PASSED", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.PASSED
      );
    });

    it("should map createBranchStage status FAILED", () => {
      const apiModel = buildApiModel();
      apiModel.createBranchStage.status = "FAILED";
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.FAILED
      );
    });

    it("should map createBranchStage status NOT_STARTED", () => {
      const apiModel = buildApiModel();
      apiModel.createBranchStage.status = "NOT_STARTED";
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.NOT_STARTED
      );
    });

    it("should map createBranchStage status RUNNING", () => {
      const apiModel = buildApiModel();
      apiModel.createBranchStage.status = "RUNNING";
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.RUNNING
      );
    });

    it("should map createBranchStage status PENDING_INPUT", () => {
      const apiModel = buildApiModel();
      apiModel.createBranchStage.status = "PENDING_INPUT";
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.PENDING_INPUT
      );
    });

    it("should map createBranchStage status STOPPED", () => {
      const apiModel = buildApiModel();
      apiModel.createBranchStage.status = "STOPPED";
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.STOPPED
      );
    });

    it("should map createBranchStage status SKIPPED", () => {
      const apiModel = buildApiModel();
      apiModel.createBranchStage.status = "SKIPPED";
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.createBranchStage.status).toBe(
        ValidationProcessStageStatus.SKIPPED
      );
    });
  });

  describe("executeQualityGatesStage mapping", () => {
    it("should set route to execute-quality-gates", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.executeQualityGatesStage.route).toBe(
        "execute-quality-gates"
      );
    });

    it("should map validationResult decision as QualityGateValidationDecision", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.executeQualityGatesStage.validationResult?.decision).toBe(
        QualityGateValidationDecision.VALIDATION_PASSED
      );
    });

    it("should return null validationResult when api model has null validationResult", () => {
      const apiModel = buildApiModel();
      (
        apiModel.executeQualityGatesStage as { validationResult: unknown }
      ).validationResult = null;
      const result = service.toValidationProcessExecution(apiModel);
      expect(result.executeQualityGatesStage.validationResult).toBeNull();
    });
  });

  describe("tagArchivalBranchStage mapping", () => {
    it("should set route to tag-archival", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.tagArchivalBranchStage.route).toBe("tag-archival");
    });

    it("should map tagArchivalBranchStage status", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.tagArchivalBranchStage.status).toBe(
        ValidationProcessStageStatus.NOT_STARTED
      );
    });
  });

  describe("integrateFixesStage mapping", () => {
    it("should set route to integrate-fixes", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.integrateFixesStage.route).toBe("integrate-fixes");
    });

    it("should map stopActionMaker", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.integrateFixesStage.stopActionMaker).toBe("stopper");
    });

    it("should map skipActionMaker", () => {
      const result = service.toValidationProcessExecution(buildApiModel());
      expect(result.integrateFixesStage.skipActionMaker).toBe("skipper");
    });
  });
});
