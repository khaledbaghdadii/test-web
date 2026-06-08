import { MergeRequestService } from "./merge-request.service";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { AppConfig } from "@mxflow/config";
import { MergeRequestApiPage } from "./model/response/merge-request-api-page";
import {
  MergeRequest,
  MergeRequestPriority,
  MergeRequestProcessingMode,
  MergeRequestReviewer,
  MergeRequestState,
  MergeRequestStatus,
} from "./model/merge-request";
import { MergeRequestPage } from "./model/merge-request-page";
import { MergeRequestApiResponse } from "./model/response/merge-request-api-response";
import { MergeRequestFilterRequest } from "./model/request/merge-request-filter-request";
import { MergeRequestApiFilterRequest } from "./model/request/merge-request-api-filter-request";
import { UpdateProcessingModeRequest } from "./model/request/update-processing-mode-request";
import { UpdateProcessingModeResponse } from "./model/response/update-processing-mode-response";

describe("Service: MergeRequestService", () => {
  const GATEWAY_URL = "https://gateway.cd.murex.com/api/v1/";
  const PROJECT_ID = "projetcId";
  const MERGE_REQUEST_ID = "mergeRequestId";
  const REVIEWER: MergeRequestReviewer = {
    displayName: "John Doe",
    name: "johndoe",
  };
  const MERGE_REQUEST = {
    id: MERGE_REQUEST_ID,
    projectId: PROJECT_ID,
    title: "merge request",
    development: {
      id: "1",
      name: "development",
      projectId: "1",
      repositoryId: "1",
    },
    mergeConfiguration: {
      id: "1",
      branchName: "branch",
      projectId: "1",
    },
    contextId: "1",
    pullRequestId: "1",
    pullRequestUrl: "url",
    mergeRequestStatus: MergeRequestStatus.IN_PROGRESS,
    mergeRequestState: MergeRequestState.IN_REVIEW,
    mergeRequestPriority: MergeRequestPriority.MEDIUM,
    isReOpenable: true,
    reviewers: [REVIEWER],
  } as MergeRequest;
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;
  const DEFAULT_PAGE_INDEX = 0;
  const DEFAULT_PAGE_SIZE = 20;
  const ERROR_MESSAGE = "error";

  let service: MergeRequestService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    } as unknown as HttpClient;

    service = new MergeRequestService(appConfig, httpClient);
  });

  it("should get all merge requests of a project with default pageable params", async () => {
    jest.spyOn(httpClient, "get").mockReturnValue(of(getMergeRequestApiPage()));

    service.getAllMergeRequests(PROJECT_ID).subscribe({
      next: (data) => {
        expect(data).toEqual(getMergeRequestPage());
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests?page=${DEFAULT_PAGE_INDEX}&size=${DEFAULT_PAGE_SIZE}`
    );
  });

  it("should get all merge requests of a project with pageable params", async () => {
    const pageIndex = 1;
    const pageSize = 10;
    jest.spyOn(httpClient, "get").mockReturnValue(of(getMergeRequestApiPage()));

    service.getAllMergeRequests(PROJECT_ID, pageIndex, pageSize).subscribe({
      next: (data) => {
        expect(data).toEqual(getMergeRequestPage());
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests?page=${pageIndex}&size=${pageSize}`
    );
  });

  it("should throw an error on failure to get merge requests of a project", async () => {
    const errorResponse = {
      error: {
        status: 500,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => errorResponse));

    service.getAllMergeRequests(PROJECT_ID).subscribe({
      error: (error) => {
        expect(error.message).toEqual(ERROR_MESSAGE);
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests?page=${DEFAULT_PAGE_INDEX}&size=${DEFAULT_PAGE_SIZE}`
    );
  });

  it("should get merge request of a project by id", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(getMergeRequestApiResponse()));

    service.getMergeRequest(PROJECT_ID, MERGE_REQUEST_ID).subscribe({
      next: (data) => {
        expect(data).toEqual(MERGE_REQUEST);
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}`
    );
  });

  it("should throw an error on failure to get a merge request of a project by id", async () => {
    const errorResponse = {
      error: {
        status: 404,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => errorResponse));

    service.getMergeRequest(PROJECT_ID, MERGE_REQUEST_ID).subscribe({
      error: (error) => {
        expect(error.message).toEqual(ERROR_MESSAGE);
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}`
    );
  });

  it("should throw custom error on 500 failure to get a merge request of a project by id", async () => {
    const errorResponse = {
      status: 500,
      error: {
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => errorResponse));

    await expect(
      new Promise((resolve, reject) => {
        service.getMergeRequest(PROJECT_ID, MERGE_REQUEST_ID).subscribe({
          next: resolve,
          error: reject,
        });
      })
    ).rejects.toThrow("Failed to get merge request details");

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}`
    );
  });

  it("should get filtered merge requests of a project", async () => {
    const filterRequest: MergeRequestFilterRequest =
      getMergeRequestFilterRequest();
    const filterApiRequest: MergeRequestApiFilterRequest =
      getMergeRequestFilterRequest() as MergeRequestApiFilterRequest;
    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(of(getMergeRequestApiPage()));

    service.getFilteredMergeRequests(PROJECT_ID, filterRequest).subscribe({
      next: (data) => {
        expect(data).toEqual(getMergeRequestPage());
      },
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/filter?sort=mergeRequestState&sort=createdOn,desc&page=${DEFAULT_PAGE_INDEX}&size=${DEFAULT_PAGE_SIZE}`,
      filterApiRequest
    );
  });

  it("should throw an error on failure to get filtered merge requests of a project", async () => {
    const filterRequest: MergeRequestFilterRequest =
      getMergeRequestFilterRequest();
    const filterApiRequest: MergeRequestApiFilterRequest =
      getMergeRequestFilterRequest() as MergeRequestApiFilterRequest;
    const errorResponse = {
      error: {
        status: 500,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(throwError(() => errorResponse));

    service.getFilteredMergeRequests(PROJECT_ID, filterRequest).subscribe({
      error: (error) => {
        expect(error.message).toEqual(ERROR_MESSAGE);
      },
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/filter?sort=mergeRequestState&sort=createdOn,desc&page=${DEFAULT_PAGE_INDEX}&size=${DEFAULT_PAGE_SIZE}`,
      filterApiRequest
    );
  });

  it("should get builds of a merge request", async () => {
    const buildsResponse = [{ scenarioExecutionId: "1" }];
    jest.spyOn(httpClient, "get").mockReturnValue(of(buildsResponse));

    service.getMergeRequestBuilds(PROJECT_ID, MERGE_REQUEST_ID).subscribe({
      next: (data) => {
        expect(data).toEqual(buildsResponse);
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}/builds`
    );
  });

  it("should throw an error on failure to get builds of a merge request", async () => {
    const errorResponse = {
      error: {
        status: 500,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => errorResponse));

    service.getMergeRequestBuilds(PROJECT_ID, MERGE_REQUEST_ID).subscribe({
      error: (error) => {
        expect(error.message).toEqual(ERROR_MESSAGE);
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}/builds`
    );
  });

  it("should update merge request priority", async () => {
    jest
      .spyOn(httpClient, "patch")
      .mockReturnValue(of(getMergeRequestApiResponse()));

    service
      .updateMergeRequestPriority(
        PROJECT_ID,
        MERGE_REQUEST_ID,
        MergeRequestPriority.LOW
      )
      .subscribe({
        next: (data) => {
          expect(data).toEqual(MERGE_REQUEST);
        },
      });

    expect(httpClient.patch).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}/priority`,
      { mergeRequestPriority: MergeRequestPriority.LOW }
    );
  });

  it("should throw an error on failure to update merge request priority", (done) => {
    const errorResponse = {
      error: {
        status: 400,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "patch")
      .mockReturnValue(throwError(() => errorResponse));

    service
      .updateMergeRequestPriority(
        PROJECT_ID,
        MERGE_REQUEST_ID,
        MergeRequestPriority.LOW
      )
      .subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toEqual(ERROR_MESSAGE);
          done();
        },
      });

    expect(httpClient.patch).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/${MERGE_REQUEST_ID}/priority`,
      { mergeRequestPriority: MergeRequestPriority.LOW }
    );
  });

  it("should update processing mode", () => {
    const request: UpdateProcessingModeRequest = {
      processingModeUpdates: [
        {
          mergeRequestId: MERGE_REQUEST_ID,
          processingMode: MergeRequestProcessingMode.BULK,
        },
      ],
    };
    const response = {
      succeededMergeRequests: [],
      failedMergeRequests: [],
    } as UpdateProcessingModeResponse;
    jest.spyOn(httpClient, "patch").mockReturnValue(of(response));

    service.updateProcessingMode(PROJECT_ID, request).subscribe({
      next: (data) => {
        expect(data).toEqual(response);
      },
    });
    expect(httpClient.patch).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/processing-mode`,
      request
    );
  });

  it("should throw an error on failure to update processing mode", async () => {
    const request: UpdateProcessingModeRequest = {
      processingModeUpdates: [
        {
          mergeRequestId: MERGE_REQUEST_ID,
          processingMode: MergeRequestProcessingMode.SEQUENTIAL,
        },
      ],
    };
    const errorResponse = {
      error: {
        status: 500,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "patch")
      .mockReturnValue(throwError(() => errorResponse));

    await expect(
      new Promise((resolve, reject) => {
        service.updateProcessingMode(PROJECT_ID, request).subscribe({
          next: resolve,
          error: reject,
        });
      })
    ).rejects.toThrow(ERROR_MESSAGE);

    expect(httpClient.patch).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/processing-mode`,
      request
    );
  });

  it("should export merge requests to excel", async () => {
    const filterRequest: MergeRequestFilterRequest =
      getMergeRequestFilterRequest();
    const filterApiRequest: MergeRequestApiFilterRequest =
      getMergeRequestFilterRequest() as MergeRequestApiFilterRequest;
    const blob = new Blob(["test"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const mockResponse: HttpResponse<Blob> = {
      body: blob,
      headers: {
        get: jest.fn().mockReturnValue("attachment; filename=test.xlsx"),
      },
    } as unknown as HttpResponse<Blob>;
    jest.spyOn(httpClient, "post").mockReturnValue(of(mockResponse));

    const data = await new Promise<HttpResponse<Blob>>((resolve, reject) => {
      service.exportMergeRequestsToExcel(PROJECT_ID, filterRequest).subscribe({
        next: resolve,
        error: reject,
      });
    });

    expect(data).toEqual(mockResponse);
    expect(data.body).toEqual(blob);
    expect(httpClient.post).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/export?sort=mergeRequestState&sort=createdOn,desc`,
      filterApiRequest,
      { responseType: "blob", observe: "response" }
    );
  });

  it("should throw an error on failure to export merge requests to excel", async () => {
    const filterRequest: MergeRequestFilterRequest =
      getMergeRequestFilterRequest();
    const filterApiRequest: MergeRequestApiFilterRequest =
      getMergeRequestFilterRequest() as MergeRequestApiFilterRequest;
    const errorResponse = {
      error: {
        status: 500,
        message: ERROR_MESSAGE,
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      },
    };

    jest
      .spyOn(httpClient, "post")
      .mockReturnValue(throwError(() => errorResponse));

    await expect(
      new Promise((resolve, reject) => {
        service
          .exportMergeRequestsToExcel(PROJECT_ID, filterRequest)
          .subscribe({
            next: resolve,
            error: reject,
          });
      })
    ).rejects.toThrow(ERROR_MESSAGE);

    expect(httpClient.post).toHaveBeenCalledWith(
      `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/merge-requests/export?sort=mergeRequestState&sort=createdOn,desc`,
      filterApiRequest,
      { responseType: "blob", observe: "response" }
    );
  });

  function getMergeRequestFilterRequest(): MergeRequestFilterRequest {
    return {
      mergeRequestStates: ["IN_REVIEW", "MERGED"],
    };
  }

  function getMergeRequestApiResponse(): MergeRequestApiResponse {
    return MERGE_REQUEST as MergeRequestApiResponse;
  }

  function getMergeRequestApiPage(): MergeRequestApiPage {
    return {
      content: [MERGE_REQUEST],
      totalPages: 1,
      totalElements: 1,
      size: 1,
      number: 1,
      last: true,
    };
  }

  function getMergeRequestPage(): MergeRequestPage {
    return {
      content: [MERGE_REQUEST],
      totalPages: 1,
      totalElements: 1,
      size: 1,
      number: 1,
      last: true,
    };
  }
});
