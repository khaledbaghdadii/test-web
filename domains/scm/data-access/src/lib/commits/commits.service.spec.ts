import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { CommitsService } from "./commits.service";
import { CommitDetails } from "./model/commit-details.model";
import { PaginatedCommitsPage } from "./model/paginated-commits-page.model";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_COMMITS: CommitDetails[] = [
  {
    id: "commit-1",
    committerDisplayName: "John Doe",
    committerDisplayEmail: "john@example.com",
    timeStamp: "2026-03-01T10:00:00Z",
    message: "fix: resolve issue",
    url: "https://bitbucket.org/commits/commit-1",
  },
  {
    id: "commit-2",
    committerDisplayName: "Jane Doe",
    committerDisplayEmail: "jane@example.com",
    timeStamp: "2026-03-02T12:00:00Z",
    message: "feat: add feature",
    url: "https://bitbucket.org/commits/commit-2",
  },
];

describe("CommitsService", () => {
  let service: CommitsService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CommitsService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(CommitsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch commit differences with correct params", async () => {
    const request = {
      projectId: "project-1",
      repositoryId: "repo-1",
      sourceBranch: "feature/my-branch",
      destinationBranch: "main",
    };

    const result = firstValueFrom(service.getCommitDifferences(request));

    const req = httpController.expectOne(
      (r) =>
        r.url ===
          `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/commits/difference` &&
        r.params.get("sourceBranch") === "feature/my-branch" &&
        r.params.get("destinationBranch") === "main"
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_COMMITS);

    expect(await result).toEqual(MOCK_COMMITS);
  });

  it("should map server error message on failure", async () => {
    const request = {
      projectId: "project-1",
      repositoryId: "repo-1",
      sourceBranch: "feature/my-branch",
      destinationBranch: "main",
    };

    const result = firstValueFrom(service.getCommitDifferences(request)).catch(
      (e) => e
    );

    httpController
      .expectOne((r) => r.url.includes("commits/difference"))
      .flush(
        { message: "Repository not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Repository not found");
  });

  it("should use fallback message when no server message", async () => {
    const request = {
      projectId: "p1",
      repositoryId: "r1",
      sourceBranch: "src",
      destinationBranch: "dest",
    };

    const result = firstValueFrom(service.getCommitDifferences(request)).catch(
      (e) => e
    );

    httpController
      .expectOne((r) => r.url.includes("commits/difference"))
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });

  it("should fetch pull request commits and map response fields", async () => {
    const MOCK_PR_COMMITS_API_RESPONSE = [
      {
        id: "pr-commit-1",
        authorDisplayName: "John Doe",
        authorTimestamp: "2026-03-01T10:00:00Z",
        message: "fix: resolve issue",
        url: "https://bitbucket.org/commits/pr-commit-1",
      },
      {
        id: "pr-commit-2",
        authorDisplayName: "Jane Doe",
        authorTimestamp: "2026-03-02T12:00:00Z",
        message: "feat: add feature",
        url: "https://bitbucket.org/commits/pr-commit-2",
      },
    ];

    const EXPECTED_MAPPED_COMMITS: CommitDetails[] = [
      {
        id: "pr-commit-1",
        committerDisplayName: "John Doe",
        committerDisplayEmail: "",
        timeStamp: "2026-03-01T10:00:00Z",
        message: "fix: resolve issue",
        url: "https://bitbucket.org/commits/pr-commit-1",
      },
      {
        id: "pr-commit-2",
        committerDisplayName: "Jane Doe",
        committerDisplayEmail: "",
        timeStamp: "2026-03-02T12:00:00Z",
        message: "feat: add feature",
        url: "https://bitbucket.org/commits/pr-commit-2",
      },
    ];

    const request = {
      projectId: "project-1",
      repositoryId: "repo-1",
      pullRequestId: "pr-42",
    };

    const result = firstValueFrom(service.getPullRequestCommits(request));

    const req = httpController.expectOne(
      (r) =>
        r.url ===
        `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/pull-requests/pr-42/commits`
    );
    expect(req.request.method).toBe("GET");
    req.flush({
      content: MOCK_PR_COMMITS_API_RESPONSE,
      last: true,
      size: 25,
      totalElements: 2,
      page: 0,
    });

    expect(await result).toEqual(EXPECTED_MAPPED_COMMITS);
  });

  it("should map server error message on pull request commits failure", async () => {
    const request = {
      projectId: "project-1",
      repositoryId: "repo-1",
      pullRequestId: "pr-42",
    };

    const result = firstValueFrom(service.getPullRequestCommits(request)).catch(
      (e) => e
    );

    httpController
      .expectOne((r) => r.url.includes("pull-requests/pr-42/commits"))
      .flush(
        { message: "Pull request not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Pull request not found");
  });

  it("should use fallback message when no server message for pull request commits", async () => {
    const request = {
      projectId: "p1",
      repositoryId: "r1",
      pullRequestId: "pr-1",
    };

    const result = firstValueFrom(service.getPullRequestCommits(request)).catch(
      (e) => e
    );

    httpController
      .expectOne((r) => r.url.includes("pull-requests/pr-1/commits"))
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });
});

describe("CommitsService - getPaginatedCommitDifferences", () => {
  let service: CommitsService;
  let httpController: HttpTestingController;

  const MOCK_PAGE_RESPONSE: PaginatedCommitsPage = {
    page: 0,
    size: 50,
    totalElements: 2,
    last: true,
    content: [
      {
        id: "commit-1",
        committerDisplayName: "Alice",
        committerDisplayEmail: "alice@example.com",
        timeStamp: "2026-04-01T08:00:00Z",
        message: "feat: initial commit",
        url: "https://scm.example.com/commits/commit-1",
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CommitsService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(CommitsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should call correct URL with query params", async () => {
    const request = {
      projectId: "project-1",
      repositoryId: "repo-1",
      source: "feature/my-branch",
      destination: "main",
      page: 0,
      size: 50,
    };

    const result = firstValueFrom(
      service.getPaginatedCommitDifferences(request)
    );

    const req = httpController.expectOne(
      (r) =>
        r.url ===
          `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/commits/diff` &&
        r.params.get("source") === "feature/my-branch" &&
        r.params.get("destination") === "main" &&
        r.params.get("page") === "0" &&
        r.params.get("size") === "50"
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_PAGE_RESPONSE);

    expect(await result).toEqual(MOCK_PAGE_RESPONSE);
  });

  it("should propagate server error message", async () => {
    const request = {
      projectId: "p1",
      repositoryId: "r1",
      source: "src",
      destination: "dest",
      page: 0,
      size: 50,
    };

    const result = firstValueFrom(
      service.getPaginatedCommitDifferences(request)
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url.includes("commits/diff"))
      .flush(
        { message: "Branch not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Branch not found");
  });

  it("should use fallback message when no server error message", async () => {
    const request = {
      projectId: "p1",
      repositoryId: "r1",
      source: "src",
      destination: "dest",
      page: 0,
      size: 50,
    };

    const result = firstValueFrom(
      service.getPaginatedCommitDifferences(request)
    ).catch((e) => e);

    httpController
      .expectOne((r) => r.url.includes("commits/diff"))
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });

  it("should return response with correct type shape", async () => {
    const request = {
      projectId: "p1",
      repositoryId: "r1",
      source: "src",
      destination: "dest",
      page: 2,
      size: 25,
    };

    const result = firstValueFrom(
      service.getPaginatedCommitDifferences(request)
    );

    const req = httpController.expectOne(
      (r) => r.params.get("page") === "2" && r.params.get("size") === "25"
    );
    req.flush(MOCK_PAGE_RESPONSE);

    const page = await result;
    expect(page.content).toBeInstanceOf(Array);
    expect(typeof page.totalElements).toBe("number");
    expect(typeof page.last).toBe("boolean");
  });
});
