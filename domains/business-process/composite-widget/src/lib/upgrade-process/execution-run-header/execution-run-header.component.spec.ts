import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { MockComponent, ngMocks } from "ng-mocks";
import { ExecutionRunHeaderComponent } from "./execution-run-header.component";
import type { UpgradeProcessExecution } from "@mxevolve/domains/business-process/util";
import {
  ExecutionFamily,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { ActivityRunDetailsComponent } from "@mxevolve/domains/business-process/widget";
import {
  ExecutionAlertDisplayComponent,
  ExecutionStatusTagComponent,
  ExpiryChipComponent,
} from "@mxevolve/domains/business-process/ui";
import { ExecutionAbortButtonComponent } from "../../execution-abort-button/execution-abort-button.component";
import { ReferenceEnvironmentsComponent } from "../reference-environments/reference-environments.component";
import { BranchDetailsComponent } from "../../branch-details/branch-details.component";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
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
  MockComponent(ActivityRunDetailsComponent),
  MockComponent(BranchDetailsComponent),
  MockComponent(ReferenceEnvironmentsComponent),
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

const BASE_REFERENCE_ENV_DEPLOYMENT = {
  name: "reference-environment-deployment",
  status: StageStatus.NOT_STARTED,
  supported: false,
  enabledInCurrentlyActiveStage: false,
  limitReached: false,
  canCleanAndDeploy: false,
  referenceEnvironments: [],
  requestIds: [],
};

const BASE_EXECUTION: UpgradeProcessExecution = {
  id: "exec-123",
  projectId: "project-123",
  name: "execution-1",
  status: ExecutionStatus.RUNNING,
  definitionId: "def-1",
  supportsResourceManagement: false,
  notificationsRecipients: [],
  officiality: "official",
  definitionName: "definition-name",
  familyName: "Upgrade Process",
  processName: "upgrade-process",
  input: {
    factoryProductId: "MX.3",
    mxVersion: "3.1.64",
    mxBuildId: "build-123",
    bipVersion: "2.0.1",
    bipBuildId: "bip-456",
    parentMxArchivalBranch: "archival/main",
    repositoryId: "repo-1",
    configurationBranchName: "config/branch",
    configurationParentBranch: "config/parent",
    createBranch: true,
    binaryConversionInfraGroupId: "infra-group-1",
    qualityGateExecutionInfraGroupId: "infra-group-2",
    binaryConversionTestScenarioId: "scenario-3",
    businessProcessQualityLevel: "MQG",
    upgradeJump: "upgrade-jump-1",
  },
  createBranchStage: {
    name: "create-branch",
    status: StageStatus.NOT_STARTED,
  },
  binaryConversionStage: {
    name: "binary-conversion",
    status: StageStatus.NOT_STARTED,
  },
  executeQualityGateStage: {
    name: "execute-quality-gate",
    status: StageStatus.NOT_STARTED,
  },
  tagUpgradeBranchStage: {
    name: "tag-upgrade-branch",
    status: StageStatus.NOT_STARTED,
  },
  integrateChangesStage: {
    name: "integrate-changes",
    status: StageStatus.NOT_STARTED,
  },
  referenceEnvironmentDeployment: BASE_REFERENCE_ENV_DEPLOYMENT,
};

async function renderComponent(
  overrides: Partial<UpgradeProcessExecution> = {}
) {
  return render(ExecutionRunHeaderComponent, {
    inputs: { execution: { ...BASE_EXECUTION, ...overrides } },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: UpgradeProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      { provide: DevelopmentService, useValue: mockDevelopmentService },
      { provide: CommitsService, useValue: mockCommitsService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("ExecutionRunHeaderComponent", () => {
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

      expect(
        document.querySelector("mxevolve-execution-status-tag")
      ).toBeTruthy();
      const statusTag = ngMocks.find(fixture, ExecutionStatusTagComponent);
      expect(ngMocks.input(statusTag, "status")).toBe(ExecutionStatus.RUNNING);
    });
  });

  describe("expiry chip", () => {
    it("shows the expiry chip when the execution has an expiry date and has not ended", async () => {
      const { fixture } = await renderComponent({
        expiryDate: "2025-12-01T00:00:00Z",
      });

      expect(document.querySelector("mxevolve-expiry-chip")).toBeTruthy();
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

      expect(
        document.querySelector("mxevolve-execution-abort-button")
      ).toBeTruthy();
      const abortButton = ngMocks.find(fixture, ExecutionAbortButtonComponent);
      expect(ngMocks.input(abortButton, "projectId")).toBe("project-123");
      expect(ngMocks.input(abortButton, "processId")).toBe("exec-123");
      expect(ngMocks.input(abortButton, "status")).toBe(
        ExecutionStatus.RUNNING
      );
      expect(ngMocks.input(abortButton, "familyId")).toBe(
        ExecutionFamily.UPGRADE_PROCESS
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

    it("shows the Reference Environment tab when referenceEnvironmentDeployment is supported", async () => {
      await renderComponent({
        referenceEnvironmentDeployment: {
          ...BASE_REFERENCE_ENV_DEPLOYMENT,
          supported: true,
        },
      });

      expect(screen.getByText("Reference Environment")).toBeTruthy();
    });

    it("does not show the Reference Environment tab when referenceEnvironmentDeployment is not supported", async () => {
      await renderComponent();

      expect(screen.queryByText("Reference Environment")).toBeNull();
    });

    it("shows the Branch Details tab when createBranchStage has passed", async () => {
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
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
          errorMessage: "Branch creation failed",
        },
      });

      expect(document.querySelector("mxevolve-branch-details")).toBeTruthy();
      const branchDetails = ngMocks.find(fixture, BranchDetailsComponent);
      expect(ngMocks.input(branchDetails, "branchCreation")).toEqual({
        failed: true,
        failureReason: "Branch creation failed",
      });
    });

    it("shows reference environment content with the correct inputs when the tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        referenceEnvironmentDeployment: {
          name: "reference-environment-deployment",
          status: StageStatus.NOT_STARTED,
          supported: true,
          enabledInCurrentlyActiveStage: true,
          limitReached: false,
          canCleanAndDeploy: true,
          referenceEnvironments: ["env-1"],
          requestIds: ["req-1"],
        },
      });

      await user.click(screen.getByText("Reference Environment"));

      expect(
        document.querySelector(
          "mxevolve-upgrade-process-reference-environments"
        )
      ).toBeTruthy();
      const refEnv = ngMocks.find(fixture, ReferenceEnvironmentsComponent);
      expect(ngMocks.input(refEnv, "projectId")).toBe("project-123");
      expect(ngMocks.input(refEnv, "processId")).toBe("exec-123");
      expect(ngMocks.input(refEnv, "enabledInCurrentlyActiveStage")).toBe(true);
      expect(ngMocks.input(refEnv, "limitReached")).toBe(false);
      expect(ngMocks.input(refEnv, "canCleanAndDeploy")).toBe(true);
      expect(ngMocks.input(refEnv, "environmentIds")).toEqual(["env-1"]);
      expect(ngMocks.input(refEnv, "requestIds")).toEqual(["req-1"]);
    });

    it("hides reference environment content when the tab is clicked again", async () => {
      const user = userEvent.setup();
      await renderComponent({
        referenceEnvironmentDeployment: {
          ...BASE_REFERENCE_ENV_DEPLOYMENT,
          supported: true,
        },
      });

      await user.click(screen.getByText("Reference Environment"));
      await user.click(screen.getByText("Reference Environment"));

      expect(
        document.querySelector(
          "mxevolve-upgrade-process-reference-environments"
        )
      ).toBeNull();
    });

    it("shows activity run details content with the execution when the tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByText("Activity Run Details"));

      expect(
        document.querySelector("mxevolve-upgrade-process-activity-run-details")
      ).toBeTruthy();
      const details = ngMocks.find(fixture, ActivityRunDetailsComponent);
      expect(ngMocks.input(details, "execution")).toEqual(BASE_EXECUTION);
    });

    it("hides activity run details content when the tab is clicked again", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByText("Activity Run Details"));
      await user.click(screen.getByText("Activity Run Details"));

      expect(
        document.querySelector("mxevolve-upgrade-process-activity-run-details")
      ).toBeNull();
    });

    it("shows branch details content with the correct inputs when the tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));

      expect(document.querySelector("mxevolve-branch-details")).toBeTruthy();
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

    it("passes commitsBehindCount 0 to branch details when branch is up-to-date", async () => {
      mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));

      await waitFor(() => {
        const branchDetails = ngMocks.find(fixture, BranchDetailsComponent);
        expect(ngMocks.input(branchDetails, "commitsBehindCount")).toBe(0);
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
          errorMessage: "Branch creation failed",
        },
      });

      expect(mockDevelopmentService.getDevelopment).not.toHaveBeenCalled();
    });

    it("shows a warning icon on the Branch Details tab when branch is behind", async () => {
      mockCommitsService.getCommitDifferences.mockReturnValue(
        of([{ id: "c1" }, { id: "c2" }])
      );
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await waitFor(() => {
        const icon = document.querySelector("mxevolve-icon");
        expect(icon).toBeTruthy();
      });
    });

    it("does not show warning icon on Branch Details tab when branch is up-to-date", async () => {
      mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await waitFor(() => {
        expect(document.querySelector("mxevolve-icon")).toBeNull();
      });
    });

    it("sets the tooltip to the correct text when branch is behind", async () => {
      const user = userEvent.setup();
      mockCommitsService.getCommitDifferences.mockReturnValue(
        of([{ id: "c1" }, { id: "c2" }])
      );
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      const icon = await waitFor(() => {
        const el = document.querySelector("mxevolve-icon");
        expect(el).toBeTruthy();
        return el!;
      });

      await user.hover(icon);

      await waitFor(() => {
        expect(screen.getByText("2 commits behind main")).toBeTruthy();
      });
    });

    it("hides branch details content when the tab is clicked again", async () => {
      const user = userEvent.setup();
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));
      await user.click(screen.getByText("Branch Details"));

      expect(document.querySelector("mxevolve-branch-details")).toBeNull();
    });

    it("calls getDevelopment with includeDeleted flag set to true", async () => {
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await waitFor(() => {
        expect(mockDevelopmentService.getDevelopment).toHaveBeenCalledWith(
          "project-123",
          "dev-1",
          true
        );
      });
    });

    it("does not fetch commit differences when development is deleted", async () => {
      mockDevelopmentService.getDevelopment.mockReturnValue(
        of({ ...MOCK_DEVELOPMENT, deleted: true })
      );
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await waitFor(() => {
        expect(mockDevelopmentService.getDevelopment).toHaveBeenCalled();
      });
      expect(mockCommitsService.getCommitDifferences).not.toHaveBeenCalled();
      expect(document.querySelector("mxevolve-icon")).toBeNull();
    });

    it("shows an error toast when fetching commits behind fails", async () => {
      mockCommitsService.getCommitDifferences.mockReturnValue(
        throwError(() => new Error("network error"))
      );
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Failed to fetch commits behind count."
        );
      });
    });

    it("returns singular 'commit' in tooltip when exactly 1 commit behind", async () => {
      const user = userEvent.setup();
      mockCommitsService.getCommitDifferences.mockReturnValue(
        of([{ id: "c1" }])
      );
      await renderComponent({
        createBranchStage: {
          name: "create-branch",
          status: StageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      const icon = await waitFor(() => {
        const el = document.querySelector("mxevolve-icon");
        expect(el).toBeTruthy();
        return el!;
      });

      await user.hover(icon);

      await waitFor(() => {
        expect(screen.getByText("1 commit behind main")).toBeTruthy();
      });
    });
  });
});
