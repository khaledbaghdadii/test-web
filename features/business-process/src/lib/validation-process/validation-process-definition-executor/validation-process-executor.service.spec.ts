import { ValidationProcessExecutorService } from "./validation-process-executor.service";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { ExecuteValidationProcessRequest } from "./execute-validation-process-request";
import { ExecuteValidationProcessResponse } from "./execute-validation-process-response";
import { v4 as uuidv4 } from "uuid";
import { TestBed } from "@angular/core/testing";

describe("Validation process executor service test", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const name = uuidv4();
  const definitionId = uuidv4();
  const repositoryId = uuidv4();
  const qualityLevel = uuidv4();
  const parentBranchName = uuidv4();
  const archivalBranchName = uuidv4();
  const configCommitId = uuidv4();
  const rtpCommitId = uuidv4();
  const finalProductId = uuidv4();
  const qualityGateScenarioDefinitionIds = [uuidv4(), uuidv4()];
  const qualityGateInfraGroupId = uuidv4();
  const validationProcessExecutionId = uuidv4();
  const errorMessage = uuidv4();

  let httpClient: HttpClient;
  let environmentProvider: AppConfig;
  let service: ValidationProcessExecutorService;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(() => of(getExecuteValidationProcessResponse())),
    } as unknown as HttpClient;

    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: environmentProvider },
        ValidationProcessExecutorService,
      ],
    });

    service = TestBed.inject(ValidationProcessExecutorService);
  });

  it("when user request to execute a validation process, then call the server to execute one and return the id", async () => {
    const response = await lastValueFrom(
      service.executeValidationProcessDefinition(
        projectId,
        getExecuteValidationProcessRequest()
      )
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      `${gatewayUrl}projects/${projectId}/business-process/executions/master-validation/execute`,
      getExecuteValidationProcessRequest()
    );
    expect(response).toStrictEqual(getExecuteValidationProcessResponse());
  });

  it("should throw error message in case of failure", async () => {
    jest.spyOn(httpClient, "post").mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        service.executeValidationProcessDefinition(
          projectId,
          getExecuteValidationProcessRequest()
        )
      )
    ).rejects.toThrow(errorMessage);
  });

  function getExecuteValidationProcessRequest(): ExecuteValidationProcessRequest {
    return {
      name: name,
      definitionId: definitionId,
      official: true,
      configurationParameters: {
        repositoryId: repositoryId,
        qualityLevel: qualityLevel,
        createBranch: true,
        parentBranchName: parentBranchName,
        archivalBranchName: archivalBranchName,
        configCommitId: configCommitId,
        rtpCommitId: rtpCommitId,
        finalProductId: finalProductId,
      },
      testParameters: {
        qualityGateScenarioDefinitionIds: qualityGateScenarioDefinitionIds,
        nightlyRepusherEnabled: false,
      },
      infrastructureParameters: {
        qualityGateInfraGroupId: qualityGateInfraGroupId,
      },
    };
  }

  function getExecuteValidationProcessResponse(): ExecuteValidationProcessResponse {
    return {
      id: validationProcessExecutionId,
    };
  }
});
