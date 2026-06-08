import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

import { ScmService } from "./scm.service";
import {
  CommitDetails,
  DescribeRepositoryRequest,
  DescribeRepositoryResponse,
  FileInfoRequest,
  GetBranchDetailsRequest,
  RepoItemType,
} from "@mxflow/features/scm";
import { APP_CONFIG } from "@mxflow/config";
import { GetTagDetailsRequest } from "./tag-details/get-tag-details.request";
import { DescribeRepositoryApiModel } from "./describe-repository/describe-repository-api-model";
import { GetCommitsDifferenceRequest } from "./commits/get-commits-difference-request";
import {
  DefaultReviewersResponse,
  GetDefaultReviewersRequest,
  GetReviewersRequest,
  ReviewersResponse,
} from "./reviewer/reviewer";
import { FileInfo } from "./file/file-info";
import { GetPullRequestApiRequest } from "./pull-request/request/get-pull-request-api-request";
import { GetPaginatedCommitsDifferenceApiRequest } from "./commits/request/get-paginated-commits-difference-api-request";
import { GetPullRequestCommitsPageApiResponse } from "./pull-request/response/get-pull-request-commits-page-api-response";
import { GetPaginatedCommitsDifferencePageApiResponse } from "./commits/response/get-paginated-commits-difference-page-api-response";
import { BranchDetailsApiModel } from "./branch-details/branch-details-api-model";
import { TagDetailsApiModel } from "./tag-details/tag-details.api-model";
import { DescribeRootNotFoundError } from "./describe-repository/describe-root-not-found-error";

const HEAD_COMMIT_ID = "headCommitId";
const PROJECT_ID = "projectId";
const REPO_ID = "repoId";
const BRANCH_NAME = "branchName";
const TAG_NAME = "tagName";
const TAGGED_COMMIT_ID = "taggedCommitId";
const ROOT = "root";
const ID = "commitId";
const MESSAGE = "message";
const COMMITTER_DISPLAY_NAME = "alain ya alain";
const COMMITTER_DISPLAY_EMAIL = "@murex.com";
const SOURCE_BRANCH = "sourceBranch";
const TARGET_BRANCH = "targetBranch";
const DESTINATION_BRANCH = "destinationBranch";
const TIMESTAMP = "123124124";
const COMMIT_URL = "COMMIT_URL";
const REVIEWER_NAME = "reviewerName";
const REVIEWER_DISPLAY_NAME = "reviewerDisplayName";
const FILTER = "filter";
const PAGE_SIZE = 5;
const PAGE_INDEX = 0;
const TOTAL_ELEMENTS = 1;
const PULL_REQUEST_ID = "PULL_REQUEST_ID";
const VERSION = "VERSION";
const PATH = "PATH";

describe("ScmService", () => {
  let service: ScmService;
  let httpMock: HttpTestingController;

  const mockConfig = {
    gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScmService,
        { provide: APP_CONFIG, useValue: mockConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ScmService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("service initialization", () => {
    it("should create service instance", () => {
      expect(service).toBeTruthy();
    });

    it("should configure API URL from config", () => {
      expect(service.apiUrl).toBe(
        "https://gateway.cd.murex.com/api/v1/scm-operations/"
      );
    });
  });

  describe("getBranchDetails", () => {
    const mockBranchDetailsResponse: BranchDetailsApiModel = {
      latestCommitId: HEAD_COMMIT_ID,
    };

    it("should fetch branch details successfully", async () => {
      const request = getBranchDetailsRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/branches?branchName=${BRANCH_NAME}`;

      const promise = firstValueFrom(service.getBranchDetails(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("branchName")).toBe(BRANCH_NAME);
      req.flush(mockBranchDetailsResponse);

      const response = await promise;
      expect(response).toEqual(mockBranchDetailsResponse);
    });

    it("should handle error when getting branch details", async () => {
      const request = getBranchDetailsRequest();
      const mockError = { status: 404, statusText: "Not Found" };
      const errorResponse = {
        status: 404,
        message: "Branch not found",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/branches?branchName=${BRANCH_NAME}`;

      const promise = firstValueFrom(service.getBranchDetails(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Branch not found",
        status: 404,
      });
    });
  });

  describe("getCommitDifferences", () => {
    const mockCommitDifferenceResponse: CommitDetails[] = [
      {
        id: ID,
        message: MESSAGE,
        committerDisplayName: COMMITTER_DISPLAY_NAME,
        committerDisplayEmail: COMMITTER_DISPLAY_EMAIL,
        timeStamp: TIMESTAMP,
        url: COMMIT_URL,
      },
    ];

    it("should get commit difference successfully", async () => {
      const request = getCommitsDifferenceRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/commits/difference?sourceBranch=${SOURCE_BRANCH}&destinationBranch=${DESTINATION_BRANCH}`;

      const promise = firstValueFrom(service.getCommitDifferences(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("sourceBranch")).toBe(SOURCE_BRANCH);
      expect(req.request.params.get("destinationBranch")).toBe(
        DESTINATION_BRANCH
      );
      req.flush(mockCommitDifferenceResponse);

      const response = await promise;
      expect(response).toEqual(mockCommitDifferenceResponse);
    });

    it("should handle error when getting commit differences", async () => {
      const request = getCommitsDifferenceRequest();
      const mockError = { status: 500, statusText: "Server Error" };
      const errorResponse = {
        status: 500,
        message: "Failed to get commit differences",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/commits/difference?sourceBranch=${SOURCE_BRANCH}&destinationBranch=${DESTINATION_BRANCH}`;

      const promise = firstValueFrom(service.getCommitDifferences(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Failed to get commit differences",
      });
    });
  });

  describe("getTagDetails", () => {
    const mockTagDetailsResponse: TagDetailsApiModel = {
      name: TAG_NAME,
      commitId: TAGGED_COMMIT_ID,
    };

    it("should get tag details successfully", async () => {
      const request = getTagDetailsRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/tags/${TAG_NAME}`;

      const promise = firstValueFrom(service.getTagDetails(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockTagDetailsResponse);

      const response = await promise;
      expect(response).toEqual(mockTagDetailsResponse);
    });

    it("should handle error when getting tag details", async () => {
      const request = getTagDetailsRequest();
      const mockError = { status: 404, statusText: "Not Found" };
      const errorResponse = {
        status: 404,
        message: "Tag not found",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/tags/${TAG_NAME}`;

      const promise = firstValueFrom(service.getTagDetails(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({ message: "Tag not found" });
    });
  });

  describe("describeRepository", () => {
    const mockDescribeRepositoryApiResponse: DescribeRepositoryApiModel = {
      nodes: [
        {
          name: "dir1",
          children: [
            {
              name: "file",
              children: undefined,
              isDirectory: false,
            },
            {
              name: "subDir1",
              children: [
                {
                  name: "file3",
                  children: undefined,
                  isDirectory: false,
                },
              ],
              isDirectory: true,
            },
          ],
          isDirectory: true,
        },
        {
          name: "dir2",
          children: [
            {
              name: "subDir2",
              children: [],
              isDirectory: true,
            },
          ],
          isDirectory: true,
        },
        {
          name: "dir3",
          children: [],
          isDirectory: true,
        },
        {
          name: "file1",
          children: undefined,
          isDirectory: false,
        },
      ],
    };

    const mockDescribeRepositoryResponse: DescribeRepositoryResponse = {
      repositoryItems: [
        {
          parentPath: "",
          name: "dir1",
          children: [
            {
              parentPath: "dir1",
              name: "file",
              type: RepoItemType.FILE,
            },
            {
              parentPath: "dir1",
              name: "subDir1",
              children: [
                {
                  parentPath: "dir1/subDir1",
                  name: "file3",
                  type: RepoItemType.FILE,
                },
              ],
              type: RepoItemType.DIRECTORY,
            },
          ],
          type: RepoItemType.DIRECTORY,
        },
        {
          parentPath: "",
          name: "dir2",
          children: [
            {
              parentPath: "dir2",
              name: "subDir2",
              children: [],
              type: RepoItemType.DIRECTORY,
            },
          ],
          type: RepoItemType.DIRECTORY,
        },
        {
          parentPath: "",
          name: "dir3",
          children: [],
          type: RepoItemType.DIRECTORY,
        },
        {
          parentPath: "",
          name: "file1",
          type: RepoItemType.FILE,
        },
      ],
    };

    it("should describe repository successfully", async () => {
      const request = getDescribeRepositoryRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/directories/tree/branch?branchName=${BRANCH_NAME}`;

      const promise = firstValueFrom(service.describeRepository(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("branchName")).toBe(BRANCH_NAME);
      req.flush(mockDescribeRepositoryApiResponse);

      const response = await promise;
      expect(response).toEqual(mockDescribeRepositoryResponse);
    });

    it("should describe repository from a certain root", async () => {
      const request = getDescribeRepositoryRequestWithRoot();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/directories/tree/branch?branchName=${BRANCH_NAME}&root=${ROOT}`;

      const expectedResponseWithRoot: DescribeRepositoryResponse = {
        repositoryItems: [
          {
            parentPath: "root",
            name: "dir1",
            children: [
              {
                parentPath: "root/dir1",
                name: "file",
                type: RepoItemType.FILE,
              },
              {
                parentPath: "root/dir1",
                name: "subDir1",
                children: [
                  {
                    parentPath: "root/dir1/subDir1",
                    name: "file3",
                    type: RepoItemType.FILE,
                  },
                ],
                type: RepoItemType.DIRECTORY,
              },
            ],
            type: RepoItemType.DIRECTORY,
          },
          {
            parentPath: "root",
            name: "dir2",
            children: [
              {
                parentPath: "root/dir2",
                name: "subDir2",
                children: [],
                type: RepoItemType.DIRECTORY,
              },
            ],
            type: RepoItemType.DIRECTORY,
          },
          {
            parentPath: "root",
            name: "dir3",
            children: [],
            type: RepoItemType.DIRECTORY,
          },
          {
            parentPath: "root",
            name: "file1",
            type: RepoItemType.FILE,
          },
        ],
      };

      const promise = firstValueFrom(service.describeRepository(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("branchName")).toBe(BRANCH_NAME);
      expect(req.request.params.get("root")).toBe(ROOT);
      req.flush(mockDescribeRepositoryApiResponse);

      const response = await promise;
      expect(response).toEqual(expectedResponseWithRoot);
    });

    it("should handle root not found error", async () => {
      const request = getDescribeRepositoryRequestWithRoot();
      const mockError = { status: 404, statusText: "Not Found" };
      const errorResponse = {
        status: 404,
        message: "Root not found",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/directories/tree/branch?branchName=${BRANCH_NAME}&root=${ROOT}`;

      const promise = firstValueFrom(service.describeRepository(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toBeInstanceOf(DescribeRootNotFoundError);
    });

    it("should handle error when describing repository without root", async () => {
      const request = getDescribeRepositoryRequest();
      const mockError = { status: 500, statusText: "Server Error" };
      const errorResponse = {
        status: 500,
        message: "Internal server error",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/directories/tree/branch?branchName=${BRANCH_NAME}`;

      const promise = firstValueFrom(service.describeRepository(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Internal server error",
      });
    });
  });

  describe("getDefaultReviewers", () => {
    const mockDefaultReviewersResponse: DefaultReviewersResponse = {
      content: [
        {
          name: REVIEWER_NAME,
          displayName: REVIEWER_DISPLAY_NAME,
        },
      ],
    };

    it("should get default reviewers successfully", async () => {
      const request = getGetDefaultReviewersRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/default-reviewers?sourceBranch=${SOURCE_BRANCH}&targetBranch=${TARGET_BRANCH}`;

      const promise = firstValueFrom(service.getDefaultReviewers(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("sourceBranch")).toBe(SOURCE_BRANCH);
      expect(req.request.params.get("targetBranch")).toBe(TARGET_BRANCH);
      req.flush(mockDefaultReviewersResponse);

      const response = await promise;
      expect(response).toEqual(mockDefaultReviewersResponse);
    });

    it("should handle error when getting default reviewers", async () => {
      const request = getGetDefaultReviewersRequest();
      const mockError = { status: 404, statusText: "Not Found" };
      const errorResponse = {
        status: 404,
        message: "Reviewers not found",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/default-reviewers?sourceBranch=${SOURCE_BRANCH}&targetBranch=${TARGET_BRANCH}`;

      const promise = firstValueFrom(service.getDefaultReviewers(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Reviewers not found",
      });
    });
  });

  describe("getReviewers", () => {
    const mockReviewersResponse: ReviewersResponse = {
      content: [
        {
          name: REVIEWER_NAME,
          displayName: REVIEWER_DISPLAY_NAME,
        },
      ],
      page: PAGE_INDEX,
      totalElements: TOTAL_ELEMENTS,
      last: true,
    };

    it("should get reviewers successfully", async () => {
      const request = getGetReviewersRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/reviewers?page=${PAGE_INDEX}&size=${PAGE_SIZE}&filter=${FILTER}`;

      const promise = firstValueFrom(service.getReviewers(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockReviewersResponse);

      const response = await promise;
      expect(response).toEqual(mockReviewersResponse);
    });

    it("should handle error when getting reviewers", async () => {
      const request = getGetReviewersRequest();
      const mockError = { status: 500, statusText: "Server Error" };
      const errorResponse = {
        status: 500,
        message: "Failed to fetch reviewers",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/reviewers?page=${PAGE_INDEX}&size=${PAGE_SIZE}&filter=${FILTER}`;

      const promise = firstValueFrom(service.getReviewers(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Failed to fetch reviewers",
      });
    });
  });

  describe("getFileInfo", () => {
    const mockFileInfo: FileInfo = {
      fileExists: true,
    } as FileInfo;

    it("should get file info successfully", async () => {
      const request = getFileInfoRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/files/version/${VERSION}/info?path=${PATH}`;

      const promise = firstValueFrom(service.getFileInfo(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockFileInfo);

      const response = await promise;
      expect(response).toEqual(mockFileInfo);
    });

    it("should handle error when getting file info", async () => {
      const request = getFileInfoRequest();
      const mockError = { status: 404, statusText: "Not Found" };
      const errorResponse = {
        status: 404,
        message: "File not found",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/files/version/${VERSION}/info?path=${PATH}`;

      const promise = firstValueFrom(service.getFileInfo(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "File not found",
      });
    });
  });

  describe("getPullRequestCommits", () => {
    const mockPullRequestCommitsResponse: GetPullRequestCommitsPageApiResponse =
      {
        content: [
          {
            id: ID,
            message: MESSAGE,
            authorDisplayName: COMMITTER_DISPLAY_NAME,
            authorTimestamp: TIMESTAMP,
            url: COMMIT_URL,
          },
        ],
        totalElements: TOTAL_ELEMENTS,
        page: PAGE_INDEX,
        size: PAGE_SIZE,
        last: true,
      };

    it("should get pull request commits successfully", async () => {
      const request = getPullRequestRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/pull-requests/${PULL_REQUEST_ID}/commits?page=${PAGE_INDEX}&size=${PAGE_SIZE}`;

      const promise = firstValueFrom(service.getPullRequestCommits(request));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockPullRequestCommitsResponse);

      const response = await promise;
      expect(response).toEqual(mockPullRequestCommitsResponse);
    });

    it("should handle error when getting pull request commits", async () => {
      const request = getPullRequestRequest();
      const mockError = { status: 404, statusText: "Not Found" };
      const errorResponse = {
        status: 404,
        message: "Pull request not found",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/pull-requests/${PULL_REQUEST_ID}/commits?page=${PAGE_INDEX}&size=${PAGE_SIZE}`;

      const promise = firstValueFrom(service.getPullRequestCommits(request));

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Pull request not found",
      });
    });
  });

  describe("getPaginatedCommitDifferences", () => {
    const mockPaginatedCommitDifferencesResponse: GetPaginatedCommitsDifferencePageApiResponse =
      {
        content: [
          {
            id: ID,
            message: MESSAGE,
            committerDisplayName: COMMITTER_DISPLAY_NAME,
            timeStamp: TIMESTAMP,
            url: COMMIT_URL,
          },
        ],
        totalElements: TOTAL_ELEMENTS,
        page: PAGE_INDEX,
        size: PAGE_SIZE,
        last: true,
      };

    it("should get paginated commit differences successfully", async () => {
      const request = getPaginatedCommitsDifferenceRequest();
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/commits/diff?page=${PAGE_INDEX}&size=${PAGE_SIZE}&source=${SOURCE_BRANCH}&destination=${DESTINATION_BRANCH}`;

      const promise = firstValueFrom(
        service.getPaginatedCommitDifferences(request)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("page")).toBe(String(PAGE_INDEX));
      expect(req.request.params.get("size")).toBe(String(PAGE_SIZE));
      expect(req.request.params.get("source")).toBe(SOURCE_BRANCH);
      expect(req.request.params.get("destination")).toBe(DESTINATION_BRANCH);
      req.flush(mockPaginatedCommitDifferencesResponse);

      const response = await promise;
      expect(response).toEqual(mockPaginatedCommitDifferencesResponse);
    });

    it("should handle error when getting paginated commit differences", async () => {
      const request = getPaginatedCommitsDifferenceRequest();
      const mockError = { status: 500, statusText: "Server Error" };
      const errorResponse = {
        status: 500,
        message: "Error fetching paginated commit differences",
        timestamp: "2026-02-02T12:00:00Z",
        errors: {},
        failureReason: null,
      };
      const expectedUrl = `${mockConfig.gatewayUrl}scm-operations/projects/${PROJECT_ID}/repositories/${REPO_ID}/commits/diff?page=${PAGE_INDEX}&size=${PAGE_SIZE}&source=${SOURCE_BRANCH}&destination=${DESTINATION_BRANCH}`;

      const promise = firstValueFrom(
        service.getPaginatedCommitDifferences(request)
      );

      const req = httpMock.expectOne(expectedUrl);
      req.flush(errorResponse, mockError);

      await expect(promise).rejects.toMatchObject({
        message: "Error fetching paginated commit differences",
      });
    });
  });

  function getBranchDetailsRequest(): GetBranchDetailsRequest {
    return {
      projectId: PROJECT_ID,
      repoId: REPO_ID,
      branchName: BRANCH_NAME,
    };
  }

  function getCommitsDifferenceRequest(): GetCommitsDifferenceRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      sourceBranch: SOURCE_BRANCH,
      destinationBranch: DESTINATION_BRANCH,
    };
  }

  function getTagDetailsRequest(): GetTagDetailsRequest {
    return {
      name: TAG_NAME,
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
    };
  }

  function getDescribeRepositoryRequest(): DescribeRepositoryRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      branchName: BRANCH_NAME,
      root: "",
    };
  }

  function getDescribeRepositoryRequestWithRoot(): DescribeRepositoryRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      branchName: BRANCH_NAME,
      root: ROOT,
    };
  }

  function getGetDefaultReviewersRequest(): GetDefaultReviewersRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      sourceBranch: SOURCE_BRANCH,
      targetBranch: TARGET_BRANCH,
    };
  }

  function getGetReviewersRequest(): GetReviewersRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      page: PAGE_INDEX,
      size: PAGE_SIZE,
      filter: FILTER,
    };
  }

  function getFileInfoRequest(): FileInfoRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      version: VERSION,
      path: PATH,
    };
  }

  function getPullRequestRequest(): GetPullRequestApiRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      pullRequestId: PULL_REQUEST_ID,
      size: PAGE_SIZE,
      page: PAGE_INDEX,
    };
  }

  function getPaginatedCommitsDifferenceRequest(): GetPaginatedCommitsDifferenceApiRequest {
    return {
      projectId: PROJECT_ID,
      repositoryId: REPO_ID,
      source: SOURCE_BRANCH,
      destination: DESTINATION_BRANCH,
      page: PAGE_INDEX,
      size: PAGE_SIZE,
    };
  }
});
