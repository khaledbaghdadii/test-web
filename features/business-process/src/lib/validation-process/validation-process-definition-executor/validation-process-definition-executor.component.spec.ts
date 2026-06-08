import { Router } from "@angular/router";
import {
  BusinessProcessDefinition,
  ValidationProcessDefinitionExecutorComponent,
} from "@mxflow/features/business-process";
import { ExecuteValidationProcessInputComponent } from "./inputs/execute-validation-process-input.component";
import { of, Subject, throwError } from "rxjs";
import { ExecuteValidationProcessInput } from "./inputs/execute-validation-process-input";
import { v4 as uuidv4 } from "uuid";
import { TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { ExecuteValidationProcessResponse } from "./execute-validation-process-response";
import { ValidationProcessExecutorService } from "./validation-process-executor.service";

describe("Validation process definition executor component test", () => {
  const projectId = uuidv4();
  const definitionId = uuidv4();
  const name = uuidv4();
  const repositoryId = uuidv4();
  const businessProcessQualityLevel = uuidv4();
  const parentBranchName = uuidv4();
  const archivalBranchName = uuidv4();
  const configCommitId = uuidv4();
  const rtpCommitId = uuidv4();
  const finalProductId = uuidv4();
  const validationScopeStartCommitId = uuidv4();
  const qualityGateScenarioDefinitionIds = [uuidv4(), uuidv4()];
  const qualityGateInfraGroupId = uuidv4();
  const notificationsRecipients = [uuidv4(), uuidv4()];
  const validationProcessExecutionId = uuidv4();
  const errorMessage = uuidv4();

  let service: ValidationProcessExecutorService;
  let router: Router;
  let inputComponent: ExecuteValidationProcessInputComponent;

  let component: ValidationProcessDefinitionExecutorComponent;

  beforeEach(() => {
    service = {
      executeValidationProcessDefinition: jest.fn(() =>
        of(getExecutionValidationProcessDefinitionResponse())
      ),
    } as unknown as ValidationProcessExecutorService;

    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    inputComponent = {
      initializeForm: jest.fn(),
      resetForm: jest.fn(),
      getExecuteValidationProcessDefinitionInputs: jest.fn(() => getInputs()),
      form: {
        valid: true,
      },
    } as unknown as ExecuteValidationProcessInputComponent;

    TestBed.configureTestingModule({
      imports: [ValidationProcessDefinitionExecutorComponent],
      providers: [
        { provide: ValidationProcessExecutorService, useValue: service },
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(ValidationProcessDefinitionExecutorComponent, {
      remove: {
        imports: [ExecuteValidationProcessInputComponent],
      },
      add: {
        imports: [MockExecuteValidationProcessInputComponent],
      },
    });

    component = TestBed.createComponent(
      ValidationProcessDefinitionExecutorComponent
    ).componentInstance;

    component.inputComponent = inputComponent;
    component.projectId = projectId;
    component.definition = getDefinition();
  });

  it("when the user open the execute validation process modal, then show the modal with the inputs", () => {
    component.openExecutorModal();

    expect(component.isVisible).toBe(true);
    expect(inputComponent.initializeForm).toHaveBeenCalledWith(projectId, [
      {
        inputId: "someInputId",
        value: "someValue",
      },
    ]);
  });

  it("when the user close the execute validation process modal, then hide the modal and reset the form", () => {
    component.isVisible = true;
    component.hideExecutorModal();

    expect(component.isVisible).toBe(false);
    expect(inputComponent.resetForm).toHaveBeenCalled();
  });

  it("when the user execute a validation process, then execute one and navigate to its page", () => {
    component.executeValidationDefinition();

    expect(service.executeValidationProcessDefinition).toHaveBeenCalledWith(
      projectId,
      {
        definitionId: definitionId,
        name: name,
        official: true,
        notificationsRecipients: notificationsRecipients,
        configurationParameters: {
          repositoryId: repositoryId,
          businessProcessQualityLevel: businessProcessQualityLevel,
          createBranch: true,
          parentBranchName: parentBranchName,
          archivalBranchName: archivalBranchName,
          configCommitId: configCommitId,
          rtpCommitId: rtpCommitId,
          finalProductId: finalProductId,
        },
        testParameters: {
          qualityGateScenarioDefinitionIds: qualityGateScenarioDefinitionIds,
          nightlyRepusherEnabled: true,
        },
        infrastructureParameters: {
          qualityGateInfraGroupId: qualityGateInfraGroupId,
        },
        validationScopeParameters: {
          startCommitId: validationScopeStartCommitId,
        },
      }
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      `app/${projectId}/business-process/validation-processes/execution/${validationProcessExecutionId}`
    );
    expect(component.isVisible).toBe(false);
  });

  it("given the execute form is not valid, when the user execute a validation process, then do not execute one", () => {
    component.inputComponent = {
      form: {
        valid: false,
      },
    } as unknown as ExecuteValidationProcessInputComponent;

    component.executeValidationDefinition();

    expect(service.executeValidationProcessDefinition).not.toHaveBeenCalled();
  });

  it("given executing a validation process failed, when the user execute a validation process, then show the error", () => {
    jest
      .spyOn(service, "executeValidationProcessDefinition")
      .mockReturnValue(throwError(() => new Error(errorMessage)));

    component.executeValidationDefinition();

    expect(component.errorMessage).toBe(errorMessage);
  });

  it("when the system is executing a validation process, show the user a loading state", () => {
    expect(component.isExecuting).toBe(false);

    const subject = new Subject<ExecuteValidationProcessResponse>();
    jest
      .spyOn(service, "executeValidationProcessDefinition")
      .mockReturnValue(subject);
    component.executeValidationDefinition();

    expect(component.isExecuting).toBe(true);

    subject.next(getExecutionValidationProcessDefinitionResponse());

    expect(component.isExecuting).toBe(false);
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

  function getInputs(): ExecuteValidationProcessInput {
    return {
      name: name,
      official: true,
      notificationsRecipients: notificationsRecipients,
      repositoryId: repositoryId,
      businessProcessQualityLevel: businessProcessQualityLevel,
      createBranch: true,
      parentBranchName: parentBranchName,
      archivalBranchName: archivalBranchName,
      configCommitId: configCommitId,
      rtpCommitId: rtpCommitId,
      finalProductId: finalProductId,
      qualityGateScenarioDefinitionIds: qualityGateScenarioDefinitionIds,
      nightlyRepusherEnabled: true,
      qualityGateInfraGroupId: qualityGateInfraGroupId,
      validationScopeStartCommitId: validationScopeStartCommitId,
    };
  }

  function getExecutionValidationProcessDefinitionResponse(): ExecuteValidationProcessResponse {
    return {
      id: validationProcessExecutionId,
    };
  }
});

@Component({
  selector: "mxevolve-execute-validation-process-definition-inputs",
  template: "",
})
class MockExecuteValidationProcessInputComponent {}
