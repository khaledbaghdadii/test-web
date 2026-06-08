import { UpgradeProcessDefinitionExecutorModalComponent } from "./upgrade-process-definition-executor-modal.component";
import { UpgradeProcessDefinitionExecutorService } from "../service/upgrade-process-definition-executor.service";
import { Router } from "@angular/router";
import { ProjectUrlPipe } from "@mxflow/features/project";
import {
  BusinessProcessDefinition,
  ProvidedInput,
} from "@mxflow/features/business-process";
import { v4 as uuidv4 } from "uuid";
import { ExecuteUpgradeProcessDefinitionInputsComponent } from "./inputs/execute-upgrade-process-definition-inputs.component";
import { ExecuteUpgradeProcessDefinitionInputs } from "./inputs/execute-upgrade-process-definition-inputs";
import { ExecuteUpgradeProcessDefinitionRequest } from "../service/execute-upgrade-process-definition-request";
import { of, Subject, throwError } from "rxjs";
import { ExecuteUpgradeProcessDefinitionResponse } from "../service/execute-upgrade-process-definition-response";
import { BINARY_UPGRADE_MFE_PATH } from "@mxflow/config";
import Mock = jest.Mock;

describe("Upgrade process definition executor modal component test", () => {
  const projectId = uuidv4();
  const definitionId = uuidv4();
  const name = uuidv4();
  const conversionFactoryProductId = uuidv4();
  const conversionMxVersion = uuidv4();
  const conversionMxBuildId = uuidv4();
  const conversionBipVersion = uuidv4();
  const conversionBipBuildId = uuidv4();
  const parentMxArchivalBranch = uuidv4();
  const upgradeJump = uuidv4();
  const repositoryId = uuidv4();
  const businessProcessQualityLevel = "MQG";
  const configurationBranchName = uuidv4();
  const configurationParentBranchName = uuidv4();
  const qualityGateExecutionInfraGroupId = uuidv4();
  const binaryConversionInfraGroupId = uuidv4();
  const binaryConversionScenarioDefinitionId = uuidv4();
  const qualityGateScenarioDefinitionIds = [uuidv4(), uuidv4()];
  const referenceCommitId = uuidv4();
  const referenceFactoryProductId = uuidv4();
  const referenceMxVersion = uuidv4();
  const referenceMxBuildId = uuidv4();
  const referenceBipVersion = uuidv4();
  const referenceBipBuildId = uuidv4();
  const referenceEnvironmentDefinitionId = uuidv4();
  const referenceEnvironmentInfraGroupId = uuidv4();
  const upgradeProcessExecutionId = uuidv4();
  const projectIdRoute = uuidv4();
  const errorMessage = uuidv4();
  const notificationsRecipients = [uuidv4(), uuidv4()];

  let service: UpgradeProcessDefinitionExecutorService;
  let router: Router;
  let projectUrlPipe: ProjectUrlPipe;
  let inputComponent: ExecuteUpgradeProcessDefinitionInputsComponent;

  let executeUpgradeProcessDefinitionMock: Mock<any>;

  let component: UpgradeProcessDefinitionExecutorModalComponent;

  beforeEach(() => {
    executeUpgradeProcessDefinitionMock = jest.fn(
      (request: ExecuteUpgradeProcessDefinitionRequest) => {
        expect(request).toBeDefined();
        return of(getExecutionUpgradeProcessDefinitionResponse());
      }
    );

    service = {
      executeUpgradeProcessDefinition: executeUpgradeProcessDefinitionMock,
    } as unknown as UpgradeProcessDefinitionExecutorService;

    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    projectUrlPipe = {
      transform: jest.fn(() => projectIdRoute),
    } as unknown as ProjectUrlPipe;

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getExecuteUpgradeProcessDefinitionInputs: jest.fn(() => getInputs()),
      form: {
        valid: true,
      },
    } as unknown as ExecuteUpgradeProcessDefinitionInputsComponent;

    component = new UpgradeProcessDefinitionExecutorModalComponent(
      service,
      router,
      projectUrlPipe
    );

    component.inputsComponent = inputComponent;
    component.projectId = projectId;
    component.definition = getDefinition();
  });

  describe("Open executor modal", () => {
    it("should set the visible flag to true", () => {
      component.openExecutorModal();

      expect(component.isVisible).toStrictEqual(true);
    });

    it("should initialize the input component with correct project id", () => {
      component.openExecutorModal();

      expect(inputComponent.initializeForm).toHaveBeenCalledWith(
        projectId,
        expect.any(Object)
      );
    });

    it("should initialize the input component with correct provided inputs", () => {
      component.openExecutorModal();

      expect(inputComponent.initializeForm).toHaveBeenCalledWith(
        expect.any(String),
        getProvidedInputs()
      );
    });
  });

  describe("Hide executor modal", () => {
    it("should set the visible flag to false", () => {
      component.isVisible = true;
      component.hideExecutorModal();

      expect(component.isVisible).toStrictEqual(false);
    });

    it("should reset the form", () => {
      component.isVisible = true;
      component.hideExecutorModal();

      expect(inputComponent.resetForm).toHaveBeenCalled();
    });
  });

  describe("Execute upgrade definition", () => {
    it("should not execute the definition if the form is not valid", () => {
      component.inputsComponent = {
        form: {
          valid: false,
        },
      } as unknown as ExecuteUpgradeProcessDefinitionInputsComponent;

      component.executeUpgradeDefinition();

      expect(service.executeUpgradeProcessDefinition).not.toHaveBeenCalled();
    });

    it("should execute the definition with correct project id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.projectId).toStrictEqual(projectId);
    });

    it("should execute the definition with correct definition id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.definitionId).toStrictEqual(definitionId);
    });

    it("should execute the definition with correct name", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.name).toStrictEqual(name);
    });

    it("should execute the definition with correct official flag", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.official).toStrictEqual(true);
    });

    it("should execute the definition with correct conversion factory product id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.mxParameters.conversionFactoryProduct.id).toStrictEqual(
        conversionFactoryProductId
      );
    });

    it("should execute the definition with correct conversion mx version", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.mxParameters.conversionFactoryProduct.mxVersion
      ).toStrictEqual(conversionMxVersion);
    });

    it("should execute the definition with correct conversion mx build id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.mxParameters.conversionFactoryProduct.mxBuildId
      ).toStrictEqual(conversionMxBuildId);
    });

    it("should execute the definition with correct conversion bip version", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.mxParameters.conversionFactoryProduct.bipVersion
      ).toStrictEqual(conversionBipVersion);
    });

    it("should execute the definition with correct conversion bip build id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.mxParameters.conversionFactoryProduct.bipBuildId
      ).toStrictEqual(conversionBipBuildId);
    });

    it("should execute the definition with correct parent Mx archival branch", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.mxParameters.parentMxArchivalBranch).toStrictEqual(
        parentMxArchivalBranch
      );
    });

    it("should execute the definition with correct upgrade jump", () => {
      component.executeUpgradeDefinition();
      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.mxParameters.upgradeJump).toStrictEqual(upgradeJump);
    });

    it("should execute the definition with correct repository id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.configurationParameters.repositoryId).toStrictEqual(
        repositoryId
      );
    });

    it("should execute teh definition with correct create branch flag", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(request.configurationParameters.createBranch).toStrictEqual(true);
    });

    it("should execute the definition with correct configuration branch name", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.configurationParameters.configurationBranchName
      ).toStrictEqual(configurationBranchName);
    });

    it("should execute the definition with correct configuration parent branch name", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.configurationParameters.configurationParentBranchName
      ).toStrictEqual(configurationParentBranchName);
    });

    it("should execute the definition with correct business process quality level", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.configurationParameters.businessProcessQualityLevel
      ).toStrictEqual(businessProcessQualityLevel);
    });

    it("should execute the definition with correct quality gate execution infra group id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.infrastructureParameters.qualityGateExecutionInfraGroupId
      ).toStrictEqual(qualityGateExecutionInfraGroupId);
    });

    it("should execute the definition with correct binary conversion infra group id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.infrastructureParameters.binaryConversionInfraGroupId
      ).toStrictEqual(binaryConversionInfraGroupId);
    });

    it("should execute the definition with correct binary conversion scenario definition id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.testParameters.binaryConversionScenarioDefinitionId
      ).toStrictEqual(binaryConversionScenarioDefinitionId);
    });

    it("should execute the definition with correct quality gate scenario definition ids", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.testParameters.qualityGateScenarioDefinitionIds
      ).toStrictEqual(qualityGateScenarioDefinitionIds);
    });

    it("should execute the definition with correct reference commit id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceCommitId
      ).toStrictEqual(referenceCommitId);
    });

    it("should execute the definition with correct reference factory product id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceFactoryProduct.id
      ).toStrictEqual(referenceFactoryProductId);
    });

    it("should execute the definition with correct reference mx version", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceFactoryProduct.mxVersion
      ).toStrictEqual(referenceMxVersion);
    });

    it("should execute the definition with correct reference mx build id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceFactoryProduct.mxBuildId
      ).toStrictEqual(referenceMxBuildId);
    });

    it("should execute the definition with correct reference bip version", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceFactoryProduct
          .bipVersion
      ).toStrictEqual(referenceBipVersion);
    });

    it("should execute the definition with correct reference bip build id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceFactoryProduct
          .bipBuildId
      ).toStrictEqual(referenceBipBuildId);
    });

    it("should execute the definition with correct reference environment definition id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceEnvironmentDefinitionId
      ).toStrictEqual(referenceEnvironmentDefinitionId);
    });

    it("should execute the definition with correct reference environment infra group id", () => {
      component.executeUpgradeDefinition();

      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];
      expect(
        request.referenceEnvironmentParameters.referenceEnvironmentInfraGroupId
      ).toStrictEqual(referenceEnvironmentInfraGroupId);
    });

    it("should request the launch of the upgrade definition with the specified notifications recipients", () => {
      component.executeUpgradeDefinition();
      const request: ExecuteUpgradeProcessDefinitionRequest =
        executeUpgradeProcessDefinitionMock.mock.calls[0][0];

      expect(request.notificationsRecipients).toEqual(notificationsRecipients);
    });

    it("should navigate to the upgrade process execution if successful", () => {
      component.executeUpgradeDefinition();

      expect(router.navigateByUrl).toHaveBeenCalledWith(
        `${projectIdRoute}/business-process/${BINARY_UPGRADE_MFE_PATH}/execution/${upgradeProcessExecutionId}`
      );
    });

    it("should generate project route with correct project id", () => {
      component.executeUpgradeDefinition();

      expect(projectUrlPipe.transform).toHaveBeenCalledWith(projectId);
    });

    it("should set the visible flag to false", () => {
      component.isVisible = true;
      component.executeUpgradeDefinition();

      expect(component.isVisible).toStrictEqual(false);
    });

    it("should set the error message if execution was not successful", () => {
      jest
        .spyOn(service, "executeUpgradeProcessDefinition")
        .mockReturnValue(throwError(() => new Error(errorMessage)));

      component.executeUpgradeDefinition();

      expect(component.errorMessage).toBe(errorMessage);
    });
  });

  it("when the execution request is in progress, then show the user a loading state", () => {
    const subject = new Subject<ExecuteUpgradeProcessDefinitionResponse>();
    jest
      .spyOn(service, "executeUpgradeProcessDefinition")
      .mockReturnValue(subject);

    component.executeUpgradeDefinition();

    expect(component.isExecuting).toBe(true);

    subject.next(getExecutionUpgradeProcessDefinitionResponse());

    expect(component.isExecuting).toBe(false);
  });

  function getDefinition(): BusinessProcessDefinition {
    return {
      id: definitionId,
      providedInputs: getProvidedInputs(),
    } as unknown as BusinessProcessDefinition;
  }

  function getProvidedInputs(): ProvidedInput[] {
    return [
      {
        inputId: "someInputId",
        value: "someValue",
      },
    ];
  }

  function getInputs(): ExecuteUpgradeProcessDefinitionInputs {
    return {
      name: name,
      official: true,
      parentMxArchivalBranch: parentMxArchivalBranch,
      notificationsRecipients,
      factoryProduct: {
        id: conversionFactoryProductId,
        mxVersion: conversionMxVersion,
        mxBuildId: conversionMxBuildId,
        bipVersion: conversionBipVersion,
        bipBuildId: conversionBipBuildId,
      },
      repositoryId: repositoryId,
      businessProcessQualityLevel: businessProcessQualityLevel,
      createBranch: true,
      configurationBranchName: configurationBranchName,
      configurationParentBranch: configurationParentBranchName,
      qualityGateExecutionInfraGroupId: qualityGateExecutionInfraGroupId,
      binaryConversionInfraGroupId: binaryConversionInfraGroupId,
      testScenarioIds: qualityGateScenarioDefinitionIds,
      technicalUpgradeTestScenarioId: binaryConversionScenarioDefinitionId,
      upgradeJump: upgradeJump,
      referenceCommitId: referenceCommitId,
      referenceFactoryProduct: {
        id: referenceFactoryProductId,
        mxVersion: referenceMxVersion,
        mxBuildId: referenceMxBuildId,
        bipVersion: referenceBipVersion,
        bipBuildId: referenceBipBuildId,
      },
      referenceEnvironmentDefinitionId: referenceEnvironmentDefinitionId,
      referenceEnvironmentInfraGroupId: referenceEnvironmentInfraGroupId,
    };
  }

  function getExecutionUpgradeProcessDefinitionResponse(): ExecuteUpgradeProcessDefinitionResponse {
    return {
      upgradeProcessExecutionId: upgradeProcessExecutionId,
    };
  }
});
