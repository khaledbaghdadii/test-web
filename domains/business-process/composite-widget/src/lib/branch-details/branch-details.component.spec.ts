import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of } from "rxjs";
import { Message } from "primeng/message";
import { MockComponent, ngMocks } from "ng-mocks";
import { BranchDetailsComponent } from "./branch-details.component";
import type { BranchCreationDetails } from "@mxevolve/domains/business-process/util";
import { DevelopmentDetailsComponent } from "@mxevolve/domains/scm/composite-widget";
import {
  Development,
  MergeRequestService,
  MergeRequestState,
  type MergeRequestOverview,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(DevelopmentDetailsComponent),
  MxevolveIconComponent,
  Message,
];

const mockMergeRequestService = {
  getFilteredMergeRequests: jest.fn(),
};

const MOCK_DEVELOPMENT: Development = {
  id: "dev-1",
  name: "feature/my-branch",
  source: "main",
  projectId: "project-123",
  repository: { id: "repo-1", url: "" },
  latestCommitId: "abc123",
  parentCommitId: "def456",
  createdOn: "2024-01-01",
  deleted: false,
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  processId: "process-456",
  branchCreation: {
    developmentId: "",
    failed: false,
  } as BranchCreationDetails,
  development: MOCK_DEVELOPMENT,
};

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    processId: string;
    branchCreation: BranchCreationDetails;
    development: Development;
    commitsBehindCount: number;
  }> = {}
) {
  return render(BranchDetailsComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: MergeRequestService, useValue: mockMergeRequestService },
    ],
  });
}

describe("BranchDetailsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(of([]));
  });

  describe("branch failure", () => {
    it("shows the branch failure message when branch creation failed", async () => {
      await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: true },
      });

      expect(screen.getByText(/Branch creation failed/)).toBeTruthy();
    });

    it("does not show the branch failure message when branch creation succeeded", async () => {
      await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
      });

      expect(screen.queryByText(/Branch creation failed/)).toBeNull();
    });

    it('shows a "View details" link when a failure reason is provided', async () => {
      await renderComponent({
        branchCreation: {
          developmentId: "dev-1",
          failed: true,
          failureReason: "Pipeline error",
        },
      });

      expect(screen.getByText("View details")).toBeTruthy();
    });

    it("does not show a failure details link when no failure reason is provided", async () => {
      await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: true },
      });

      expect(screen.queryByText("View details")).toBeNull();
    });

    it("shows the failure reason when View details is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent({
        branchCreation: {
          developmentId: "dev-1",
          failed: true,
          failureReason: "Network error",
        },
      });

      await user.click(screen.getByText("View details"));

      expect(screen.getByText("Network error")).toBeTruthy();
    });

    it('changes the link to "Hide failure details" when failure details are visible', async () => {
      const user = userEvent.setup();
      await renderComponent({
        branchCreation: {
          developmentId: "dev-1",
          failed: true,
          failureReason: "Network error",
        },
      });

      await user.click(screen.getByText("View details"));

      expect(screen.getByText("Hide failure details")).toBeTruthy();
    });

    it("hides the failure reason when Hide failure details is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent({
        branchCreation: {
          developmentId: "dev-1",
          failed: true,
          failureReason: "Network error",
        },
      });
      await user.click(screen.getByText("View details"));

      await user.click(screen.getByText("Hide failure details"));

      expect(screen.queryByText("Network error")).toBeNull();
    });
  });

  describe("development details", () => {
    it("renders the development details widget when branch creation succeeded and development is loaded", async () => {
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
      });

      expect(
        document.querySelector("mxevolve-development-details-widget")
      ).toBeTruthy();
      const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
      expect(devDetails.componentInstance.development).toEqual(
        MOCK_DEVELOPMENT
      );
    });
  });

  describe("merge request integration", () => {
    it("passes the full MergeRequestOverview when the latest MR is merged", async () => {
      const mergedMergeRequest: MergeRequestOverview = {
        pullRequestId: "pr-merged-123",
        mergeRequestState: MergeRequestState.MERGED,
        createdOn: "2026-03-01T10:00:00Z",
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of([mergedMergeRequest])
      );
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
      });

      await waitFor(() => {
        const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
        expect(devDetails.componentInstance.mergeRequest).toEqual(
          mergedMergeRequest
        );
      });
    });

    it("passes the full MergeRequestOverview when the latest MR is in a non-unsuccessful state", async () => {
      const inReviewMergeRequest: MergeRequestOverview = {
        pullRequestId: "pr-in-review-789",
        mergeRequestState: MergeRequestState.IN_REVIEW,
        createdOn: "2026-03-01T10:00:00Z",
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of([inReviewMergeRequest])
      );
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
      });

      await waitFor(() => {
        const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
        expect(devDetails.componentInstance.mergeRequest).toEqual(
          inReviewMergeRequest
        );
      });
    });

    it("passes the full MergeRequestOverview even when the latest MR is in an unsuccessful end state", async () => {
      const declinedMergeRequest: MergeRequestOverview = {
        pullRequestId: "pr-declined-456",
        mergeRequestState: MergeRequestState.DECLINED,
        createdOn: "2026-03-01T10:00:00Z",
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of([declinedMergeRequest])
      );
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
      });

      await waitFor(() => {
        const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
        expect(devDetails.componentInstance.mergeRequest).toEqual(
          declinedMergeRequest
        );
      });
    });

    it("passes undefined mergeRequest when no merge requests exist", async () => {
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(of([]));
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
      });

      await waitFor(() => {
        const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
        expect(devDetails.componentInstance.mergeRequest).toBeUndefined();
      });
    });

    it("passes the latest MR even when it is unsuccessful and an older successful MR exists", async () => {
      const olderMergedRequest: MergeRequestOverview = {
        pullRequestId: "pr-old-merged",
        mergeRequestState: MergeRequestState.MERGED,
        createdOn: "2026-01-01T10:00:00Z",
      };
      const newerDeclinedRequest: MergeRequestOverview = {
        pullRequestId: "pr-new-declined",
        mergeRequestState: MergeRequestState.DECLINED,
        createdOn: "2026-03-15T10:00:00Z",
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of([newerDeclinedRequest, olderMergedRequest])
      );
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
      });

      await waitFor(() => {
        const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
        expect(devDetails.componentInstance.mergeRequest).toEqual(
          newerDeclinedRequest
        );
      });
    });

    it("does not fetch merge requests when branch creation failed", async () => {
      await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: true },
      });

      expect(
        mockMergeRequestService.getFilteredMergeRequests
      ).not.toHaveBeenCalled();
    });

    it("does not fetch merge requests when developmentId is not available", async () => {
      await renderComponent({
        branchCreation: { developmentId: "", failed: false },
      });

      expect(
        mockMergeRequestService.getFilteredMergeRequests
      ).not.toHaveBeenCalled();
    });

    it("fetches merge requests with the correct filter parameters", async () => {
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(of([]));
      await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
      });

      await waitFor(() =>
        expect(
          mockMergeRequestService.getFilteredMergeRequests
        ).toHaveBeenCalledWith("project-123", {
          developmentId: "dev-1",
          contextId: "process-456",
        })
      );
    });
  });

  describe("commits behind warning", () => {
    it("passes commitsBehindCount to development-details-widget", async () => {
      const { fixture } = await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: MOCK_DEVELOPMENT,
        commitsBehindCount: 3,
      });

      const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
      expect(ngMocks.input(devDetails, "commitsBehindCount")).toBe(3);
    });

    it("does not render development-details-widget when development is not loaded", async () => {
      await renderComponent({
        branchCreation: { developmentId: "dev-1", failed: false },
        development: undefined,
        commitsBehindCount: 3,
      });

      expect(
        document.querySelector("mxevolve-development-details-widget")
      ).toBeNull();
    });
  });
});
