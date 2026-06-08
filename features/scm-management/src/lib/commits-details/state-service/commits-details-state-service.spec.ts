import { TestBed } from "@angular/core/testing";
import { CommitsDetailsStateService } from "./commits-details-state-service";
import { of, throwError } from "rxjs";
import {
  ScmService,
  ScmManagementService,
  Development,
} from "@mxflow/features/scm";
import {
  MergeRequestService,
  MergeRequestPage,
} from "@mxflow/features/scm-management";
import {
  MergeRequestState,
  MergeRequestStatus,
  MergeRequestPriority,
} from "../../merge-request/model/merge-request";
import { CommitDetailsPage } from "../model/commit-details-page";
import { GetPullRequestCommitsPageApiResponse } from "../../../../../scm/src/lib/pull-request/response/get-pull-request-commits-page-api-response";
import { GetPaginatedCommitsDifferencePageApiResponse } from "../../../../../scm/src/lib/commits/response/get-paginated-commits-difference-page-api-response";

const CONSTANTS = {
  PROJECT_ID: "project1",
  DEVELOPMENT_ID: "dev1",
  BP_ID: "bp1",
  SOURCE_BRANCH: "sourceBranch",
  PARENT_COMMIT_ID: "parentCommit",
  REPOSITORY_ID: "repo1",
  REPOSITORY_URL: "http://example.com/repo1",
  DEVELOPMENT_NAME: "Development Name",
  LATEST_COMMIT_ID: "latestCommit",
  MERGE_REQUEST_ID: "mr1",
  MERGE_REQUEST_TITLE: "Merge Request Title",
  CONFIGURATION_ID: "config1",
  PULL_REQUEST_ID: "pr1",
  PULL_REQUEST_URL: "http://example.com/pr1",
  COMMIT_ID_1: "commit1",
  COMMIT_MESSAGE_1: "Initial commit",
  AUTHOR_1: "Author1",
  COMMIT_URL_1: "http://example.com/commit1",
  COMMIT_ID_2: "commit2",
  COMMIT_MESSAGE_2: "Added new feature",
  AUTHOR_2: "Author2",
  COMMIT_URL_2: "http://example.com/commit2",
  DIFF_ID_1: "diff1",
  DIFF_MESSAGE_1: "Fixed a bug",
  DIFF_URL_1: "http://example.com/diff1",
  DIFF_ID_2: "diff2",
  DIFF_MESSAGE_2: "Refactored code",
  DIFF_URL_2: "http://example.com/diff2",
  ERROR_MESSAGE: "Error fetching commits",
  FIXED_DATE: "2023-10-01T10:00:00.000Z",
  FIXED_DATE_2: "2023-10-01T11:00:00.000Z",
};

const MOCK_DEVELOPMENT: Development = {
  projectId: CONSTANTS.PROJECT_ID,
  id: CONSTANTS.DEVELOPMENT_ID,
  source: CONSTANTS.SOURCE_BRANCH,
  parentCommitId: CONSTANTS.PARENT_COMMIT_ID,
  repository: { id: CONSTANTS.REPOSITORY_ID, url: CONSTANTS.REPOSITORY_URL },
  deleted: false,
  name: CONSTANTS.DEVELOPMENT_NAME,
  latestCommitId: CONSTANTS.LATEST_COMMIT_ID,
  createdOn: CONSTANTS.FIXED_DATE,
};

const MOCK_MERGE_REQUEST_PAGE: MergeRequestPage = {
  content: [
    {
      id: CONSTANTS.MERGE_REQUEST_ID,
      mergeRequestState: MergeRequestState.MERGED,
      createdOn: new Date(CONSTANTS.FIXED_DATE),
      projectId: CONSTANTS.PROJECT_ID,
      title: CONSTANTS.MERGE_REQUEST_TITLE,
      development: {
        id: CONSTANTS.DEVELOPMENT_ID,
        name: CONSTANTS.DEVELOPMENT_NAME,
        projectId: CONSTANTS.PROJECT_ID,
        repositoryId: CONSTANTS.REPOSITORY_ID,
      },
      mergeConfiguration: {
        id: CONSTANTS.CONFIGURATION_ID,
        projectId: CONSTANTS.PROJECT_ID,
        branchName: CONSTANTS.SOURCE_BRANCH,
      },
      pullRequestId: CONSTANTS.PULL_REQUEST_ID,
      pullRequestUrl: CONSTANTS.PULL_REQUEST_URL,
      mergeRequestStatus: MergeRequestStatus.SUCCESS,
      mergeRequestPriority: MergeRequestPriority.HIGH,
    },
  ],
  totalElements: 1,
  size: 1,
  last: true,
  totalPages: 1,
  number: 0,
};

const MOCK_EMPTY_PAGE = {
  content: [],
  size: 0,
  page: 0,
  totalElements: 0,
  last: true,
};

const MOCK_GET_PULL_REQUEST_COMMITS_PAGE_API_RESPONSE: GetPullRequestCommitsPageApiResponse =
  {
    content: [
      {
        id: CONSTANTS.COMMIT_ID_1,
        message: CONSTANTS.COMMIT_MESSAGE_1,
        authorDisplayName: CONSTANTS.AUTHOR_1,
        authorTimestamp: CONSTANTS.FIXED_DATE,
        url: CONSTANTS.COMMIT_URL_1,
      },
      {
        id: CONSTANTS.COMMIT_ID_2,
        message: CONSTANTS.COMMIT_MESSAGE_2,
        authorDisplayName: CONSTANTS.AUTHOR_2,
        authorTimestamp: CONSTANTS.FIXED_DATE_2,
        url: CONSTANTS.COMMIT_URL_2,
      },
    ],
    size: 2,
    page: 0,
    totalElements: 2,
    last: true,
  };

const MOCK_COMMIT_PAGE: CommitDetailsPage = {
  content: [
    {
      id: CONSTANTS.COMMIT_ID_1,
      message: CONSTANTS.COMMIT_MESSAGE_1,
      committerDisplayName: CONSTANTS.AUTHOR_1,
      timeStamp: CONSTANTS.FIXED_DATE,
      url: CONSTANTS.COMMIT_URL_1,
    },
    {
      id: CONSTANTS.COMMIT_ID_2,
      message: CONSTANTS.COMMIT_MESSAGE_2,
      committerDisplayName: CONSTANTS.AUTHOR_2,
      timeStamp: CONSTANTS.FIXED_DATE_2,
      url: CONSTANTS.COMMIT_URL_2,
    },
  ],
  size: 2,
  page: 0,
  totalElements: 2,
  last: true,
};

const MOCK_GET_COMMIT_DIFFERENCES_PAGE_API_RESPONSE: GetPaginatedCommitsDifferencePageApiResponse =
  {
    content: [
      {
        id: CONSTANTS.DIFF_ID_1,
        message: CONSTANTS.DIFF_MESSAGE_1,
        committerDisplayName: CONSTANTS.AUTHOR_1,
        timeStamp: CONSTANTS.FIXED_DATE,
        url: CONSTANTS.DIFF_URL_1,
      },
      {
        id: CONSTANTS.DIFF_ID_2,
        message: CONSTANTS.DIFF_MESSAGE_2,
        committerDisplayName: CONSTANTS.AUTHOR_2,
        timeStamp: CONSTANTS.FIXED_DATE_2,
        url: CONSTANTS.DIFF_URL_2,
      },
    ],
    size: 2,
    page: 0,
    totalElements: 2,
    last: true,
  };

const MOCK_COMMIT_DIFFERENCES_PAGE = {
  content: [
    {
      id: CONSTANTS.DIFF_ID_1,
      message: CONSTANTS.DIFF_MESSAGE_1,
      committerDisplayName: CONSTANTS.AUTHOR_1,
      timeStamp: CONSTANTS.FIXED_DATE,
      url: CONSTANTS.DIFF_URL_1,
    },
    {
      id: CONSTANTS.DIFF_ID_2,
      message: CONSTANTS.DIFF_MESSAGE_2,
      committerDisplayName: CONSTANTS.AUTHOR_2,
      timeStamp: CONSTANTS.FIXED_DATE_2,
      url: CONSTANTS.DIFF_URL_2,
    },
  ],
  size: 2,
  page: 0,
  totalElements: 2,
  last: true,
};

const mockScmService = {
  getPaginatedCommitDifferences: jest.fn(),
  getPullRequestCommits: jest.fn(),
};

const mockScmManagementService = {
  getDevelopment: jest.fn(),
};

const mockMergeRequestService = {
  getFilteredMergeRequests: jest.fn(),
};

async function waitForAsyncOperations(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("CommitsDetailsStateService", () => {
  let service: CommitsDetailsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommitsDetailsStateService,
        { provide: ScmService, useValue: mockScmService },
        { provide: ScmManagementService, useValue: mockScmManagementService },
        { provide: MergeRequestService, useValue: mockMergeRequestService },
      ],
    });

    service = TestBed.inject(CommitsDetailsStateService);
  });

  it("should initialize with default values", () => {
    expect(service.pageSize()).toBe(5);
    expect(service.pageIndex()).toBe(0);
    expect(service.fetchCommitsLoading()).toBe(false);
  });

  it("should fetch commits for a pull request", async () => {
    mockScmManagementService.getDevelopment.mockReturnValue(
      of(MOCK_DEVELOPMENT)
    );
    mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
      of(MOCK_MERGE_REQUEST_PAGE)
    );
    mockScmService.getPullRequestCommits.mockReturnValue(of(MOCK_EMPTY_PAGE));

    service.fetchCommits(
      CONSTANTS.PROJECT_ID,
      CONSTANTS.DEVELOPMENT_ID,
      CONSTANTS.BP_ID
    );

    await waitForAsyncOperations();

    expect(service.commitsPage()).toEqual(MOCK_EMPTY_PAGE);
    expect(mockScmService.getPullRequestCommits).toHaveBeenCalledTimes(2);
    expect(service.totalElements()).toBe(0);
  });

  it("should fetch commit differences when no pull request exists", async () => {
    mockScmManagementService.getDevelopment.mockReturnValue(
      of(MOCK_DEVELOPMENT)
    );
    mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
      of({ content: [] })
    );
    mockScmService.getPaginatedCommitDifferences.mockReturnValue(
      of(MOCK_EMPTY_PAGE)
    );

    service.fetchCommits(
      CONSTANTS.PROJECT_ID,
      CONSTANTS.DEVELOPMENT_ID,
      CONSTANTS.BP_ID
    );

    await waitForAsyncOperations();

    expect(service.commitsPage()).toEqual(MOCK_EMPTY_PAGE);
    expect(mockScmService.getPaginatedCommitDifferences).toHaveBeenCalledTimes(
      2
    );
    expect(service.totalElements()).toBe(0);
  });

  it("should return an empty page when development is deleted and no pr found", async () => {
    const deletedDevelopment = { ...MOCK_DEVELOPMENT, deleted: true };
    mockScmManagementService.getDevelopment.mockReturnValue(
      of(deletedDevelopment)
    );
    mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
      of({ content: [] })
    );

    service.fetchCommits(
      CONSTANTS.PROJECT_ID,
      CONSTANTS.DEVELOPMENT_ID,
      CONSTANTS.BP_ID
    );

    await waitForAsyncOperations();

    expect(service.errorMessage()).toEqual(
      "No commits are displayed in the table because the branch was deleted, and no merged PR exists."
    );
    expect(service.commitsPage()).toEqual(MOCK_EMPTY_PAGE);
  });

  it("should set page size", () => {
    service.setPageSize(10);
    expect(service.pageSize()).toBe(10);
  });

  it("should set page index", () => {
    service.setPageIndex(2);
    expect(service.pageIndex()).toBe(2);
  });

  it("should handle errors in the catchError block", async () => {
    mockScmManagementService.getDevelopment.mockReturnValue(
      throwError(() => new Error(CONSTANTS.ERROR_MESSAGE))
    );

    service.fetchCommits(
      CONSTANTS.PROJECT_ID,
      CONSTANTS.DEVELOPMENT_ID,
      CONSTANTS.BP_ID
    );

    await waitForAsyncOperations();

    expect(service.errorMessage()).toEqual(
      "Failed to fetch commits. " + CONSTANTS.ERROR_MESSAGE
    );
    expect(service.commitsPage()).toEqual(MOCK_EMPTY_PAGE);
    expect(service.fetchCommitsLoading()).toBe(false);
  });

  describe("should return appropriate commit pages", () => {
    beforeEach(() => {
      mockScmService.getPaginatedCommitDifferences.mockClear();
      mockScmService.getPullRequestCommits.mockClear();
      mockMergeRequestService.getFilteredMergeRequests.mockClear();
      mockScmManagementService.getDevelopment.mockClear();
    });

    it("should fetch a non-empty commit page for a pull request", async () => {
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      );
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(MOCK_MERGE_REQUEST_PAGE)
      );
      mockScmService.getPullRequestCommits.mockReturnValue(
        of(MOCK_GET_PULL_REQUEST_COMMITS_PAGE_API_RESPONSE)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(service.commitsPage()).toEqual(MOCK_COMMIT_PAGE);
      expect(mockScmService.getPullRequestCommits).toHaveBeenCalledTimes(2);
      expect(service.totalElements()).toBe(2);
    });

    it("should fetch a non-empty commit differences page", async () => {
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      );
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of({ content: [] })
      );
      mockScmService.getPaginatedCommitDifferences.mockReturnValue(
        of(MOCK_GET_COMMIT_DIFFERENCES_PAGE_API_RESPONSE)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(service.commitsPage()).toEqual(MOCK_COMMIT_DIFFERENCES_PAGE);
      expect(
        mockScmService.getPaginatedCommitDifferences
      ).toHaveBeenCalledTimes(2);
      expect(service.totalElements()).toBe(2);
    });
  });

  describe("fetch commits scenarios", () => {
    beforeEach(() => {
      mockScmService.getPaginatedCommitDifferences.mockClear();
      mockScmService.getPullRequestCommits.mockClear();
      mockMergeRequestService.getFilteredMergeRequests.mockClear();
      mockScmManagementService.getDevelopment.mockClear();
    });
    it("dev exists + no PR -> uses DIFF", async () => {
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of({ content: [] })
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      ); // deleted=false
      const diffPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPaginatedCommitDifferences.mockReturnValue(
        of(diffPage)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(
        mockScmService.getPaginatedCommitDifferences
      ).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });

    it("dev exists + PR OPEN -> uses PR COMMITS", async () => {
      const openMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.IN_REVIEW,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(openMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      ); // deleted=false

      const prCommitsPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPullRequestCommits.mockReturnValue(of(prCommitsPage));

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(mockScmService.getPullRequestCommits).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });

    it("dev exists + PR DECLINED -> uses DIFF", async () => {
      const declinedMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.DECLINED,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(declinedMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      ); // deleted=false

      const diffPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPaginatedCommitDifferences.mockReturnValue(
        of(diffPage)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(
        mockScmService.getPaginatedCommitDifferences
      ).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });

    it("dev deleted + PR MERGED -> uses PR COMMITS", async () => {
      const mergedMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.MERGED,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(mergedMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of({ ...MOCK_DEVELOPMENT, deleted: true })
      );

      const prCommitsPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPullRequestCommits.mockReturnValue(of(prCommitsPage));

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(mockScmService.getPullRequestCommits).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });

    it("dev deleted + no MERGED PR -> returns EMPTY + error", async () => {
      const nonMergedMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.DELETED,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(nonMergedMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of({ ...MOCK_DEVELOPMENT, deleted: true })
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(service.errorMessage()).toEqual(
        "No commits are displayed in the table because the branch was deleted, and no merged PR exists."
      );
      expect(service.commitsPage()).toEqual(MOCK_EMPTY_PAGE);
    });

    it("dev exists + PR UNDER_VALIDATION_FAILED -> uses DIFF", async () => {
      const underValidationFailedMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.UNDER_VALIDATION_FAILED,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(underValidationFailedMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      ); // deleted=false

      const diffPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPaginatedCommitDifferences.mockReturnValue(
        of(diffPage)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(
        mockScmService.getPaginatedCommitDifferences
      ).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });

    it("dev exists + PR REVIEW_FAILED -> uses DIFF", async () => {
      const reviewFailedMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.REVIEW_FAILED,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(reviewFailedMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      ); // deleted=false

      const diffPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPaginatedCommitDifferences.mockReturnValue(
        of(diffPage)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(
        mockScmService.getPaginatedCommitDifferences
      ).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });

    it("dev exists + PR MERGE_FAILED -> uses DIFF", async () => {
      const mergeFailedMRPage = {
        ...MOCK_MERGE_REQUEST_PAGE,
        content: [
          {
            ...MOCK_MERGE_REQUEST_PAGE.content[0],
            mergeRequestState: MergeRequestState.MERGE_FAILED,
          },
        ],
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(mergeFailedMRPage)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      ); // deleted=false

      const diffPage = {
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        last: true,
      };
      mockScmService.getPaginatedCommitDifferences.mockReturnValue(
        of(diffPage)
      );

      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(
        mockScmService.getPaginatedCommitDifferences
      ).toHaveBeenCalledTimes(2);
      expect(service.errorMessage()).toBeUndefined();
    });
  });

  describe("it re-queries PR commits when values changes", () => {
    beforeEach(async () => {
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of(MOCK_MERGE_REQUEST_PAGE)
      );
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(MOCK_DEVELOPMENT)
      );
      mockScmService.getPullRequestCommits.mockReturnValue(
        of({
          content: [],
          page: 0,
          size: 5,
          totalElements: 0,
          last: true,
        })
      );
      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );
      await waitForAsyncOperations();
    });

    it("re-queries PR commits when pageIndex changes", async () => {
      service.setPageIndex(1);

      await waitForAsyncOperations();

      expect(mockScmService.getPullRequestCommits).toHaveBeenLastCalledWith({
        projectId: MOCK_DEVELOPMENT.projectId,
        repositoryId: MOCK_DEVELOPMENT.repository.id,
        pullRequestId: MOCK_MERGE_REQUEST_PAGE.content[0].pullRequestId,
        page: 1,
        size: 5,
      });
    });

    it("re-queries PR commits when pageSize changes", async () => {
      service.setPageSize(10);

      await waitForAsyncOperations();

      expect(mockScmService.getPullRequestCommits).toHaveBeenLastCalledWith({
        projectId: MOCK_DEVELOPMENT.projectId,
        repositoryId: MOCK_DEVELOPMENT.repository.id,
        pullRequestId: MOCK_MERGE_REQUEST_PAGE.content[0].pullRequestId,
        page: 0,
        size: 10,
      });
    });

    it("re-queries PR commits when development changes", async () => {
      mockScmManagementService.getDevelopment.mockReturnValue(
        of({ ...MOCK_DEVELOPMENT, name: "Updated Development" })
      );
      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(mockScmService.getPullRequestCommits).toHaveBeenLastCalledWith({
        projectId: MOCK_DEVELOPMENT.projectId,
        repositoryId: MOCK_DEVELOPMENT.repository.id,
        pullRequestId: MOCK_MERGE_REQUEST_PAGE.content[0].pullRequestId,
        page: 0,
        size: 5,
      });
    });

    it("re-queries PR commits when mergeRequest changes", async () => {
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of({
          content: [
            {
              ...MOCK_MERGE_REQUEST_PAGE.content[0],
              pullRequestId: "newPullRequestId",
            },
          ],
        })
      );
      service.fetchCommits(
        CONSTANTS.PROJECT_ID,
        CONSTANTS.DEVELOPMENT_ID,
        CONSTANTS.BP_ID
      );

      await waitForAsyncOperations();

      expect(mockScmService.getPullRequestCommits).toHaveBeenLastCalledWith({
        projectId: MOCK_DEVELOPMENT.projectId,
        repositoryId: MOCK_DEVELOPMENT.repository.id,
        pullRequestId: "newPullRequestId",
        page: 0,
        size: 5,
      });
    });
  });
});
