import { BackportProcessExecutorService } from "./service/backport-process-executor.service";
import { Router } from "@angular/router";
import { ExecuteBackportProcessInputComponent } from "./input/execute-backport-process-input.component";
import {
  BusinessProcessDefinition,
  BackportDefinitionExecutorComponent,
} from "@mxflow/features/business-process";
import { of } from "rxjs";
import { ExecuteBackportProcessResponse } from "./service/execute-backport-process-response";
import { TestBed } from "@angular/core/testing";
import { v4 as uuidv4 } from "uuid";
import { ExecuteBackportProcessInput } from "./input/execute-backport-process-input";

describe("Backport process executor service test", () => {
  const projectId = uuidv4();
  const definitionId = uuidv4();
  const executionId = uuidv4();
  const pullRequestTitle = uuidv4();
  const notificationsRecipients = [uuidv4()];
  const name = uuidv4();
  const repositoryId = uuidv4();
  const destinationMergeConfigurationId = uuidv4();
  const pullRequestToBeBackported = uuidv4();
  const reviewerName = uuidv4();
  const reviewerDisplayName = uuidv4();
  const userStories = [uuidv4(), uuidv4()];
  const buildAndTestInfraGroup = uuidv4();
  const providedInputs = [
    {
      inputId: "repositoryId",
      value: repositoryId,
    },
    {
      inputId: "mergeConfigurationId",
      value: destinationMergeConfigurationId,
    },
    {
      inputId: "buildAndTestInfraGroup",
      value: buildAndTestInfraGroup,
    },
  ];

  let service: BackportProcessExecutorService;
  let router: Router;
  let inputComponent: ExecuteBackportProcessInputComponent;
  let component: BackportDefinitionExecutorComponent;

  beforeEach(() => {
    service = {
      executeBackportProcessDefinition: jest.fn(() =>
        of(getExecuteBackportProcessResponse())
      ),
    } as unknown as BackportProcessExecutorService;

    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getExecuteBackportProcessInput: jest.fn(() => getInputs()),
      form: {
        valid: true,
      },
    } as unknown as ExecuteBackportProcessInputComponent;

    TestBed.configureTestingModule({
      imports: [BackportDefinitionExecutorComponent],
      providers: [
        {
          provide: BackportProcessExecutorService,
          useValue: service,
        },
        { provide: Router, useValue: router },
      ],
    });

    component = TestBed.createComponent(
      BackportDefinitionExecutorComponent
    ).componentInstance;

    component.inputComponent = inputComponent;
    component.projectId = projectId;
    component.definition = getDefinition();
  });

  it("when the user clicks on execute, then the modal is displayed and the input list is prefilled with values retrieved from the definition", () => {
    component.openExecutorModal();

    expect(component.isVisible).toBeTruthy();
    expect(inputComponent.initializeForm).toHaveBeenCalledWith(
      projectId,
      providedInputs
    );
  });

  it("when the user closes the modal, then the modal should be hidden and the input list reset", () => {
    component.openExecutorModal();
    component.hideExecutorModal();

    expect(component.isVisible).toBeFalsy();
    expect(inputComponent.resetForm).toHaveBeenCalled();
  });

  it("when the user requests to execute a backport process, then execute with the given inputs and navigate to the execution page", () => {
    component.executeBackportDefinition();

    expect(service.executeBackportProcessDefinition).toHaveBeenCalledWith(
      projectId,
      {
        name: name,
        definitionId: definitionId,
        repositoryId: repositoryId,
        destinationMergeConfigurationId: destinationMergeConfigurationId,
        pullRequestToBeBackported: pullRequestToBeBackported,
        pullRequestTitle: pullRequestTitle,
        pullRequestReviewers: [reviewerName],
        userStoryIds: userStories,
        buildAndTestInfraGroup: buildAndTestInfraGroup,
        notificationsRecipients: notificationsRecipients,
      }
    );

    expect(router.navigateByUrl).toHaveBeenCalledWith(
      `app/${projectId}/business-process/build-and-test-processes/execution/${executionId}`
    );
    expect(component.isVisible).toBeFalsy();
  });

  function getExecuteBackportProcessResponse(): ExecuteBackportProcessResponse {
    return {
      id: executionId,
    };
  }

  function getInputs(): ExecuteBackportProcessInput {
    return {
      name: name,
      pullRequestId: pullRequestToBeBackported,
      userStoryIds: userStories,
      pullRequestTitle: pullRequestTitle,
      pullRequestReviewers: [
        {
          name: reviewerName,
          displayName: reviewerDisplayName,
        },
      ],
      notificationsRecipients: notificationsRecipients,
    };
  }

  function getDefinition(): BusinessProcessDefinition {
    return {
      name: name,
      id: definitionId,
      definitionId: definitionId,
      providedInputs: providedInputs,
    } as unknown as BusinessProcessDefinition;
  }
});
