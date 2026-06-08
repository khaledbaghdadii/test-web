import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  BusinessProcessAnalyticsTrackerService,
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  ValidationProcessExecution,
  ValidationProcessExecutionFetcherService,
} from "@mxflow/features/business-process";
import { of, throwError, Subject } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { RepushValidationProcessExecutionInputsComponent } from "./repush-validation-process-execution-inputs/repush-validation-process-execution-inputs.component";
import { ValidationProcessExecutionRepusherModalComponent } from "./validation-process-execution-repusher-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { RepushValidationProcessExecutionInput } from "./repush-validation-process-execution-inputs/repush-validation-process-execution-inputs";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { MASTER_VALIDATION_MFE_PATH } from "@mxflow/config";
import { ValidationProcessExecutorService } from "../validation-process-definition-executor/validation-process-executor.service";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "../validation-process-definition-executor/inputs/validation-scope-start-commit-id-parent-branch-resolver.service";
import { ValidationScopeStartCommitIdStateResolverService } from "../validation-process-definition-executor/inputs/validation-scope-start-commit-id-state-resolver.service";
import { FEATURE_FLAG_CONFIG } from "@mxflow/feature-flags";

const GATEWAY_URL = uuidv4();
const REPUSHED_EXECUTION_ID = uuidv4();
const PROJECT_ID = uuidv4();
const EXECUTION_ID = uuidv4();
const DEFINITION_ID = uuidv4();
const NAME = uuidv4();
const REPOSITORY_ID = uuidv4();
const QUALITY_GATE_LEVEL = uuidv4();
const PARENT_BRANCH_NAME = uuidv4();
const ARCHIVAL_BRANCH_NAME = uuidv4();
const CONFIG_COMMIT_ID = uuidv4();
const RTP_COMMIT_ID = uuidv4();
const FINAL_PRODUCT_ID = uuidv4();
const QUALITY_GATE_SCENARIO_DEFINITION_IDS = [uuidv4()];
const QUALITY_GATE_INFRA_GROUP_ID = uuidv4();
const VALIDATION_SCOPE_START_COMMIT_ID = uuidv4();

const DEFINITION: BusinessProcessDefinition = {
  providedInputs: [
    { inputId: uuidv4(), value: uuidv4() },
    { inputId: uuidv4(), value: uuidv4() },
  ],
} as unknown as BusinessProcessDefinition;

const EXECUTION: ValidationProcessExecution = {
  id: EXECUTION_ID,
  definitionId: DEFINITION_ID,
} as ValidationProcessExecution;

function getRepushedInputs(): RepushValidationProcessExecutionInput {
  return {
    name: NAME,
    official: true,
    repositoryId: REPOSITORY_ID,
    businessProcessQualityLevel: QUALITY_GATE_LEVEL,
    createBranch: true,
    parentBranchName: PARENT_BRANCH_NAME,
    archivalBranchName: ARCHIVAL_BRANCH_NAME,
    configCommitId: CONFIG_COMMIT_ID,
    rtpCommitId: RTP_COMMIT_ID,
    finalProductId: FINAL_PRODUCT_ID,
    qualityGateScenarioDefinitionIds: QUALITY_GATE_SCENARIO_DEFINITION_IDS,
    nightlyRepusherEnabled: false,
    qualityGateInfraGroupId: QUALITY_GATE_INFRA_GROUP_ID,
    validationScopeStartCommitId: VALIDATION_SCOPE_START_COMMIT_ID,
  };
}

describe("ValidationProcessExecutionRepusherModalComponent", () => {
  let fixture: ComponentFixture<ValidationProcessExecutionRepusherModalComponent>;
  let componentInstance: ValidationProcessExecutionRepusherModalComponent;

  let definitionService: Partial<BusinessProcessDefinitionService>;
  let validationFetcherService: Partial<ValidationProcessExecutionFetcherService>;
  let validationExecutorService: Partial<ValidationProcessExecutorService>;
  let toastMessageService: Partial<ToastMessageService>;
  let projectUrlPipe: Partial<ProjectUrlPipe>;
  let trackerService: Partial<BusinessProcessAnalyticsTrackerService>;

  let inputComponent: RepushValidationProcessExecutionInputsComponent;

  beforeEach(async () => {
    definitionService = {
      getBusinessProcessDefinition: jest.fn().mockReturnValue(of(DEFINITION)),
    };

    validationExecutorService = {
      executeValidationProcessDefinition: jest
        .fn()
        .mockReturnValue(of({ id: REPUSHED_EXECUTION_ID })),
    };

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    };

    validationFetcherService = {
      getValidationProcessExecution: jest.fn().mockReturnValue(of(EXECUTION)),
    };

    projectUrlPipe = {
      transform: jest.fn().mockReturnValue(GATEWAY_URL),
    };

    trackerService = {
      trackRepushBusinessProcess: jest.fn(),
    };

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getRepushInputs: jest.fn(() => getRepushedInputs()),
      form: {
        valid: true,
      },
    } as unknown as RepushValidationProcessExecutionInputsComponent;

    await TestBed.configureTestingModule({
      imports: [ValidationProcessExecutionRepusherModalComponent],
      providers: [
        {
          provide: FEATURE_FLAG_CONFIG,
          useValue: { gatewayUrl: "" },
        },
      ],
    })
      .overrideComponent(ValidationProcessExecutionRepusherModalComponent, {
        set: {
          providers: [
            {
              provide: BusinessProcessDefinitionService,
              useValue: definitionService,
            },
            {
              provide: ValidationProcessExecutorService,
              useValue: validationExecutorService,
            },
            {
              provide: ToastMessageService,
              useValue: toastMessageService,
            },
            {
              provide: ValidationProcessExecutionFetcherService,
              useValue: validationFetcherService,
            },
            {
              provide: ProjectUrlPipe,
              useValue: projectUrlPipe,
            },
            {
              provide: BusinessProcessAnalyticsTrackerService,
              useValue: trackerService,
            },
          ],
        },
      })
      .overrideComponent(RepushValidationProcessExecutionInputsComponent, {
        set: {
          providers: [
            {
              provide: ValidationScopeStartCommitIdParentBranchResolverService,
              useValue: { resolve: jest.fn(() => of(null)) },
            },
            {
              provide: ValidationScopeStartCommitIdStateResolverService,
              useValue: {
                resolve: jest.fn(() =>
                  of({ visible: false, resolvedParentBranch: null })
                ),
              },
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(
      ValidationProcessExecutionRepusherModalComponent
    );
    componentInstance = fixture.componentInstance;
    componentInstance.inputsComponent = inputComponent;
  });

  describe("Showing Repush Modal", () => {
    it("should show an initial loading screen for when the user decides to repush a process", () => {
      const executionSubject = new Subject<ValidationProcessExecution>();
      const definitionSubject = new Subject<BusinessProcessDefinition>();
      jest
        .spyOn(validationFetcherService, "getValidationProcessExecution")
        .mockReturnValueOnce(executionSubject);
      jest
        .spyOn(definitionService, "getBusinessProcessDefinition")
        .mockReturnValueOnce(definitionSubject);

      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      expect(componentInstance.loading).toBe(true);

      executionSubject.next(EXECUTION);
      expect(componentInstance.loading).toBe(true);
      definitionSubject.next(DEFINITION);
      expect(componentInstance.loading).toBe(false);
    });
  });

  it("when opening the repush modal, the system should fetch the process execution that the user selected to repush", () => {
    componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
    expect(
      validationFetcherService.getValidationProcessExecution
    ).toHaveBeenCalledWith(PROJECT_ID, EXECUTION_ID);
  });

  it("when opening the repush modal and process execution is fetched, then the system should fetch the business process definition that corresponds to the execution", () => {
    componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
    expect(definitionService.getBusinessProcessDefinition).toHaveBeenCalledWith(
      PROJECT_ID,
      DEFINITION_ID
    );
  });

  it("when the process execution and definition are fetched, the system should render the inputs that needs to be filled by the user in the modal", () => {
    componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
    expect(inputComponent.initializeForm).toHaveBeenCalledWith(
      PROJECT_ID,
      DEFINITION.providedInputs,
      EXECUTION
    );
  });

  it("when the process execution and definition are fetched, then the system should render the modal", () => {
    componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
    expect(componentInstance.loading).toBeFalsy();
  });

  it("when an error occur while fetching the process execution, the system should close the modal and prompt the user with an error", () => {
    jest
      .spyOn(validationFetcherService, "getValidationProcessExecution")
      .mockImplementationOnce(() => throwError(() => new Error()));
    componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
    expect(componentInstance.loading).toBeFalsy();
    expect(componentInstance.isVisible).toBeFalsy();
    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "Something went wrong. Please try again later."
    );
  });

  it("when an error occur while fetching the process definition, the system should close the modal and prompt the user with an error", () => {
    jest
      .spyOn(definitionService, "getBusinessProcessDefinition")
      .mockImplementationOnce(() => throwError(() => new Error()));
    componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
    expect(componentInstance.loading).toBeFalsy();
    expect(componentInstance.isVisible).toBeFalsy();
    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "Something went wrong. Please try again later."
    );
  });

  describe("Repushing a validation process execution", () => {
    it("given the user request to repush, we should track the event", () => {
      componentInstance.repushValidationExecution();

      expect(trackerService.trackRepushBusinessProcess).toHaveBeenCalled();
    });

    it("when the user fills the required inputs and clicked on the execute button, then the system should repush the validation process with the provided form fields", () => {
      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      componentInstance.repushValidationExecution();
      expect(
        validationExecutorService.executeValidationProcessDefinition
      ).toHaveBeenCalledWith(PROJECT_ID, {
        name: NAME,
        definitionId: DEFINITION_ID,
        official: true,
        configurationParameters: {
          archivalBranchName: ARCHIVAL_BRANCH_NAME,
          configCommitId: CONFIG_COMMIT_ID,
          createBranch: true,
          finalProductId: FINAL_PRODUCT_ID,
          parentBranchName: PARENT_BRANCH_NAME,
          businessProcessQualityLevel: QUALITY_GATE_LEVEL,
          repositoryId: REPOSITORY_ID,
          rtpCommitId: RTP_COMMIT_ID,
        },
        testParameters: {
          nightlyRepusherEnabled: false,
          qualityGateScenarioDefinitionIds:
            QUALITY_GATE_SCENARIO_DEFINITION_IDS,
        },
        infrastructureParameters: {
          qualityGateInfraGroupId: QUALITY_GATE_INFRA_GROUP_ID,
        },
        validationScopeParameters: {
          startCommitId: VALIDATION_SCOPE_START_COMMIT_ID,
        },
      });
    });

    it("when the form filled by the user is invalid, then the system should not allow a repush of the validation process", () => {
      componentInstance.inputsComponent = inputComponent = {
        form: {
          valid: false,
        },
      } as unknown as RepushValidationProcessExecutionInputsComponent;
      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      componentInstance.repushValidationExecution();
      expect(
        validationExecutorService.executeValidationProcessDefinition
      ).not.toHaveBeenCalled();
    });

    it("when the user successfully repush a validation process, the system should close the modal and prompt the user with a toast containing a link to the newly repushed execution", () => {
      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      componentInstance.repushValidationExecution();
      expect(componentInstance.isVisible).toBeFalsy();
      expect(inputComponent.resetForm).toHaveBeenCalled();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Business process execution successfully repushed",
        "",
        {
          link: {
            linkText: "View",
            href: `${GATEWAY_URL}/business-process/${MASTER_VALIDATION_MFE_PATH}/execution/${REPUSHED_EXECUTION_ID}`,
          },
        }
      );
    });

    it("when the system fails to repush a validation process execution, then the system should repush the process and alert the user about the errors that occurred", () => {
      const errorMessage = uuidv4();
      jest
        .spyOn(validationExecutorService, "executeValidationProcessDefinition")
        .mockReturnValueOnce(throwError(() => new Error(errorMessage)));
      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      componentInstance.repushValidationExecution();
      expect(componentInstance.errorMessage).toEqual(errorMessage);
    });

    it("given the user requested to execute a validation process execution, then the system should show a loading state of the modal", () => {
      const executionSubject = new Subject<{ id: string }>();
      jest
        .spyOn(validationExecutorService, "executeValidationProcessDefinition")
        .mockReturnValueOnce(executionSubject);
      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      expect(componentInstance.isExecuting).toBeFalsy();
      componentInstance.repushValidationExecution();
      expect(componentInstance.isExecuting).toBe(true);
      executionSubject.next({ id: REPUSHED_EXECUTION_ID });
      expect(componentInstance.isExecuting).toBe(false);
    });
  });

  describe("Hiding the repush modal", () => {
    it("when the user clicks on the cancel button of the repush modal, then the system should close the modal and reset the form", () => {
      componentInstance.openRepushModal(PROJECT_ID, EXECUTION_ID);
      componentInstance.hideRepusherModal();
      expect(componentInstance.isVisible).toBeFalsy();
      expect(inputComponent.resetForm).toHaveBeenCalledWith();
    });
  });
});
