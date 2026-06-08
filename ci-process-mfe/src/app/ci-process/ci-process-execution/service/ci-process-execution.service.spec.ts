import { TestBed } from "@angular/core/testing";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { CiProcessExecutionService } from "./ci-process-execution.service";
import { EnvironmentProvider } from "../../../../environments/environment";
import { SendChangesForReviewRequest } from "./model/send-changes-for-review-request";
import { SendChangesForReviewApiRequest } from "./model/send-changes-for-review-api-request";
import { CommitsCherryPickedRequest } from "./model/commits-cherry-picked-request";
import { CommitsCherryPickedApiRequest } from "./model/commits-cherry-picked-api-request";
import { RepushBackportMergeRequest } from "./model/repush-backport-merge-request";
import { RepushBackportMergeRequestApiRequest } from "./model/repush-backport-merge-request-api-request";
import { ReopenMergeRequestRequest } from "./model/reopen-merge-request-request";
import { ReopenMergeRequestApiRequest } from "./model/reopen-merge-request-api-request";
import { lastValueFrom, of, throwError } from "rxjs";

describe("ci process execution service", () => {
  const ciProcessId = "ciProcessId";
  const projectId = "projectId";
  const developmentID = "developmentID";
  const backportDestinationBranchName = "backportDestinationBranchName";
  const mergeConfigurationId = "mergeConfigurationId";
  const title = "title";
  const reviewer = "reviewer";
  const backportMergeConfigurationId = "backportMergeConfigurationId";
  const errorMessage = "ERROR_MESSAGE";
  const backportDefinitionId = "onDemandBackportDefinitionId";
  const backportRepositoryId = "onDemandBackportRepositoryId";
  const backportMergeConfigId = "onDemandBackportMergeConfigId";
  const backportInfraGroup = "onDemandBackportInfraGroup";

  const sendChangesForReviewRequest: SendChangesForReviewRequest = {
    projectId: projectId,
    ciProcessExecutionId: ciProcessId,
    mergeConfigurationId: mergeConfigurationId,
    mergeJobTitle: title,
    mergeJobReviewers: [reviewer],
    backportChanges: true,
    backportMergeConfigurationIds: [backportMergeConfigurationId],
    backportInputs: [
      {
        definitionId: backportDefinitionId,
        repositoryId: backportRepositoryId,
        mergeConfigurationId: backportMergeConfigId,
        buildAndTestInfraGroupId: backportInfraGroup,
      },
    ],
    shouldCleanDevelopment: true,
    developmentId: developmentID,
    supportsResourceManagement: true,
  };

  const sendChangesForReviewApiRequest: SendChangesForReviewApiRequest = {
    mergeConfigurationId: mergeConfigurationId,
    mergeJobTitle: title,
    mergeJobReviewers: [reviewer],
    backportChanges: true,
    backportMergeConfigurationIds: [backportMergeConfigurationId],
    backportInputs: [
      {
        definitionId: backportDefinitionId,
        repositoryId: backportRepositoryId,
        mergeConfigurationId: backportMergeConfigId,
        buildAndTestInfraGroupId: backportInfraGroup,
      },
    ],
    shouldCleanDevelopment: true,
    developmentId: developmentID,
    supportsResourceManagement: true,
  };

  let httpClient: HttpClient;
  let ciProcessExecutionService: CiProcessExecutionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CiProcessExecutionService,
        {
          provide: HttpClient,
          useValue: { post: jest.fn(() => of({})) },
        },
        {
          provide: EnvironmentProvider,
          useValue: { getEnvironment: () => ({ gatewayUrl: "gateway/" }) },
        },
      ],
    });

    ciProcessExecutionService = TestBed.inject(CiProcessExecutionService);
    httpClient = TestBed.inject(HttpClient);
  });

  it("should send changes for review correctly", async () => {
    await lastValueFrom(
      ciProcessExecutionService.sendChangesForReview(
        sendChangesForReviewRequest
      )
    );
    expect(httpClient.post).toHaveBeenCalledWith(
      `gateway/projects/${projectId}/business-process/executions/ci-process/${ciProcessId}/user-input/send-changes-for-review`,
      sendChangesForReviewApiRequest
    );
  });

  it("should display an error message when failing to send changes for review", async () => {
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        ciProcessExecutionService.sendChangesForReview(
          sendChangesForReviewRequest
        )
      )
    ).rejects.toThrow(errorMessage);
  });

  it("should repush the environment correctly", async () => {
    await lastValueFrom(
      ciProcessExecutionService.repushEnvironment(projectId, ciProcessId)
    );
    expect(httpClient.post).toHaveBeenCalledWith(
      `gateway/projects/${projectId}/business-process/executions/ci-process/${ciProcessId}/user-input/repush-prepare-build-environment`,
      {}
    );
  });

  it("should display an error message when failing to repush an environment", async () => {
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        ciProcessExecutionService.repushEnvironment(projectId, ciProcessId)
      )
    ).rejects.toThrow(errorMessage);
  });

  it("should fix integration issues correctly", async () => {
    await lastValueFrom(
      ciProcessExecutionService.fixIntegrationIssues(projectId, ciProcessId)
    );
    expect(httpClient.post).toHaveBeenCalledWith(
      `gateway/projects/${projectId}/business-process/executions/ci-process/${ciProcessId}/user-input/fix-integration-issues`,
      {}
    );
  });

  it("should display an error message when failing to fix integration issues", async () => {
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        ciProcessExecutionService.fixIntegrationIssues(projectId, ciProcessId)
      )
    ).rejects.toThrow(errorMessage);
  });

  it("should send commits cherry picked correctly", async () => {
    await lastValueFrom(
      ciProcessExecutionService.commitsCherryPicked(
        getCommitsCherryPickedRequest()
      )
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      `gateway/projects/${projectId}/business-process/executions/ci-process/${ciProcessId}/user-input/commits-cherry-picked`,
      getCommitsCherryPickedApiRequest()
    );
  });

  test("should display an error message when failing to send commits cherry picked", async () => {
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        ciProcessExecutionService.commitsCherryPicked(
          getCommitsCherryPickedRequest()
        )
      )
    ).rejects.toThrow(errorMessage);
  });

  it("should repush backport merge request correctly", async () => {
    await lastValueFrom(
      ciProcessExecutionService.repushBackportMergeRequest(
        getRepushBackportMergeRequest()
      )
    );
    expect(httpClient.post).toHaveBeenCalledWith(
      `gateway/projects/${projectId}/business-process/executions/ci-process/${ciProcessId}/user-input/repush-backport-merge-job`,
      getRepushBackportMergeRequestApiRequest()
    );
  });

  it("should display an error message when failing to repush a backport merge request", async () => {
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        ciProcessExecutionService.repushBackportMergeRequest(
          getRepushBackportMergeRequest()
        )
      )
    ).rejects.toThrow(errorMessage);
  });

  it("given an error with no proper message property, then the system should handle the error display correctly", async () => {
    const error = { error: "Error" } as HttpErrorResponse;
    jest.spyOn(httpClient, "post").mockReturnValueOnce(throwError(() => error));

    await expect(
      lastValueFrom(
        ciProcessExecutionService.repushBackportMergeRequest(
          getRepushBackportMergeRequest()
        )
      )
    ).rejects.toThrow("Error");
  });

  describe("reopenMergeRequest", () => {
    const reopenMergeRequestRequest: ReopenMergeRequestRequest = {
      projectId,
      ciProcessExecutionId: ciProcessId,
      title,
      reviewers: [reviewer],
    };

    const reopenMergeRequestApiRequest: ReopenMergeRequestApiRequest = {
      title,
      reviewers: [reviewer],
    };

    it("given a merge request is reopenable when the user requests to reopen it then it should reopen", async () => {
      await lastValueFrom(
        ciProcessExecutionService.reopenMergeRequest(reopenMergeRequestRequest)
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        `gateway/projects/${projectId}/business-process/executions/ci-process/${ciProcessId}/user-input/reopen-merge-request`,
        reopenMergeRequestApiRequest
      );
    });

    it("when an error occurs when reopening the merge request then it should throw an error", async () => {
      jest.spyOn(httpClient, "post").mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: { message: errorMessage },
            })
        )
      );

      await expect(
        lastValueFrom(
          ciProcessExecutionService.reopenMergeRequest(
            reopenMergeRequestRequest
          )
        )
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("proceedWithPredefinedInputs", () => {
    it("should call proceed-with-predefined-inputs endpoint", async () => {
      const request = {
        projectId: "project-123",
        ciProcessExecutionId: "process-456",
        shouldCleanDevelopment: true,
        developmentId: "dev-789",
        supportsResourceManagement: true,
      };

      await lastValueFrom(
        ciProcessExecutionService.proceedWithPredefinedInputs(request)
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(
          "/process-456/user-input/proceed-with-predefined-inputs"
        ),
        {
          shouldCleanDevelopment: true,
          developmentId: "dev-789",
          supportsResourceManagement: true,
        }
      );
    });
  });

  function getCommitsCherryPickedRequest(): CommitsCherryPickedRequest {
    return {
      projectId: projectId,
      processExecutionId: ciProcessId,
      mergeConfigurationId: backportDestinationBranchName,
    };
  }

  function getCommitsCherryPickedApiRequest(): CommitsCherryPickedApiRequest {
    return {
      mergeConfigurationId: backportDestinationBranchName,
    };
  }

  function getRepushBackportMergeRequest(): RepushBackportMergeRequest {
    return {
      projectId: projectId,
      processExecutionId: ciProcessId,
      mergeConfigurationId: backportDestinationBranchName,
    };
  }

  function getRepushBackportMergeRequestApiRequest(): RepushBackportMergeRequestApiRequest {
    return {
      mergeConfigurationId: backportDestinationBranchName,
    };
  }
});
