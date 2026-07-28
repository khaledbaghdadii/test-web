import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of } from "rxjs";
import { Message } from "primeng/message";
import { MockComponent, ngMocks } from "ng-mocks";
import { ValidationProcessBranchDetailsComponent } from "./branch-details.component";
import type { ValidationProcessExecution } from "@mxevolve/domains/business-process/data-access";
import { ValidationProcessStageStatus } from "@mxevolve/domains/business-process/data-access";
import { DevelopmentDetailsComponent } from "@mxevolve/domains/scm/composite-widget";
import {
  CommitsService,
  Development,
  DevelopmentService,
  type MergeRequestOverview,
  MergeRequestService,
  MergeRequestState,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(DevelopmentDetailsComponent),
  MxevolveIconComponent,
  Message,
];

const mockDevelopmentService = {
  getDevelopment: jest.fn(),
};

const mockCommitsService = {
  getCommitDifferences: jest.fn(),
};

const mockMergeRequestService = {
  getFilteredMergeRequests: jest.fn(),
};

const MOCK_DEVELOPMENT: Development = {
  id: "dev-1",
  name: "feature/mv-branch",
  source: "main",
  projectId: "project-123",
  repository: { id: "repo-1", url: "https://repo.example.com" },
  latestCommitId: "abc123",
  parentCommitId: "def456",
  createdOn: "2025-01-15T10:00:00Z",
  deleted: false,
};

function buildExecution(
  stageStatus: ValidationProcessStageStatus,
  overrides: {
    developmentId?: string;
    errorMessage?: string;
  } = {}
): ValidationProcessExecution {
  return {
    id: "exec-1",
    name: "MV Run 1",
    projectId: "project-123",
    createBranchStage: {
      status: stageStatus,
      name: "Create Branch",
      startDate: "2025-01-15T10:00:00Z",
      endDate: "2025-01-15T10:05:00Z",
      errorMessage: overrides.errorMessage ?? "",
      route: "create-branch",
      developmentId: overrides.developmentId ?? "dev-1",
      headCommitIdUponExecution: "head-commit-1",
      createdBranch: stageStatus === ValidationProcessStageStatus.PASSED,
    },
  } as unknown as ValidationProcessExecution;
}

async function renderComponent(
  execution: ValidationProcessExecution = buildExecution(
    ValidationProcessStageStatus.PASSED,
    { developmentId: "dev-1" }
  )
) {
  return render(ValidationProcessBranchDetailsComponent, {
    inputs: { execution },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: DevelopmentService, useValue: mockDevelopmentService },
      { provide: CommitsService, useValue: mockCommitsService },
      { provide: MergeRequestService, useValue: mockMergeRequestService },
    ],
  });
}

describe("ValidationProcessBranchDetailsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevelopmentService.getDevelopment.mockReturnValue(of(MOCK_DEVELOPMENT));
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
    mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(of([]));
  });

  describe("branch creation failure", () => {
    it("shows the branch failure message when branch creation failed", async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED)
      );

      expect(screen.getByText(/Branch creation failed/)).toBeTruthy();
    });

    it("does not show the branch failure message when branch creation passed", async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.PASSED, {
          developmentId: "dev-1",
        })
      );

      expect(screen.queryByText(/Branch creation failed/)).toBeNull();
    });

    it('shows a "View details" link when a failure reason is provided', async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED, {
          errorMessage: "Pipeline failed to create branch",
        })
      );

      expect(screen.getByText("View details")).toBeTruthy();
    });

    it("does not show a failure details link when no failure reason is provided", async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED, {
          errorMessage: "",
        })
      );

      expect(screen.queryByText("View details")).toBeNull();
    });

    it("shows the failure reason when View details is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED, {
          errorMessage: "Network timeout during branch creation",
        })
      );

      await user.click(screen.getByText("View details"));

      expect(
        screen.getByText("Network timeout during branch creation")
      ).toBeTruthy();
    });

    it('changes the link to "Hide failure details" after View details is clicked', async () => {
      const user = userEvent.setup();
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED, {
          errorMessage: "Network timeout during branch creation",
        })
      );

      await user.click(screen.getByText("View details"));

      expect(screen.getByText("Hide failure details")).toBeTruthy();
    });

    it("hides the failure reason when Hide failure details is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED, {
          errorMessage: "Network timeout during branch creation",
        })
      );
      await user.click(screen.getByText("View details"));
      await user.click(screen.getByText("Hide failure details"));

      expect(
        screen.queryByText("Network timeout during branch creation")
      ).toBeNull();
    });
  });

  describe("branch details (successful branch creation)", () => {
    it("renders the development details widget when branch creation passed and development is loaded", async () => {
      const { fixture } = await renderComponent(
        buildExecution(ValidationProcessStageStatus.PASSED, {
          developmentId: "dev-1",
        })
      );

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-development-details-widget")
        ).toBeTruthy();
      });

      const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
      expect(devDetails.componentInstance.development).toEqual(
        MOCK_DEVELOPMENT
      );
    });

    it("does not render the development details widget when branch creation failed", async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.FAILED, {
          errorMessage: "failed",
        })
      );

      expect(
        document.querySelector("mxevolve-development-details-widget")
      ).toBeNull();
    });

    it("passes the latest merge request to the development details widget", async () => {
      const mergeRequest: MergeRequestOverview = {
        pullRequestId: "pr-123",
        mergeRequestState: MergeRequestState.MERGED,
        createdOn: "2025-01-20T10:00:00Z",
      };
      mockMergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of([mergeRequest])
      );
      const { fixture } = await renderComponent(
        buildExecution(ValidationProcessStageStatus.PASSED, {
          developmentId: "dev-1",
        })
      );

      await waitFor(() => {
        const devDetails = ngMocks.find(fixture, DevelopmentDetailsComponent);
        expect(devDetails.componentInstance.mergeRequest).toEqual(mergeRequest);
      });
    });
  });

  describe("no branch creation details (stage not yet started)", () => {
    it("does not show the failure message when stage is not started", async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.NOT_STARTED)
      );

      expect(screen.queryByText(/Branch creation failed/)).toBeNull();
    });

    it("does not render the development details widget when stage is not started", async () => {
      await renderComponent(
        buildExecution(ValidationProcessStageStatus.NOT_STARTED)
      );

      expect(
        document.querySelector("mxevolve-development-details-widget")
      ).toBeNull();
    });
  });
});
