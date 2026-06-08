import { UpgradeProcessRepusherModalComponent } from "./upgrade-process-repusher-modal.component";
import { UpgradeProcessDefinitionExecutorService } from "../service/upgrade-process-definition-executor.service";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { RepushUpgradeProcessDefinitionInputsComponent } from "./inputs/repush-upgrade-process-definition-inputs.component";
import { RepushUpgradeProcessDefinitionInputs } from "./inputs/repush-upgrade-process-definition-inputs";
import { of, Subject, throwError } from "rxjs";
import { ExecuteUpgradeProcessDefinitionResponse } from "../service/execute-upgrade-process-definition-response";
import { BINARY_UPGRADE_MFE_PATH } from "@mxflow/config";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TestBed } from "@angular/core/testing";
import { BusinessProcessDefinitionService } from "../../business-process-definition/business-process-definition.service";
import { BusinessProcessDefinition } from "../../business-process-definition/business-process-definition";
import { UpgradeProcessExecutionFetcherService } from "../upgrade-process-execution-fetcher/upgrade-process-execution-fetcher.service";
import { UpgradeProcessExecution } from "../upgrade-process-execution";
import { BusinessProcessExecutionStatus } from "../../business-process-execution-status/business-process-execution-status";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { QualityGateValidationDecision } from "../../quality-gate-validation/quality-gate-validation-result";
import { Component } from "@angular/core";
import { ExecuteUpgradeProcessDefinitionRequest } from "../service/execute-upgrade-process-definition-request";
import { BusinessProcessAnalyticsTrackerService } from "../../analytics-tracker/business-process-analytics-tracker.service";

describe("Upgrade process repusher modal component test", () => {
  const projectId = "projectId";
  const definitionId = "definitionId";
  const executionId = "executionId";
  const repushedExecutionId = "repushedExecutionId";
  const projectIdRoute = "projectIdRoute";

  let executorService: Partial<UpgradeProcessDefinitionExecutorService>;
  let toastMessageService: Partial<ToastMessageService>;
  let projectUrlPipe: Partial<ProjectUrlPipe>;
  let fetcherService: Partial<UpgradeProcessExecutionFetcherService>;
  let definitionService: Partial<BusinessProcessDefinitionService>;
  let trackerService: Partial<BusinessProcessAnalyticsTrackerService>;

  let inputComponent: RepushUpgradeProcessDefinitionInputsComponent;
  let component: UpgradeProcessRepusherModalComponent;

  beforeEach(() => {
    executorService = {
      executeUpgradeProcessDefinition: jest.fn(
        jest.fn(() => of(getExecutionUpgradeProcessDefinitionResponse()))
      ),
    };

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };

    projectUrlPipe = {
      transform: jest.fn(() => projectIdRoute),
    };

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getRepushInputs: jest.fn(() => getInputs()),
      form: {
        valid: true,
      },
    } as unknown as RepushUpgradeProcessDefinitionInputsComponent;

    fetcherService = {
      getUpgradeProcessExecution: jest.fn(() =>
        of(getUpgradeProcessExecution())
      ),
    };

    definitionService = {
      getBusinessProcessDefinition: jest.fn(() => of(getDefinition())),
    };

    trackerService = {
      trackRepushBusinessProcess: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [UpgradeProcessRepusherModalComponent],
      providers: [
        {
          provide: UpgradeProcessDefinitionExecutorService,
          useValue: executorService,
        },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: ProjectUrlPipe, useValue: projectUrlPipe },
        {
          provide: UpgradeProcessExecutionFetcherService,
          useValue: fetcherService,
        },
        {
          provide: BusinessProcessDefinitionService,
          useValue: definitionService,
        },
        {
          provide: BusinessProcessAnalyticsTrackerService,
          useValue: trackerService,
        },
      ],
    })
      .overrideComponent(UpgradeProcessRepusherModalComponent, {
        remove: {
          imports: [RepushUpgradeProcessDefinitionInputsComponent],
          providers: [UpgradeProcessDefinitionExecutorService, ProjectUrlPipe],
        },
        add: {
          imports: [MockRepushUpgradeProcessDefinitionInputsComponent],
        },
      })
      .compileComponents();

    component = TestBed.createComponent(
      UpgradeProcessRepusherModalComponent
    ).componentInstance;
    component.inputsComponent = inputComponent;
  });

  describe("Open executor modal", () => {
    it("when user open the modal, show a loading state while the system is fetching the definition and execution", () => {
      const executionSubject = new Subject<UpgradeProcessExecution>();
      const definitionSubject = new Subject<BusinessProcessDefinition>();
      jest
        .spyOn(fetcherService, "getUpgradeProcessExecution")
        .mockReturnValueOnce(executionSubject);
      jest
        .spyOn(definitionService, "getBusinessProcessDefinition")
        .mockReturnValueOnce(definitionSubject);

      component.openRepusherModal(projectId, executionId);
      expect(component.loading).toBe(true);
      executionSubject.next(getUpgradeProcessExecution());
      expect(component.loading).toBe(true);
      definitionSubject.next(getDefinition());
      expect(component.loading).toBe(false);
    });

    it("when user open the modal, the system should fetch the process execution that the user selected to repush", () => {
      component.openRepusherModal(projectId, executionId);

      expect(fetcherService.getUpgradeProcessExecution).toHaveBeenCalledWith(
        projectId,
        executionId
      );
    });

    it("when user open the model, the system should set the project id and definition id and make the modal visible", () => {
      component.openRepusherModal(projectId, executionId);

      expect(component.projectId).toBe(projectId);
      expect(component.definitionId).toBe(definitionId);
      expect(component.isVisible).toBe(true);
    });

    it("when opening the repush modal and process execution is fetched, then the system should fetch the business process definition that corresponds to the execution", () => {
      component.openRepusherModal(projectId, executionId);

      expect(
        definitionService.getBusinessProcessDefinition
      ).toHaveBeenCalledWith(projectId, definitionId);
    });

    it("when the process execution and definition are fetched, the system should render the inputs that needs to be filled by the user in the modal", () => {
      component.openRepusherModal(projectId, executionId);

      expect(inputComponent.initializeForm).toHaveBeenCalledWith(
        projectId,
        getDefinition().providedInputs,
        getUpgradeProcessExecution()
      );
    });

    it("when an error occur while fetching the process execution, the system should close the modal and prompt the user with an error", () => {
      jest
        .spyOn(fetcherService, "getUpgradeProcessExecution")
        .mockReturnValue(throwError(() => new Error()));

      component.openRepusherModal(projectId, executionId);

      expect(component.loading).toBeFalsy();
      expect(component.isVisible).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "Something went wrong. Please try again later."
      );
    });

    it("when an error occur while fetching the process definition, the system should close the modal and prompt the user with an error", () => {
      jest
        .spyOn(definitionService, "getBusinessProcessDefinition")
        .mockReturnValue(throwError(() => new Error()));

      component.openRepusherModal(projectId, executionId);

      expect(component.loading).toBeFalsy();
      expect(component.isVisible).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "Something went wrong. Please try again later."
      );
    });
  });

  describe("Hide executor modal", () => {
    it("should set the visible flag to false", () => {
      component.isVisible = true;
      component.hideRepusherModal();

      expect(component.isVisible).toStrictEqual(false);
    });

    it("should reset the form", () => {
      component.isVisible = true;
      component.hideRepusherModal();

      expect(inputComponent.resetForm).toHaveBeenCalled();
    });
  });

  describe("Execute upgrade definition", () => {
    beforeEach(() => {
      component.projectId = projectId;
      component.definitionId = definitionId;
    });

    it("given the user request to repush, we should track the event", () => {
      component.repushUpgradeExecution();

      expect(trackerService.trackRepushBusinessProcess).toHaveBeenCalled();
    });

    it("when the user fills the required inputs and clicked on the execute button, then the system should repush the upgrade process with the provided form fields", () => {
      component.repushUpgradeExecution();

      expect(
        executorService.executeUpgradeProcessDefinition
      ).toHaveBeenCalledWith({
        projectId: projectId,
        definitionId: "definitionId",
        name: "name",
        official: true,
        notificationsRecipients: ["recipient1", "recipient2"],
        mxParameters: {
          parentMxArchivalBranch: "parentMxArchivalBranch",
          upgradeJump: "upgradeJump",
          conversionFactoryProduct: {
            id: "factoryProductId",
            mxVersion: "mxVersion",
            mxBuildId: "mxBuildId",
            bipVersion: "bipVersion",
            bipBuildId: "bipBuildId",
          },
        },
        configurationParameters: {
          repositoryId: "repositoryId",
          createBranch: true,
          configurationBranchName: "configurationBranchName",
          configurationParentBranchName: "configurationParentBranch",
          businessProcessQualityLevel: "MQG",
        },
        infrastructureParameters: {
          qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
          binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
        },
        testParameters: {
          qualityGateScenarioDefinitionIds: ["scenarioId1", "scenarioId2"],
          binaryConversionScenarioDefinitionId:
            "technicalUpgradeTestScenarioId",
        },
        referenceEnvironmentParameters: {
          referenceCommitId: "referenceCommitId",
          referenceFactoryProduct: {
            id: "referenceFactoryProductId",
            mxVersion: "referenceMxVersion",
            mxBuildId: "referenceMxBuildId",
            bipVersion: "referenceBipVersion",
            bipBuildId: "referenceBipBuildId",
          },
          referenceEnvironmentDefinitionId: "referenceEnvironmentDefinitionId",
          referenceEnvironmentInfraGroupId: "referenceEnvironmentInfraGroupId",
        },
      } as ExecuteUpgradeProcessDefinitionRequest);
    });

    it("when the form filled by the user is invalid, then the system should not allow a repush of the build and test process", () => {
      component.inputsComponent = {
        form: {
          valid: false,
        },
      } as unknown as RepushUpgradeProcessDefinitionInputsComponent;

      component.repushUpgradeExecution();

      expect(
        executorService.executeUpgradeProcessDefinition
      ).not.toHaveBeenCalled();
    });

    it("when the user successfully repush an upgrade process, the system should close the modal and prompt the user with a toast containing a link to the newly repushed execution", () => {
      component.repushUpgradeExecution();

      expect(component.isVisible).toBeFalsy();
      expect(inputComponent.resetForm).toHaveBeenCalled();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Business process execution successfully repushed",
        "",
        {
          link: {
            linkText: "View",
            href: `${projectIdRoute}/business-process/${BINARY_UPGRADE_MFE_PATH}/execution/${repushedExecutionId}`,
          },
        }
      );
    });

    it("when the system fails to repush an upgrade execution, then the system should repush the process and alert the user about the errors that occurred", () => {
      jest
        .spyOn(executorService, "executeUpgradeProcessDefinition")
        .mockReturnValueOnce(throwError(() => new Error("errorMessage")));

      component.repushUpgradeExecution();

      expect(component.errorMessage).toEqual("errorMessage");
    });

    it("given the user requested to execute an upgrade process execution, then the system should show a loading state of the modal", () => {
      const executionSubject =
        new Subject<ExecuteUpgradeProcessDefinitionResponse>();
      jest
        .spyOn(executorService, "executeUpgradeProcessDefinition")
        .mockReturnValueOnce(executionSubject);

      expect(component.isExecuting).toBeFalsy();
      component.repushUpgradeExecution();
      expect(component.isExecuting).toBe(true);
      executionSubject.next(getExecutionUpgradeProcessDefinitionResponse());
      expect(component.isExecuting).toBe(false);
    });
  });

  function getDefinition(): BusinessProcessDefinition {
    return {
      id: "definitionId",
      providedInputs: [
        {
          inputId: "someInputId",
          value: "someValue",
        },
      ],
    } as BusinessProcessDefinition;
  }

  function getUpgradeProcessExecution(): UpgradeProcessExecution {
    return {
      id: executionId,
      startDate: "startDate",
      endDate: "endDate",
      expiryDate: "expiryDate",
      name: "name",
      projectId: projectId,
      definitionId: "definitionId",
      status: BusinessProcessExecutionStatus.PENDING_INPUT,
      supportsResourceManagement: true,
      notificationsRecipients: ["recipient1", "recipient2"],
      errorMessage: "errorMessage",
      officiality: "OFFICIAL",
      input: {
        factoryProductId: "factoryProductId",
        mxVersion: "mxVersion",
        mxBuildId: "mxBuildId",
        bipVersion: "bipVersion",
        bipBuildId: "bipBuildId",
        parentMxArchivalBranch: "parentMxArchivalBranch",
        upgradeJump: "upgradeJump",
        repositoryId: "repositoryId",
        businessProcessQualityLevel: "MQG",
        configurationParentBranch: "configurationParentBranch",
        configurationBranchName: "configurationBranchName",
        createBranch: true,
        qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
        binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
        binaryConversionTestScenarioId: "binaryConversionTestScenarioId",
        testScenarioIds: ["scenarioId1", "scenarioId2"],
        referenceFactoryProductId: "referenceFactoryProductId",
        referenceMxVersion: "referenceMxVersion",
        referenceMxBuildId: "referenceMxBuildId",
        referenceBipVersion: "referenceBipVersion",
        referenceBipBuildId: "referenceBipBuildId",
        referenceCommitId: "referenceCommitId",
        referenceEnvironmentInfraGroupId: "referenceEnvironmentInfraGroupId",
        referenceEnvironmentDefinitionId: "referenceEnvironmentDefinitionId",
      },
      createBranchStage: {
        route: "create-branch",
        name: "createBranchStage",
        status: StageStatus.PASSED,
        startDate: "createBranchStartDate",
        endDate: "createBranchEndDate",
        errorMessage: "createBranchErrorMessage",
        developmentId: "developmentId",
        createBranch: true,
        repositoryId: "repositoryId",
        lastCommitId: "lastCommitId",
      },
      binaryConversionStage: {
        route: "run-technical-upgrade",
        name: "binaryConversionStage",
        status: StageStatus.RUNNING,
        startDate: "binaryConversionStartDate",
        endDate: "binaryConversionEndDate",
        errorMessage: "binaryConversionErrorMessage",
        actionRequester: "binaryConversionActionRequester",
        referenceExecutionId: "referenceExecutionId",
        decision: "binaryConversionDecision",
      },
      executeQualityGateStage: {
        route: "run-rtp",
        name: "executeQualityGateStage",
        status: StageStatus.PENDING_INPUT,
        startDate: "executeQualityGateStartDate",
        endDate: "executeQualityGateEndDate",
        errorMessage: "executeQualityGateErrorMessage",
        validationResult: {
          decision: QualityGateValidationDecision.PASSED,
          comment: "validationResultComment",
          requester: "validationResultRequester",
        },
      },
      tagStage: {
        route: "tag-upgrade-branch",
        name: "tagUpgradeBranchStage",
        status: StageStatus.NOT_STARTED,
        startDate: "tagUpgradeBranchStartDate",
        endDate: "tagUpgradeBranchEndDate",
        errorMessage: "tagUpgradeBranchErrorMessage",
        tagName: "tagName",
        taggedCommitId: "taggedCommitId",
      },
      integrateChangesStage: {
        route: "integrate-fixes",
        name: "integrateChangesStage",
        status: StageStatus.FAILED,
        startDate: "integrateChangesStartDate",
        endDate: "integrateChangesEndDate",
        errorMessage: "integrateChangesErrorMessage",
        requester: "integrateChangesRequester",
        latestMergeJobId: "latestMergeJobId",
      },
      referenceEnvironmentDeployment: {
        projectId: projectId,
        processId: executionId,
        supported: true,
        enabledInCurrentlyActiveStage: true,
        limitReached: true,
        canCleanAndDeploy: true,
        referenceEnvironments: ["environmentId1", "environmentId2"],
        requestIds: ["requestId1", "requestId2"],
      },
    };
  }

  function getInputs(): RepushUpgradeProcessDefinitionInputs {
    return {
      name: "name",
      official: true,
      parentMxArchivalBranch: "parentMxArchivalBranch",
      upgradeJump: "upgradeJump",
      notificationsRecipients: ["recipient1", "recipient2"],
      factoryProduct: {
        id: "factoryProductId",
        mxVersion: "mxVersion",
        mxBuildId: "mxBuildId",
        bipVersion: "bipVersion",
        bipBuildId: "bipBuildId",
      },
      repositoryId: "repositoryId",
      businessProcessQualityLevel: "MQG",
      createBranch: true,
      configurationBranchName: "configurationBranchName",
      configurationParentBranch: "configurationParentBranch",
      qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
      binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
      testScenarioIds: ["scenarioId1", "scenarioId2"],
      technicalUpgradeTestScenarioId: "technicalUpgradeTestScenarioId",
      referenceCommitId: "referenceCommitId",
      referenceFactoryProduct: {
        id: "referenceFactoryProductId",
        mxVersion: "referenceMxVersion",
        mxBuildId: "referenceMxBuildId",
        bipVersion: "referenceBipVersion",
        bipBuildId: "referenceBipBuildId",
      },
      referenceEnvironmentDefinitionId: "referenceEnvironmentDefinitionId",
      referenceEnvironmentInfraGroupId: "referenceEnvironmentInfraGroupId",
    };
  }

  function getExecutionUpgradeProcessDefinitionResponse(): ExecuteUpgradeProcessDefinitionResponse {
    return {
      upgradeProcessExecutionId: repushedExecutionId,
    };
  }
});

@Component({
  selector: "mxevolve-repush-upgrade-process-definition-inputs",
  template: "",
})
class MockRepushUpgradeProcessDefinitionInputsComponent {}
