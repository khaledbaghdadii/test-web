import { lastValueFrom, of, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { TestBed } from "@angular/core/testing";
import { v4 as uuidv4 } from "uuid";
import { ValidationProcessExecutorService } from "./validation-process-executor.service";
import { ExecuteValidationProcessRequest } from "./execute-validation-process-request";
import { ExecuteValidationProcessResponse } from "./execute-validation-process-response";

describe("Validation process executor service test", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const name = uuidv4();
  const definitionId = uuidv4();
  const repositoryId = uuidv4();
  const archivalBranchName = uuidv4();
  const validationExecutionId = uuidv4();
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
        { provide: GATEWAY_CONFIG, useValue: environmentProvider },
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
      notificationsRecipients: ["test1@example.com"],
      configurationParameters: {
        repositoryId: repositoryId,
        businessProcessQualityLevel: "MQG",
        createBranch: false,
        parentBranchName: "parent-branch",
        archivalBranchName: archivalBranchName,
        configCommitId: "config-commit",
        rtpCommitId: "rtp-commit",
        finalProductId: "final-product",
      },
      testParameters: {
        qualityGateScenarioDefinitionIds: ["scenario-1", "scenario-2"],
        nightlyRepusherEnabled: true,
      },
      infrastructureParameters: {
        qualityGateInfraGroupId: "infra-group",
      },
      validationScopeParameters: {
        startCommitId: "start-commit",
      },
    };
  }

  function getExecuteValidationProcessResponse(): ExecuteValidationProcessResponse {
    return {
      id: validationExecutionId,
    };
  }
});
