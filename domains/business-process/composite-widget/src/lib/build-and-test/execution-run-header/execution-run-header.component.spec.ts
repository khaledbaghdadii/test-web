import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of } from "rxjs";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { MockComponent, ngMocks } from "ng-mocks";
import { ExecutionRunHeaderComponent } from "./execution-run-header.component";
import type { BuildAndTestProcessExecution } from "@mxevolve/domains/business-process/util";
import {
  BuildAndTestSourceType,
  ExecutionFamily,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { BuildAndTestActivityRunDetailsComponent } from "@mxevolve/domains/business-process/widget";
import {
  ExecutionAlertDisplayComponent,
  ExecutionStatusTagComponent,
  ExpiryChipComponent,
} from "@mxevolve/domains/business-process/ui";
import { ExecutionAbortButtonComponent } from "../../execution-abort-button/execution-abort-button.component";
import { BranchDetailsComponent } from "../../branch-details/branch-details.component";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  CommitsService,
  Development,
  DevelopmentService,
} from "@mxevolve/domains/scm/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(ExecutionStatusTagComponent),
  MockComponent(ExpiryChipComponent),
  MockComponent(ExecutionAlertDisplayComponent),
  MockComponent(ExecutionAbortButtonComponent),
  MockComponent(BuildAndTestActivityRunDetailsComponent),
  MockComponent(BranchDetailsComponent),
  MockComponent(MxevolveIconComponent),
  Divider,
  Card,
  TooltipModule,
];

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockDevelopmentService = {
  getDevelopment: jest.fn(),
};

const mockCommitsService = {
  getCommitDifferences: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
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

const BASE_EXECUTION: BuildAndTestProcessExecution = {
  id: "exec-123",
  projectId: "project-123",
  name: "execution-1",
  status: ExecutionStatus.RUNNING,
  definitionId: "def-1",
  definitionName: "definition-name",
  familyName: "Build & Test Process",
  processName: "Configuration Build & Test",
  supportsResourceManagement: false,
  hasPredefinedMergeRequestInputs: false,
  ciVersion: 2,
  notificationsRecipients: [],
  owner: "owner",
  source: { id: "source-1", type: BuildAndTestSourceType.USER },
  input: {
    repositoryId: "repo-1",
    configurationBranchName: "config/branch",
    configurationParentBranch: "config/parent",
    userStoryIds: ["US-1"],
    buildAndTestInfraGroup: "test-env-infra",
    buildEnvironmentInfraGroup: "build-env-infra",
    buildEnvironment: {
      skipEnvironmentDeployment: false,
      scenarioDefinitionId: "scenario-def-1",
    },
  },
  createBranchStage: {
    name: "create-branch",
    status: StageStatus.NOT_STARTED,
    route: "create-branch",
  },
  prepareBuildStage: {
    name: "prepare-build",
    status: StageStatus.NOT_STARTED,
    route: "prepare-build",
  },
  buildAndTestStage: {
    name: "build-and-test",
    status: StageStatus.NOT_STARTED,
    route: "build-and-test",
  },
  integrateChangesStage: {
    name: "integrate-changes",
    status: StageStatus.NOT_STARTED,
    route: "integrate-changes",
  },
};

async function renderComponent(
  overrides: Partial<BuildAndTestProcessExecution> = {}
) {
  return render(ExecutionRunHeaderComponent, {
    inputs: { execution: { ...BASE_EXECUTION, ...overrides } },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: BuildAndTestProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      { provide: DevelopmentService, useValue: mockDevelopmentService },
      { provide: CommitsService, useValue: mockCommitsService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("ExecutionRunHeaderComponent (build & test)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevelopmentService.getDevelopment.mockReturnValue(of(MOCK_DEVELOPMENT));
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
  });

  describe("execution name", () => {
    it("shows the execution name in the header", async () => {
      await renderComponent({ name: "my-execution" });

      expect(screen.getByText("my-execution")).toBeTruthy();
    });
  });

  describe("status tag", () => {
    it("shows the status tag with the execution status", async () => {
      const { fixture } = await renderComponent({
        status: ExecutionStatus.RUNNING,
      });

      const statusTag = ngMocks.find(fixture, ExecutionStatusTagComponent);
      expect(ngMocks.input(statusTag, "status")).toBe(ExecutionStatus.RUNNING);
    });
  });

  describe("expiry chip", () => {
    it("shows the expiry chip when the execution has an expiry date and has not ended", async () => {
      const { fixture } = await renderComponent({
        expiryDate: "2025-12-01T00:00:00Z",
      });

      const expiryChip = ngMocks.find(fixture, ExpiryChipComponent);
      expect(ngMocks.input(expiryChip, "expiryDate")).toBe(
        "2025-12-01T00:00:00Z"
      );
    });

    it("does not show the expiry chip when no expiry date is provided", async () => {
      await renderComponent();

      expect(document.querySelector("mxevolve-expiry-chip")).toBeNull();
    });

    it("does not show the expiry chip when the execution has ended", async () => {
      await renderComponent({
        expiryDate: "2025-12-01T00:00:00Z",
        endDate: "2025-11-15T00:00:00Z",
      });

      expect(document.querySelector("mxevolve-expiry-chip")).toBeNull();
    });
  });

  describe("abort button", () => {
    it("renders the abort button with the correct inputs", async () => {
      const { fixture } = await renderComponent({
        status: ExecutionStatus.RUNNING,
      });

      const abortButton = ngMocks.find(fixture, ExecutionAbortButtonComponent);
      expect(ngMocks.input(abortButton, "projectId")).toBe("project-123");
      expect(ngMocks.input(abortButton, "processId")).toBe("exec-123");
      expect(ngMocks.input(abortButton, "status")).toBe(
        ExecutionStatus.RUNNING
      );
      expect(ngMocks.input(abortButton, "familyId")).toBe(
        ExecutionFamily.USER_STORY_BUILD_AND_TEST
      );
    });

    it("reloads the process when the abort button fires its event", async () => {
      const { fixture } = await renderComponent();

      ngMocks
        .find(fixture, ExecutionAbortButtonComponent)
        .componentInstance.aborted.emit();

      await waitFor(() => {
        expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
          "exec-123",
          "project-123"
        );
      });
    });
  });

  describe("tabs", () => {
    it("always shows the Activity Run Details tab", async () => {
      await renderComponent();

      expect(screen.getByText("Activity Run Details")).toBeTruthy();
    });

    it("never shows a Reference Environment tab", async () => {
      await renderComponent();

      expect(screen.queryByText("Reference Environment")).toBeNull();
    });

    it("shows the Branch Details tab when createBranchStage has passed", async () => {
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          route: "create-branch",
          developmentId: "dev-1",
        },
      });

      expect(screen.getByText("Branch Details")).toBeTruthy();
    });

    it("shows the Branch Details tab when createBranchStage has failed", async () => {
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.FAILED,
          route: "create-branch",
        },
      });

      expect(screen.getByText("Branch Details")).toBeTruthy();
    });

    it("does not show the Branch Details tab when createBranchStage has not started", async () => {
      await renderComponent();

      expect(screen.queryByText("Branch Details")).toBeNull();
    });

    it("auto-selects the Branch Details tab when branch creation has failed", async () => {
      const { fixture } = await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.FAILED,
          route: "create-branch",
          errorMessage: "Branch creation failed",
        },
      });

      const branchDetails = ngMocks.find(fixture, BranchDetailsComponent);
      expect(ngMocks.input(branchDetails, "branchCreation")).toEqual({
        failed: true,
        failureReason: "Branch creation failed",
      });
    });

    it("shows activity run details content with the execution when the tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByText("Activity Run Details"));

      const details = ngMocks.find(
        fixture,
        BuildAndTestActivityRunDetailsComponent
      );
      expect(ngMocks.input(details, "execution")).toEqual(BASE_EXECUTION);
    });

    it("hides activity run details content when the tab is clicked again", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByText("Activity Run Details"));
      await user.click(screen.getByText("Activity Run Details"));

      expect(
        document.querySelector(
          "mxevolve-build-and-test-activity-run-details"
        )
      ).toBeNull();
    });

    it("shows branch details content with the correct inputs when the tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          route: "create-branch",
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));

      const branchDetails = ngMocks.find(fixture, BranchDetailsComponent);
      expect(ngMocks.input(branchDetails, "projectId")).toBe("project-123");
      expect(ngMocks.input(branchDetails, "processId")).toBe("exec-123");
      expect(ngMocks.input(branchDetails, "branchCreation")).toEqual({
        developmentId: "dev-1",
        failed: false,
      });
    });

    it("passes fetched development to branch details when branch stage has passed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          route: "create-branch",
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));

      await waitFor(() => {
        const branchDetails = ngMocks.find(fixture, BranchDetailsComponent);
        expect(ngMocks.input(branchDetails, "development")).toEqual(
          MOCK_DEVELOPMENT
        );
      });
    });

    it("passes commitsBehindCount > 0 to branch details when branch is behind", async () => {
      mockCommitsService.getCommitDifferences.mockReturnValue(
        of([{ id: "c1" }, { id: "c2" }, { id: "c3" }])
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          route: "create-branch",
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));

      await waitFor(() => {
        const branchDetails = ngMocks.find(fixture, BranchDetailsComponent);
        expect(ngMocks.input(branchDetails, "commitsBehindCount")).toBe(3);
      });
    });

    it("does not fetch development when branch creation has failed", async () => {
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.FAILED,
          route: "create-branch",
          errorMessage: "Branch creation failed",
        },
      });

      expect(mockDevelopmentService.getDevelopment).not.toHaveBeenCalled();
    });
  });
});
