import { TestBed } from "@angular/core/testing";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessExecutionFetcherService,
  BusinessProcessAnalyticsTrackerService,
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxflow/features/business-process";
import { of, Subject, throwError } from "rxjs";
import { RepushBuildAndTestProcessInputComponent } from "./input/repush-build-and-test-process-input.component";
import { BuildAndTestProcessExecutionRepusherComponent } from "./build-and-test-process-execution-repusher.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { RepushBuildAndTestProcessInput } from "./input/repush-build-and-test-process-input";
import { BuildAndTestProcessExecutorService } from "../build-and-test-process-definition-executor/service/build-and-test-process-executor.service";
import { ExecuteBuildAndTestProcessResponse } from "../build-and-test-process-definition-executor/service/execute-build-and-test-process-response";
import { Component } from "@angular/core";

describe("BuildAndTestProcessExecutionRepusherComponent", () => {
  const projectId = "projectId";
  const executionId = "executionId";
  const repushedExecutionId = "repushExecutionId";
  const definitionId = "definitionId";

  let component: BuildAndTestProcessExecutionRepusherComponent;

  let definitionService: Partial<BusinessProcessDefinitionService>;
  let buildAndTestFetcherService: Partial<BuildAndTestProcessExecutionFetcherService>;
  let buildAndTestExecutorService: Partial<BuildAndTestProcessExecutorService>;
  let toastMessageService: Partial<ToastMessageService>;
  let trackerService: Partial<BusinessProcessAnalyticsTrackerService>;
  let inputComponent: RepushBuildAndTestProcessInputComponent;

  beforeEach(async () => {
    definitionService = {
      getBusinessProcessDefinition: jest
        .fn()
        .mockReturnValue(of(getDefinition())),
    } as Partial<BusinessProcessDefinitionService>;

    buildAndTestExecutorService = {
      executeBuildAndTestProcessDefinition: jest
        .fn()
        .mockReturnValue(of(getRepushBuildAndTestResponse())),
    } as Partial<BuildAndTestProcessExecutorService>;

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as Partial<ToastMessageService>;

    buildAndTestFetcherService = {
      getBuildAndTestProcessExecution: jest
        .fn()
        .mockReturnValue(of(getExecution())),
    } as Partial<BuildAndTestProcessExecutionFetcherService>;

    trackerService = {
      trackRepushBusinessProcess: jest.fn(),
    } as Partial<BusinessProcessAnalyticsTrackerService>;

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getRepushBuildAndTestProcessInput: jest
        .fn()
        .mockReturnValue(getRepushInputs()),
      form: {
        valid: true,
      },
    } as unknown as RepushBuildAndTestProcessInputComponent;

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: BusinessProcessDefinitionService,
          useValue: definitionService,
        },
        {
          provide: BuildAndTestProcessExecutorService,
          useValue: buildAndTestExecutorService,
        },
        {
          provide: ToastMessageService,
          useValue: toastMessageService,
        },
        {
          provide: BuildAndTestProcessExecutionFetcherService,
          useValue: buildAndTestFetcherService,
        },
        {
          provide: BusinessProcessAnalyticsTrackerService,
          useValue: trackerService,
        },
      ],
    })
      .overrideComponent(BuildAndTestProcessExecutionRepusherComponent, {
        set: {
          imports: [MockRepushBuildAndTestProcessInputComponent],
        },
      })
      .compileComponents();

    component = TestBed.createComponent(
      BuildAndTestProcessExecutionRepusherComponent
    ).componentInstance;
    component.inputsComponent = inputComponent;
  });

  describe("Opening the repush modal", () => {
    it("when user open the modal, show a loading state while the system is fetching the definition and execution", () => {
      const executionSubject = new Subject<BuildAndTestProcessExecution>();
      const definitionSubject = new Subject<BusinessProcessDefinition>();
      jest
        .spyOn(buildAndTestFetcherService, "getBuildAndTestProcessExecution")
        .mockReturnValueOnce(executionSubject);
      jest
        .spyOn(definitionService, "getBusinessProcessDefinition")
        .mockReturnValueOnce(definitionSubject);

      component.openRepushModal(projectId, executionId);
      expect(component.loading).toBe(true);
      executionSubject.next(getExecution());
      expect(component.loading).toBe(true);
      definitionSubject.next(getDefinition());
      expect(component.loading).toBe(false);
    });

    it("when user open the modal, the system should fetch the process execution that the user selected to repush", () => {
      component.openRepushModal(projectId, executionId);

      expect(
        buildAndTestFetcherService.getBuildAndTestProcessExecution
      ).toHaveBeenCalledWith(projectId, executionId);
    });

    it("when opening the repush modal and process execution is fetched, then the system should fetch the business process definition that corresponds to the execution", () => {
      component.openRepushModal(projectId, executionId);

      expect(
        definitionService.getBusinessProcessDefinition
      ).toHaveBeenCalledWith(projectId, definitionId);
    });

    it("when the process execution and definition are fetched, the system should render the inputs that needs to be filled by the user in the modal", () => {
      component.openRepushModal(projectId, executionId);

      expect(inputComponent.initializeForm).toHaveBeenCalledWith(
        projectId,
        getDefinition().providedInputs,
        getExecution()
      );
    });

    it("when the process execution and definition are fetched, then the system should render the modal", () => {
      component.openRepushModal(projectId, executionId);
      expect(component.loading).toBeFalsy();
    });

    it("when an error occur while fetching the process execution, the system should close the modal and prompt the user with an error", () => {
      jest
        .spyOn(buildAndTestFetcherService, "getBuildAndTestProcessExecution")
        .mockReturnValue(throwError(() => new Error()));

      component.openRepushModal(projectId, executionId);

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

      component.openRepushModal(projectId, executionId);

      expect(component.loading).toBeFalsy();
      expect(component.isVisible).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "Something went wrong. Please try again later."
      );
    });
  });

  describe("Repushing a build and test process execution", () => {
    it("given the user request to repush, we should track the event", () => {
      component.repushBuildAndTestExecution();

      expect(trackerService.trackRepushBusinessProcess).toHaveBeenCalled();
    });

    it("when the user fills the required inputs and clicked on the execute button, then the system should repush the build and test process with the provided form fields", () => {
      component.projectId = projectId;
      component.definitionId = definitionId;
      component.repushBuildAndTestExecution();

      expect(
        buildAndTestExecutorService.executeBuildAndTestProcessDefinition
      ).toHaveBeenCalledWith(projectId, {
        name: "name",
        definitionId: definitionId,
        repositoryId: "repositoryId",
        configurationBranchName: "configurationBranchName",
        configurationParentBranch: "configurationParentBranch",
        userStoryIds: ["userStoryId"],
        buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
        buildAndTestInfraGroup: "buildAndTestInfraGroup",
        skipPrepareBuildEnvironment: false,
        buildEnvironmentScenarioDefinitionId: "scenarioDefinitionId",
        notificationsRecipients: ["user1@example.com", "user2@example.com"],
      });
    });

    it("when the form filled by the user is invalid, then the system should not allow a repush of the build and test process", () => {
      component.inputsComponent = inputComponent = {
        form: {
          valid: false,
        },
      } as unknown as RepushBuildAndTestProcessInputComponent;

      component.repushBuildAndTestExecution();

      expect(
        buildAndTestExecutorService.executeBuildAndTestProcessDefinition
      ).not.toHaveBeenCalled();
    });

    it("when the user successfully repush a build and test process, the system should close the modal and prompt the user with a toast containing a link to the newly repushed execution", () => {
      component.projectId = projectId;

      component.repushBuildAndTestExecution();

      expect(component.isVisible).toBeFalsy();
      expect(inputComponent.resetForm).toHaveBeenCalled();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Business process execution successfully repushed",
        "",
        {
          link: {
            linkText: "View",
            href: `app/${projectId}/business-process/build-and-test-processes/execution/${repushedExecutionId}`,
          },
        }
      );
    });

    it("when the system fails to repush a build and test process execution, then the system should repush the process and alert the user about the errors that occurred", () => {
      jest
        .spyOn(
          buildAndTestExecutorService,
          "executeBuildAndTestProcessDefinition"
        )
        .mockReturnValueOnce(throwError(() => new Error("errorMessage")));

      component.repushBuildAndTestExecution();

      expect(component.errorMessage).toEqual("errorMessage");
    });

    it("given the user requested to execute a build and test process execution, then the system should show a loading state of the modal", () => {
      const executionSubject = new Subject<{ id: string }>();
      jest
        .spyOn(
          buildAndTestExecutorService,
          "executeBuildAndTestProcessDefinition"
        )
        .mockReturnValueOnce(executionSubject);

      expect(component.isExecuting).toBeFalsy();
      component.repushBuildAndTestExecution();
      expect(component.isExecuting).toBe(true);
      executionSubject.next({ id: repushedExecutionId });
      expect(component.isExecuting).toBe(false);
    });
  });

  describe("Hiding the repush modal", () => {
    it("when the user clicks on the cancel button of the repush modal, then the system should close the modal and reset the form", () => {
      component.hideRepusherModal();

      expect(component.isVisible).toBeFalsy();
      expect(inputComponent.resetForm).toHaveBeenCalledWith();
    });
  });

  function getDefinition(): BusinessProcessDefinition {
    return {
      providedInputs: [
        { inputId: "firstInputId", value: "firstInputValue" },
        { inputId: "secondInputId", value: "secondInputValue" },
      ],
    } as BusinessProcessDefinition;
  }

  function getExecution(): BuildAndTestProcessExecution {
    return {
      id: executionId,
      definitionId: definitionId,
    } as BuildAndTestProcessExecution;
  }

  function getRepushInputs(): RepushBuildAndTestProcessInput {
    return {
      name: "name",
      repositoryId: "repositoryId",
      configurationBranchName: "configurationBranchName",
      configurationParentBranch: "configurationParentBranch",
      userStoryIds: ["userStoryId"],
      buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
      buildAndTestInfraGroup: "buildAndTestInfraGroup",
      skipEnvironmentDeployment: false,
      buildScenarioDefinitionId: "scenarioDefinitionId",
      notificationsRecipients: ["user1@example.com", "user2@example.com"],
    };
  }

  function getRepushBuildAndTestResponse(): ExecuteBuildAndTestProcessResponse {
    return { id: repushedExecutionId };
  }
});

@Component({
  selector: "mxevolve-repush-build-and-test-process-input",
  template: "",
  standalone: true,
})
class MockRepushBuildAndTestProcessInputComponent {}
