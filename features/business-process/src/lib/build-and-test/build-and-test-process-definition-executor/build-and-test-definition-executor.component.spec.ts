import { BuildAndTestProcessExecutorService } from "./service/build-and-test-process-executor.service";
import { Router } from "@angular/router";
import {
  BusinessProcessDefinition,
  BuildAndTestDefinitionExecutorComponent,
} from "@mxflow/features/business-process";
import { ExecuteBuildAndTestProcessInputComponent } from "./input/execute-build-and-test-process-input.component";
import { of, Subject, throwError } from "rxjs";
import { ExecuteBuildAndTestProcessResponse } from "./service/execute-build-and-test-process-response";
import { v4 as uuidv4 } from "uuid";
import { TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { ExecuteBuildAndTestProcessInput } from "./input/execute-build-and-test-process-input";

describe("Build and test process definition executor component", () => {
  const projectId = uuidv4();
  const definitionId = uuidv4();
  const name = uuidv4();
  const repositoryId = uuidv4();
  const configurationBranchName = uuidv4();
  const configurationParentBranch = uuidv4();
  const buildAndTestInfraGroup = uuidv4();
  const buildEnvironmentInfraGroup = uuidv4();
  const buildEnvironmentScenarioDefinitionId = uuidv4();
  const userStoryIds: string[] = [uuidv4(), uuidv4()];
  const skipPrepareBuildEnvironment = true;
  const buildAndTestExecutionId = uuidv4();
  const errorMessage = uuidv4();

  let service: BuildAndTestProcessExecutorService;
  let router: Router;
  let inputComponent: ExecuteBuildAndTestProcessInputComponent;
  let component: BuildAndTestDefinitionExecutorComponent;

  beforeEach(() => {
    service = {
      executeBuildAndTestProcessDefinition: jest.fn(() => of(getResponse())),
    } as unknown as BuildAndTestProcessExecutorService;

    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getExecuteBuildAndTestProcessInput: jest.fn(() => getInputs()),
      form: {
        valid: true,
      },
    } as unknown as ExecuteBuildAndTestProcessInputComponent;

    TestBed.configureTestingModule({
      imports: [BuildAndTestDefinitionExecutorComponent],
      providers: [
        { provide: BuildAndTestProcessExecutorService, useValue: service },
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(BuildAndTestDefinitionExecutorComponent, {
      remove: {
        imports: [ExecuteBuildAndTestProcessInputComponent],
      },
      add: {
        imports: [MockExecuteBuildAndTestProcessInputComponent],
      },
    });

    component = TestBed.createComponent(
      BuildAndTestDefinitionExecutorComponent
    ).componentInstance;

    component.inputComponent = inputComponent;
    component.projectId = projectId;
    component.definition = getDefinition();
  });

  it("Given the user has clicked on 'Execute Definition', When the form is displayed, Then the process input list should be shown with prefilled values retrieved from the definition", () => {
    component.openExecutorModal();

    expect(component.isVisible).toBe(true);
    expect(inputComponent.initializeForm).toHaveBeenCalledWith(projectId, [
      {
        inputId: "someInputId",
        value: "someValue",
      },
    ]);
  });

  it("when the user close the execute build and test process modal, then hide the modal and reset the form", () => {
    component.isVisible = true;
    component.hideExecutorModal();

    expect(component.isVisible).toBe(false);
    expect(inputComponent.resetForm).toHaveBeenCalled();
  });

  it("when the user execute a build and test process, then execute with the given inputs and navigate to its page", () => {
    component.executeBuildAndTestDefinition();

    expect(service.executeBuildAndTestProcessDefinition).toHaveBeenCalledWith(
      projectId,
      {
        definitionId: definitionId,
        name: name,
        repositoryId: repositoryId,
        configurationBranchName: configurationBranchName,
        configurationParentBranch: configurationParentBranch,
        buildAndTestInfraGroup: buildAndTestInfraGroup,
        buildEnvironmentInfraGroup: buildEnvironmentInfraGroup,
        buildEnvironmentScenarioDefinitionId:
          buildEnvironmentScenarioDefinitionId,
        userStoryIds: userStoryIds,
        skipPrepareBuildEnvironment: skipPrepareBuildEnvironment,
      }
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      `app/${projectId}/business-process/build-and-test-processes/execution/${buildAndTestExecutionId}`
    );
    expect(component.isVisible).toBe(false);
  });

  it("given the execute form is not valid, when the user execute a build and test process, then do not execute one", () => {
    component.inputComponent = {
      form: {
        valid: false,
      },
    } as unknown as ExecuteBuildAndTestProcessInputComponent;

    component.executeBuildAndTestDefinition();

    expect(service.executeBuildAndTestProcessDefinition).not.toHaveBeenCalled();
  });

  it("given executing a build and test process failed, when the user execute a build and test process, then show the error", () => {
    jest
      .spyOn(service, "executeBuildAndTestProcessDefinition")
      .mockReturnValue(throwError(() => new Error(errorMessage)));

    component.executeBuildAndTestDefinition();

    expect(component.errorMessage).toStrictEqual(errorMessage);
  });

  it("when the user click the modal 'execute' button, show the user a loading state while the system is executing", () => {
    expect(component.isExecuting).toBe(false);

    const subject = new Subject<ExecuteBuildAndTestProcessResponse>();
    jest
      .spyOn(service, "executeBuildAndTestProcessDefinition")
      .mockReturnValue(subject);
    component.executeBuildAndTestDefinition();

    expect(component.isExecuting).toStrictEqual(true);

    subject.next(getResponse());

    expect(component.isExecuting).toStrictEqual(false);
  });

  function getDefinition(): BusinessProcessDefinition {
    return {
      id: definitionId,
      providedInputs: [
        {
          inputId: "someInputId",
          value: "someValue",
        },
      ],
    } as unknown as BusinessProcessDefinition;
  }

  function getInputs(): ExecuteBuildAndTestProcessInput {
    return {
      name: name,
      repositoryId: repositoryId,
      configurationBranchName: configurationBranchName,
      configurationParentBranch: configurationParentBranch,
      buildAndTestInfraGroup: buildAndTestInfraGroup,
      buildEnvironmentInfraGroup: buildEnvironmentInfraGroup,
      userStoryIds: userStoryIds,
      buildScenarioDefinitionId: buildEnvironmentScenarioDefinitionId,
      skipPrepareBuildEnvironment: skipPrepareBuildEnvironment,
    };
  }

  function getResponse(): ExecuteBuildAndTestProcessResponse {
    return {
      id: buildAndTestExecutionId,
    };
  }
});

@Component({
  selector: "mxevolve-execute-build-and-test-process-input",
  template: "",
})
class MockExecuteBuildAndTestProcessInputComponent {}
