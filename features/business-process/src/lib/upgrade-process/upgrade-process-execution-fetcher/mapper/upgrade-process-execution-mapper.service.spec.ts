import { UpgradeProcessExecutionMapper } from "./upgrade-process-execution-mapper.service";
import { UpgradeProcessExecutionApiModel } from "./upgrade-process-execution-api-model";
import { BusinessProcessExecutionStatus } from "../../../business-process-execution-status/business-process-execution-status";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { QualityGateValidationDecision } from "../../../quality-gate-validation/quality-gate-validation-result";

describe("UpgradeProcessExecutionMapper", () => {
  let mapper: UpgradeProcessExecutionMapper;

  beforeEach(() => {
    mapper = new UpgradeProcessExecutionMapper();
  });

  function createApiModel(): UpgradeProcessExecutionApiModel {
    return {
      id: "exec-1",
      name: "Execution 1",
      definitionName: "My Definition",
      familyName: "Upgrade Process",
      processName: "Continuous RTP Greening",
      description: "A description",
      startDate: "2025-01-01",
      endDate: "2025-01-02",
      expiryDate: "2025-02-01",
      status: "RUNNING",
      projectId: "project-1",
      definitionId: "def-1",
      supportsResourceManagement: true,
      notificationsRecipients: ["user@example.com"],
      errorMessage: undefined,
      officiality: "OFFICIAL",
      input: {
        factoryProductId: "fp-1",
        mxVersion: "3.1.64",
        mxBuildId: "build-1",
        bipVersion: "2.0.1",
        bipBuildId: "bip-1",
        parentMxArchivalBranch: "archival/main",
        upgradeJump: "Continuous Greening",
        repositoryId: "repo-1",
        configurationBranchName: "config/branch",
        configurationParentBranch: "config/parent",
        createBranch: true,
        qualityGateExecutionInfraGroupId: "infra-qg",
        binaryConversionInfraGroupId: "infra-bc",
        testScenarioIds: ["s1", "s2"],
        binaryConversionTestScenarioId: "s3",
        referenceCommitId: "commit-1",
        referenceFactoryProductId: "rfp-1",
        referenceMxVersion: "3.0.0",
        referenceMxBuildId: "rbuild-1",
        referenceBipVersion: "1.0.0",
        referenceBipBuildId: "rbip-1",
        referenceEnvironmentDefinitionId: "env-def-1",
        referenceEnvironmentInfraGroupId: "env-infra-1",
        businessProcessQualityLevel: "MQG",
      },
      createBranchStage: {
        name: "Create Branch",
        status: "PASSED",
        startDate: "2025-01-01T01:00:00Z",
        endDate: "2025-01-01T02:00:00Z",
        errorMessage: undefined,
        developmentId: "dev-1",
        createBranch: true,
        repositoryId: "repo-1",
        lastCommitId: "commit-abc",
      },
      binaryConversionStage: {
        name: "Binary Conversion",
        status: "RUNNING",
        startDate: "2025-01-01T02:00:00Z",
        endDate: undefined,
        errorMessage: undefined,
        actionRequester: "user1",
        referenceExecutionId: "ref-exec-1",
        decision: "PROCEED",
      },
      executeQualityGateStage: {
        name: "Execute Quality Gate",
        status: "NOT_STARTED",
        startDate: undefined,
        endDate: undefined,
        errorMessage: undefined,
        validationResult: {
          decision: QualityGateValidationDecision.PASSED,
          comment: "Looks good",
          requester: "reviewer1",
        },
      },
      tagUpgradeBranchStage: {
        name: "Tag Upgrade Branch",
        status: "NOT_STARTED",
        startDate: undefined,
        endDate: undefined,
        errorMessage: undefined,
        tagName: "v3.1.64",
        taggedCommitId: "tag-commit-1",
      },
      integrateChangesStage: {
        name: "Integrate Changes",
        status: "NOT_STARTED",
        startDate: undefined,
        endDate: undefined,
        errorMessage: undefined,
        requester: "user2",
        latestMergeJobId: "merge-1",
      },
      referenceEnvironmentDeployment: {
        supported: true,
        enabledInCurrentlyActiveStage: true,
        limitReached: false,
        canCleanAndDeploy: true,
        referenceEnvironments: ["env-1", "env-2"],
        requestIds: ["req-1"],
      },
    };
  }

  it("maps definitionName from API model", () => {
    const result = mapper.map(createApiModel());

    expect(result.definitionName).toBe("My Definition");
  });

  it("maps familyName from API model", () => {
    const result = mapper.map(createApiModel());

    expect(result.familyName).toBe("Upgrade Process");
  });

  it("maps processName from API model", () => {
    const result = mapper.map(createApiModel());

    expect(result.processName).toBe("Continuous RTP Greening");
  });

  it("maps status as BusinessProcessExecutionStatus", () => {
    const result = mapper.map(createApiModel());

    expect(result.status).toBe(BusinessProcessExecutionStatus.RUNNING);
  });

  it("maps input with all fields including upgradeJump and businessProcessQualityLevel", () => {
    const result = mapper.map(createApiModel());

    expect(result.input.upgradeJump).toBe("Continuous Greening");
    expect(result.input.businessProcessQualityLevel).toBe("MQG");
  });

  it("maps createBranchStage with route", () => {
    const result = mapper.map(createApiModel());

    expect(result.createBranchStage.route).toBe("create-branch");
    expect(result.createBranchStage.status).toBe(StageStatus.PASSED);
    expect(result.createBranchStage.developmentId).toBe("dev-1");
  });

  it("maps binaryConversionStage with route", () => {
    const result = mapper.map(createApiModel());

    expect(result.binaryConversionStage.route).toBe("run-technical-upgrade");
    expect(result.binaryConversionStage.status).toBe(StageStatus.RUNNING);
    expect(result.binaryConversionStage.referenceExecutionId).toBe(
      "ref-exec-1"
    );
  });

  it("maps executeQualityGateStage with route", () => {
    const result = mapper.map(createApiModel());

    expect(result.executeQualityGateStage.route).toBe("run-rtp");
    expect(result.executeQualityGateStage.status).toBe(StageStatus.NOT_STARTED);
    expect(result.executeQualityGateStage.validationResult?.decision).toBe(
      QualityGateValidationDecision.PASSED
    );
  });

  it("maps tagStage with route from tagUpgradeBranchStage", () => {
    const result = mapper.map(createApiModel());

    expect(result.tagStage.route).toBe("tag-upgrade-branch");
    expect(result.tagStage.tagName).toBe("v3.1.64");
  });

  it("maps integrateChangesStage with route", () => {
    const result = mapper.map(createApiModel());

    expect(result.integrateChangesStage.route).toBe("integrate-fixes");
    expect(result.integrateChangesStage.latestMergeJobId).toBe("merge-1");
  });

  it("maps referenceEnvironmentDeployment with projectId and processId", () => {
    const result = mapper.map(createApiModel());

    expect(result.referenceEnvironmentDeployment.projectId).toBe("project-1");
    expect(result.referenceEnvironmentDeployment.processId).toBe("exec-1");
    expect(result.referenceEnvironmentDeployment.supported).toBe(true);
  });
});
