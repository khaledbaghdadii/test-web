import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { MergeRequestService } from "./merge-request.service";
import { MergeRequestState } from "./merge-request-overview.model";
import { MergeRequestPriority } from "./merge-request-priority.model";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_FILTER_REQUEST = {
  developmentId: "dev-1",
  contextId: "process-1",
};

const MOCK_API_RESPONSE = {
  content: [
    {
      id: "mr-1",
      pullRequestId: "pr-123",
      mergeRequestState: "MERGED",
      createdOn: "2026-03-01T10:00:00Z",
    },
    {
      id: "mr-2",
      pullRequestId: "pr-456",
      mergeRequestState: "DECLINED",
      createdOn: "2026-02-28T10:00:00Z",
    },
  ],
};

describe("MergeRequestService", () => {
  let service: MergeRequestService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MergeRequestService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(MergeRequestService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch filtered merge requests and map response", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeRequests("project-1", MOCK_FILTER_REQUEST)
    );

    const req = httpController.expectOne(
      (r) =>
        r.url ===
          `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/filter` &&
        r.method === "POST" &&
        r.params.get("sort") === "createdOn,desc" &&
        r.params.get("page") === "0" &&
        r.params.get("size") === "200"
    );
    expect(req.request.body).toEqual(MOCK_FILTER_REQUEST);
    req.flush(MOCK_API_RESPONSE);

    expect(await result).toEqual([
      {
        pullRequestId: "pr-123",
        mergeRequestState: MergeRequestState.MERGED,
        createdOn: "2026-03-01T10:00:00Z",
      },
      {
        pullRequestId: "pr-456",
        mergeRequestState: MergeRequestState.DECLINED,
        createdOn: "2026-02-28T10:00:00Z",
      },
    ]);
  });

  it("should return empty array when no merge requests match", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeRequests("project-1", MOCK_FILTER_REQUEST)
    );

    const req = httpController.expectOne(
      (r) => r.url.includes("merge-requests/filter") && r.method === "POST"
    );
    req.flush({ content: [] });

    expect(await result).toEqual([]);
  });

  it("should map server error message on failure", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeRequests("project-1", MOCK_FILTER_REQUEST)
    ).catch((e) => e);

    httpController
      .expectOne(
        (r) => r.url.includes("merge-requests/filter") && r.method === "POST"
      )
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Not found");
  });

  it("should use fallback message when no server message", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeRequests("project-1", MOCK_FILTER_REQUEST)
    ).catch((e) => e);

    httpController
      .expectOne(
        (r) => r.url.includes("merge-requests/filter") && r.method === "POST"
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });

  it("should use hardcoded fallback when error has no message at all", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeRequests("project-1", MOCK_FILTER_REQUEST)
    ).catch((e) => e);

    httpController
      .expectOne(
        (r) => r.url.includes("merge-requests/filter") && r.method === "POST"
      )
      .error(new ProgressEvent("error"), {
        status: 0,
        statusText: "",
      });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
  });
});

describe("MergeRequestService - getMergeRequestById", () => {
  let service: MergeRequestService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MergeRequestService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(MergeRequestService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch a merge request by id and map response", async () => {
    const mockApiResponse = {
      id: "mr-789",
      pullRequestId: "pr-789",
      mergeRequestState: "IN_REVIEW",
      createdOn: "2026-04-01T10:00:00Z",
      pullRequestUrl: "https://scm.example.com/pr/789",
      mergeConfiguration: {
        branchName: "main",
      },
    };

    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-1")
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-1`
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockApiResponse);

    expect(await result).toEqual({
      id: "mr-789",
      pullRequestId: "pr-789",
      mergeRequestState: MergeRequestState.IN_REVIEW,
      createdOn: "2026-04-01T10:00:00Z",
      pullRequestUrl: "https://scm.example.com/pr/789",
      destinationBranch: "main",
      failureReason: undefined,
      mergeRequestPriority: undefined,
      queuePosition: undefined,
      queuedDate: undefined,
      endDate: undefined,
      isLastBuildInBulkMode: undefined,
      development: undefined,
      mergeConfiguration: undefined,
      builds: undefined,
      stateTransitions: undefined,
      owner: undefined,
      projectId: undefined,
    });
  });

  it("should use response.id as fallback when pullRequestId is missing", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-2")
    );

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-2`
      )
      .flush({
        id: "fallback-id",
        mergeRequestState: "MERGED",
      });

    expect((await result).pullRequestId).toBe("fallback-id");
  });

  it("should return server error message on failure", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-3")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-3`
      )
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Not found");
  });

  it("should use fallback message when no server message on getMergeRequestById", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-4")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-4`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });

  it("should use hardcoded fallback when getMergeRequestById error has no message", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-5")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-5`
      )
      .error(new ProgressEvent("error"), {
        status: 0,
        statusText: "",
      });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
  });

  it("should handle missing mergeConfiguration gracefully", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-6")
    );

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-6`
      )
      .flush({
        id: "mr-999",
        pullRequestId: "pr-999",
        mergeRequestState: "QUEUED",
        pullRequestUrl: "https://example.com/pr/999",
      });

    const mapped = await result;
    expect(mapped.destinationBranch).toBeUndefined();
    expect(mapped.pullRequestUrl).toBe("https://example.com/pr/999");
  });

  it("should map all new fields when fully populated", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-full")
    );

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-full`
      )
      .flush({
        id: "mr-full",
        pullRequestId: "pr-full",
        mergeRequestState: "UNDER_VALIDATION",
        createdOn: "2026-04-01T10:00:00Z",
        pullRequestUrl: "https://example.com/pr/full",
        mergeConfiguration: {
          id: "mc-1",
          branchName: "main",
        },
        failureReason: "CQG_FAILURE",
        mergeRequestPriority: "HIGH",
        queuePosition: 3,
        queuedDate: "2026-04-01T09:00:00Z",
        endDate: "2026-04-01T11:00:00Z",
        isLastBuildInBulkMode: false,
        development: {
          id: "dev-1",
          name: "feature/my-branch",
          projectId: "project-1",
          repository: { id: "repo-1" },
        },
        builds: [
          { id: "build-1", scenarioExecutionId: "exec-1", bulkMode: false },
          { id: "build-2", bulkMode: true },
        ],
        stateTransitions: [
          {
            mergeRequestPreviousState: "QUEUED",
            mergeRequestCurrentState: "UNDER_VALIDATION",
            transitionedOn: "2026-04-01T09:30:00Z",
          },
        ],
        owner: "alice",
        projectId: "project-1",
      });

    const mapped = await result;
    expect(mapped.failureReason).toBe("CQG_FAILURE");
    expect(mapped.mergeRequestPriority).toBe("HIGH");
    expect(mapped.queuePosition).toBe(3);
    expect(mapped.queuedDate).toBe("2026-04-01T09:00:00Z");
    expect(mapped.endDate).toBe("2026-04-01T11:00:00Z");
    expect(mapped.isLastBuildInBulkMode).toBe(false);
    expect(mapped.development).toEqual({
      id: "dev-1",
      name: "feature/my-branch",
      projectId: "project-1",
      repository: { id: "repo-1" },
    });
    expect(mapped.mergeConfiguration).toEqual({
      id: "mc-1",
      branchName: "main",
    });
    expect(mapped.builds).toHaveLength(2);
    expect(mapped.builds![0].scenarioExecutionId).toBe("exec-1");
    expect(mapped.stateTransitions).toHaveLength(1);
    expect(mapped.stateTransitions![0].mergeRequestPreviousState).toBe(
      "QUEUED"
    );
    expect(mapped.stateTransitions![0].mergeRequestCurrentState).toBe(
      "UNDER_VALIDATION"
    );
    expect(mapped.owner).toBe("alice");
    expect(mapped.projectId).toBe("project-1");
  });

  it("should set mergeConfiguration to undefined when mergeConfiguration has branchName but no id", async () => {
    const result = firstValueFrom(
      service.getMergeRequestById("project-1", "mr-no-mc-id")
    );

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-no-mc-id`
      )
      .flush({
        id: "mr-no-mc-id",
        mergeRequestState: "IN_REVIEW",
        mergeConfiguration: {
          branchName: "main",
        },
      });

    const mapped = await result;
    expect(mapped.destinationBranch).toBe("main");
    expect(mapped.mergeConfiguration).toBeUndefined();
  });
});

describe("MergeRequestService - updateMergeRequestPriority", () => {
  let service: MergeRequestService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MergeRequestService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(MergeRequestService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should send PATCH request with priority", async () => {
    const result = firstValueFrom(
      service.updateMergeRequestPriority(
        "project-1",
        "mr-1",
        MergeRequestPriority.HIGH
      )
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-1/priority`
    );
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({
      mergeRequestPriority: MergeRequestPriority.HIGH,
    });
    req.flush({});

    expect(await result).toEqual({});
  });

  it("should map server error message on failure", async () => {
    const result = firstValueFrom(
      service.updateMergeRequestPriority(
        "project-1",
        "mr-1",
        MergeRequestPriority.HIGH
      )
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-1/priority`
      )
      .flush(
        { message: "Priority update failed" },
        { status: 400, statusText: "Bad Request" }
      );

    const error = (await result) as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Priority update failed");
  });

  it("should use fallback message when no server message", async () => {
    const result = firstValueFrom(
      service.updateMergeRequestPriority(
        "project-1",
        "mr-1",
        MergeRequestPriority.LOW
      )
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/merge-requests/mr-1/priority`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = (await result) as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });
});
