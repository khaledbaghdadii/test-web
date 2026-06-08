import { lastValueFrom, of, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import { BuildAndTestProcessExecutorService } from "./build-and-test-process-executor.service";
import { v4 as uuidv4 } from "uuid";
import { ExecuteBuildAndTestProcessRequest } from "./execute-build-and-test-process-request";
import { ExecuteBuildAndTestProcessResponse } from "./execute-build-and-test-process-response";

describe("Build and test process executor service test", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const name = uuidv4();
  const definitionId = uuidv4();
  const repositoryId = uuidv4();
  const firstUserStoryId = uuidv4();
  const secondUserStoryId = uuidv4();
  const configurationParentBranch = uuidv4();
  const configurationBranchName = uuidv4();
  const buildAndTestInfraGroup = uuidv4();
  const buildEnvironmentInfraGroup = uuidv4();
  const buildEnvironmentScenarioDefinitionId = uuidv4();
  const buildAndTestExecutionId = uuidv4();
  const errorMessage = uuidv4();

  let httpClient: HttpClient;
  let environmentProvider: AppConfig;
  let service: BuildAndTestProcessExecutorService;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(() => of(getExecuteBuildAndTestProcessResponse())),
    } as unknown as HttpClient;

    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: environmentProvider },
        BuildAndTestProcessExecutorService,
      ],
    });

    service = TestBed.inject(BuildAndTestProcessExecutorService);
  });

  it("when user request to execute a build and test process, then call the server to execute one and return the id", async () => {
    const response = await lastValueFrom(
      service.executeBuildAndTestProcessDefinition(
        projectId,
        getExecuteBuildAndTestProcessRequest()
      )
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      `${gatewayUrl}projects/${projectId}/business-process/executions/ci-process`,
      getExecuteBuildAndTestProcessRequest()
    );
    expect(response).toStrictEqual(getExecuteBuildAndTestProcessResponse());
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
        service.executeBuildAndTestProcessDefinition(
          projectId,
          getExecuteBuildAndTestProcessRequest()
        )
      )
    ).rejects.toThrow(errorMessage);
  });

  function getExecuteBuildAndTestProcessRequest(): ExecuteBuildAndTestProcessRequest {
    return {
      name: name,
      definitionId: definitionId,
      repositoryId: repositoryId,
      buildEnvironmentInfraGroup: buildEnvironmentInfraGroup,
      buildAndTestInfraGroup: buildAndTestInfraGroup,
      configurationBranchName: configurationBranchName,
      configurationParentBranch: configurationParentBranch,
      buildEnvironmentScenarioDefinitionId:
        buildEnvironmentScenarioDefinitionId,
      skipPrepareBuildEnvironment: true,
      userStoryIds: [firstUserStoryId, secondUserStoryId],
      notificationsRecipients: ["test1@example.com", "test2@example.com"],
    };
  }

  function getExecuteBuildAndTestProcessResponse(): ExecuteBuildAndTestProcessResponse {
    return {
      id: buildAndTestExecutionId,
    };
  }
});
