import { render, screen, waitFor, within } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, Subject } from "rxjs";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridAngular } from "ag-grid-angular";
import {
  CommitsService,
  CommitDetails,
  MergeRequestOverview,
  MergeRequestState,
  Development,
} from "@mxevolve/domains/scm/data-access";
import { MergeRequestCommitsComponent } from "./merge-request-commits.component";
import { PaginatedCommitsDifferenceComponent } from "../paginated-commits-difference/paginated-commits-difference.component";

ModuleRegistry.registerModules([AllCommunityModule]);

const mockCommitsService = {
  getCommitDifferences: jest.fn(),
  getPullRequestCommits: jest.fn(),
  getPaginatedCommitDifferences: jest.fn(),
};

const MOCK_DEVELOPMENT: Development = {
  id: "dev-456",
  name: "feature/my-branch",
  source: "main",
  projectId: "project-123",
  repository: {
    id: "repo-1",
    url: "https://bitbucket.org/scm/PRJ/my-repo.git",
  },
  latestCommitId: "abcdef1234567890",
  parentCommitId: "1234567890abcdef",
  createdOn: "2024-01-01",
  deleted: false,
};

const MOCK_COMMIT_WITH_URL: CommitDetails = {
  id: "abcdef1234567890",
  committerDisplayName: "John Doe",
  committerDisplayEmail: "john.doe@example.com",
  timeStamp: "2024-01-15T10:30:00Z",
  message: "feat: add new feature",
  url: "https://bitbucket.org/commits/abcdef1234567890",
};

const MOCK_COMMIT_WITHOUT_URL: CommitDetails = {
  id: "0987654321fedcba",
  committerDisplayName: "Jane Smith",
  committerDisplayEmail: "jane.smith@example.com",
  timeStamp: "2024-01-14T09:00:00Z",
  message: "fix: resolve null pointer",
  url: "",
};

async function renderComponent(
  inputs: {
    development?: Development;
    mergeRequest?: MergeRequestOverview;
  } = {}
) {
  return render(MergeRequestCommitsComponent, {
    imports: [
      AgGridAngular,
      MockComponent(PaginatedCommitsDifferenceComponent),
    ],
    inputs: { development: MOCK_DEVELOPMENT, ...inputs },
    componentProviders: [
      { provide: CommitsService, useValue: mockCommitsService },
    ],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

describe("MergeRequestCommitsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommitsService.getPullRequestCommits.mockReturnValue(
      of([MOCK_COMMIT_WITH_URL, MOCK_COMMIT_WITHOUT_URL])
    );
  });

  describe("title", () => {
    it("shows the branch name in the title for non-merged state", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByText(`Commits on "${MOCK_DEVELOPMENT.name}"`)
        ).toBeTruthy()
      );
    });

    it("shows 'Pull Request Commits' title when merged", async () => {
      await renderComponent({
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });

      await waitFor(() =>
        expect(screen.getByText("Pull Request Commits")).toBeTruthy()
      );
    });
  });

  describe("paginated branch diff mode", () => {
    it("renders the paginated commits component for active branches", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const paginated = ngMocks.find(
          fixture,
          PaginatedCommitsDifferenceComponent
        );
        expect(paginated).toBeTruthy();
        expect(paginated.componentInstance.projectId).toBe(
          MOCK_DEVELOPMENT.projectId
        );
        expect(paginated.componentInstance.repositoryId).toBe(
          MOCK_DEVELOPMENT.repository.id
        );
        expect(paginated.componentInstance.source).toBe(MOCK_DEVELOPMENT.name);
        expect(paginated.componentInstance.destination).toBe(
          MOCK_DEVELOPMENT.source
        );
      });
    });

    it("renders paginated component when MR is not merged", async () => {
      const { fixture } = await renderComponent({
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.IN_REVIEW,
        },
      });

      await waitFor(() => {
        const paginated = ngMocks.find(
          fixture,
          PaginatedCommitsDifferenceComponent
        );
        expect(paginated).toBeTruthy();
      });
    });

    it("does not call getCommitDifferences or getPullRequestCommits", async () => {
      await renderComponent();

      expect(mockCommitsService.getCommitDifferences).not.toHaveBeenCalled();
      expect(mockCommitsService.getPullRequestCommits).not.toHaveBeenCalled();
    });
  });

  describe("pull request commits mode (merged)", () => {
    it("shows PR commits in a client-side table when merged", async () => {
      mockCommitsService.getPullRequestCommits.mockReturnValue(
        of([MOCK_COMMIT_WITH_URL])
      );
      await renderComponent({
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });

      await waitFor(() => expect(getDataRows()).toHaveLength(1));
      expect(mockCommitsService.getPullRequestCommits).toHaveBeenCalledWith({
        projectId: MOCK_DEVELOPMENT.projectId,
        repositoryId: MOCK_DEVELOPMENT.repository.id,
        pullRequestId: "pr-123",
      });
    });

    it("does not render the paginated component when merged", async () => {
      mockCommitsService.getPullRequestCommits.mockReturnValue(
        of([MOCK_COMMIT_WITH_URL])
      );
      const { fixture } = await renderComponent({
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });

      await waitFor(() => expect(getDataRows()).toHaveLength(1));
      expect(
        ngMocks.findAll(fixture, PaginatedCommitsDifferenceComponent)
      ).toHaveLength(0);
    });
  });

  describe("deleted branch mode", () => {
    it("shows empty state when branch is deleted and not merged", async () => {
      await renderComponent({
        development: { ...MOCK_DEVELOPMENT, deleted: true },
      });

      await waitFor(() =>
        expect(screen.getByText("No commits on this branch")).toBeTruthy()
      );
    });

    it("shows PR commits when branch is deleted but was merged", async () => {
      mockCommitsService.getPullRequestCommits.mockReturnValue(
        of([MOCK_COMMIT_WITH_URL])
      );
      await renderComponent({
        development: { ...MOCK_DEVELOPMENT, deleted: true },
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });

      await waitFor(() => expect(getDataRows()).toHaveLength(1));
      expect(mockCommitsService.getPullRequestCommits).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("emits errorOccurred when pull request commits service fails", async () => {
      const commitsSubject = new Subject<CommitDetails[]>();
      mockCommitsService.getPullRequestCommits.mockReturnValue(commitsSubject);
      const { fixture } = await renderComponent({
        development: { ...MOCK_DEVELOPMENT, deleted: true },
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });
      const errorSpy = jest.fn();
      fixture.componentInstance.errorOccurred.subscribe(errorSpy);

      commitsSubject.error(new Error("PR commits error"));

      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith(
          "Failed to load commit differences: PR commits error"
        )
      );
    });
  });

  describe("commit ID cell", () => {
    it("shows the truncated commit ID as a link when a URL is available", async () => {
      mockCommitsService.getPullRequestCommits.mockReturnValue(
        of([MOCK_COMMIT_WITH_URL])
      );
      await renderComponent({
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });

      await waitFor(() =>
        expect(
          screen.getByRole("link", {
            name: MOCK_COMMIT_WITH_URL.id.substring(0, 10),
          })
        ).toBeTruthy()
      );
    });

    it("links the commit ID to the correct URL", async () => {
      mockCommitsService.getPullRequestCommits.mockReturnValue(
        of([MOCK_COMMIT_WITH_URL])
      );
      await renderComponent({
        mergeRequest: {
          pullRequestId: "pr-123",
          mergeRequestState: MergeRequestState.MERGED,
        },
      });

      await waitFor(() => {
        const link = screen.getByRole("link", {
          name: MOCK_COMMIT_WITH_URL.id.substring(0, 10),
        });
        expect(link.getAttribute("href")).toBe(MOCK_COMMIT_WITH_URL.url);
      });
    });
  });
});
