import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { BackportProcessExecutorService } from "./backport-process-executor.service";
import { lastValueFrom, of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { v4 as uuidv4 } from "uuid";
import { ExecuteBackportProcessResponse } from "./execute-backport-process-response";
import { ExecuteBackportProcessRequest } from "./execute-backport-process-request";

describe("Backport process executor service test", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const backportExecutionId = uuidv4();
  const name = uuidv4();
  const definitionId = uuidv4();
  const repositoryId = uuidv4();
  const destinationMergeConfigurationId = uuidv4();
  const pullRequestToBeBackported = uuidv4();
  const pullRequestTitle = uuidv4();
  const reviewerName = uuidv4();
  const userStories = [uuidv4(), uuidv4()];
  const buildAndTestInfraGroup = uuidv4();
  const notificationsRecipients = ["test1@example.com", "test2@example.com"];
  const errorMessage = uuidv4();

  let httpClient: HttpClient;
  let environmentProvider: AppConfig;
  let service: BackportProcessExecutorService;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(() => of(getExecuteBackportProcessResponse())),
    } as unknown as HttpClient;

    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: environmentProvider },
        BackportProcessExecutorService,
      ],
    });

    service = TestBed.inject(BackportProcessExecutorService);
  });

  it("when the user request to execute a backport process, then should initiate backport process execution and return execution id", async () => {
    const response = await lastValueFrom(
      service.executeBackportProcessDefinition(
        projectId,
        getExecuteBackportProcessRequest()
      )
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      `${gatewayUrl}projects/${projectId}/business-process/executions/ci-process/backport`,
      getExecuteBackportProcessRequest()
    );

    expect(response).toStrictEqual(getExecuteBackportProcessResponse());
  });

  it("when backport process cannot be executed then should return failure", async () => {
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
        service.executeBackportProcessDefinition(
          projectId,
          getExecuteBackportProcessRequest()
        )
      )
    ).rejects.toThrow(errorMessage);
  });

  function getExecuteBackportProcessResponse(): ExecuteBackportProcessResponse {
    return {
      id: backportExecutionId,
    };
  }

  function getExecuteBackportProcessRequest(): ExecuteBackportProcessRequest {
    return {
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
    };
  }
});
