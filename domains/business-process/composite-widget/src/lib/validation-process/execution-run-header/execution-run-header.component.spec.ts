import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { MockComponent, ngMocks } from "ng-mocks";
import { ValidationProcessExecutionRunHeaderComponent } from "./execution-run-header.component";
import type { ValidationProcessExecution } from "@mxevolve/domains/business-process/data-access";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import {
  ExecutionStatusTagComponent,
  ExpiryChipComponent,
} from "@mxevolve/domains/business-process/ui";
import { ValidationProcessActivityRunDetailsComponent } from "@mxevolve/domains/business-process/widget";
import { BreadcrumbComponent } from "@mxevolve/domains/analytics/widget";
import { ExecutionAbortButtonComponent } from "../../execution-abort-button/execution-abort-button.component";
import { ValidationProcessBranchDetailsComponent } from "../branch-details/branch-details.component";

const MOCK_IMPORTS = [
  MockComponent(ExecutionStatusTagComponent),
  MockComponent(ExpiryChipComponent),
  MockComponent(ExecutionAbortButtonComponent),
  MockComponent(ValidationProcessActivityRunDetailsComponent),
  MockComponent(ValidationProcessBranchDetailsComponent),
  MockComponent(BreadcrumbComponent),
  Divider,
  Card,
];

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const BASE_EXECUTION: ValidationProcessExecution = {
  id: "exec-123",
  name: "mv-execution-1",
  projectId: "project-123",
  projectName: "My Project",
  sourceDefinitionId: "def-1",
  owner: "user-1",
  familyId: "master-validation",
  familyName: "Master Validation",
  definitionId: "def-1",
  definitionName: "MV Template",
  processName: "Continuous MV",
  hidden: false,
  errorMessage: "",
  startDate: "2025-01-01T00:00:00Z",
  endDate: "",
  expiryDate: "",
  businessProcessQualityLevel: "MQG",
  officiality: "OFFICIAL",
  daysExtended: 0,
  status: ExecutionStatus.RUNNING,
  input: {} as ValidationProcessExecution["input"],
  createBranchStage: {
    name: "create-branch",
    status: ValidationProcessStageStatus.NOT_STARTED,
    startDate: "",
    endDate: "",
    errorMessage: "",
    route: "create-branch",
    developmentId: "",
    headCommitIdUponExecution: "",
    createdBranch: false,
  },
  executeQualityGatesStage: {
    name: "execute-quality-gates",
    status: ValidationProcessStageStatus.NOT_STARTED,
    startDate: "",
    endDate: "",
    errorMessage: "",
    route: "execute-quality-gates",
  } as ValidationProcessExecution["executeQualityGatesStage"],
  tagArchivalBranchStage: {
    name: "tag-archival-branch",
    status: ValidationProcessStageStatus.NOT_STARTED,
    startDate: "",
    endDate: "",
    errorMessage: "",
    route: "tag-archival-branch",
  } as ValidationProcessExecution["tagArchivalBranchStage"],
  integrateFixesStage: {
    name: "integrate-fixes",
    status: ValidationProcessStageStatus.NOT_STARTED,
    startDate: "",
    endDate: "",
    errorMessage: "",
    route: "integrate-fixes",
  } as ValidationProcessExecution["integrateFixesStage"],
};

async function renderComponent(
  overrides: Partial<ValidationProcessExecution> = {}
) {
  return render(ValidationProcessExecutionRunHeaderComponent, {
    inputs: { execution: { ...BASE_EXECUTION, ...overrides } },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: ValidationProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
    ],
  });
}

describe("ValidationProcessExecutionRunHeaderComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("breadcrumb", () => {
    it("renders the breadcrumb with the business process resource type and execution ids", async () => {
      const { fixture } = await renderComponent();

      const breadcrumb = ngMocks.find(fixture, BreadcrumbComponent);
      expect(ngMocks.input(breadcrumb, "resourceType")).toBe(
        "BUSINESS_PROCESS"
      );
      expect(ngMocks.input(breadcrumb, "resourceId")).toBe("exec-123");
      expect(ngMocks.input(breadcrumb, "projectId")).toBe("project-123");
    });
  });

  describe("execution name", () => {
    it("shows the execution name", async () => {
      await renderComponent({ name: "my-mv-run" });

      expect(screen.getByText("my-mv-run")).toBeTruthy();
    });
  });

  describe("status tag", () => {
    it("renders the status tag with the execution status", async () => {
      const { fixture } = await renderComponent({
        status: ExecutionStatus.RUNNING,
      });

      const statusTag = ngMocks.find(fixture, ExecutionStatusTagComponent);
      expect(ngMocks.input(statusTag, "status")).toBe(ExecutionStatus.RUNNING);
    });
  });

  describe("expiry chip", () => {
    it("shows the expiry chip when the execution has an expiry date and has not ended", async () => {
      await renderComponent({
        expiryDate: "2025-12-01T00:00:00Z",
        endDate: "",
      });

      expect(document.querySelector("mxevolve-expiry-chip")).toBeTruthy();
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
    it("renders the abort button wired with the validation family", async () => {
      const { fixture } = await renderComponent({
        status: ExecutionStatus.RUNNING,
      });

      const abortButton = ngMocks.find(fixture, ExecutionAbortButtonComponent);
      expect(ngMocks.input(abortButton, "familyId")).toBe(
        ExecutionFamily.VALIDATION_PROCESS
      );
      expect(ngMocks.input(abortButton, "projectId")).toBe("project-123");
      expect(ngMocks.input(abortButton, "processId")).toBe("exec-123");
      expect(ngMocks.input(abortButton, "status")).toBe(
        ExecutionStatus.RUNNING
      );
    });

    it("reloads the process when the abort button fires its event", async () => {
      const { fixture } = await renderComponent();

      ngMocks
        .find(fixture, ExecutionAbortButtonComponent)
        .componentInstance.aborted.emit();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        "exec-123",
        "project-123"
      );
    });
  });

  describe("tabs", () => {
    it("always shows the Activity Run Details tab", async () => {
      await renderComponent();

      expect(screen.getByText("Run Details")).toBeTruthy();
    });

    it("shows the Branch Details tab when create-branch stage has passed", async () => {
      await renderComponent({
        createBranchStage: {
          ...BASE_EXECUTION.createBranchStage,
          status: ValidationProcessStageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      expect(screen.getByText("Branch Details")).toBeTruthy();
    });

    it("shows the Branch Details tab when create-branch stage has failed", async () => {
      await renderComponent({
        createBranchStage: {
          ...BASE_EXECUTION.createBranchStage,
          status: ValidationProcessStageStatus.FAILED,
        },
      });

      expect(screen.getByText("Branch Details")).toBeTruthy();
    });

    it("does not show the Branch Details tab when create-branch stage has not started", async () => {
      await renderComponent();

      expect(screen.queryByText("Branch Details")).toBeNull();
    });

    it("does not open any tab by default when branch creation has not failed", async () => {
      await renderComponent();

      expect(
        document.querySelector(
          "mxevolve-validation-process-activity-run-details"
        )
      ).toBeNull();
    });

    it("defaults to the branch-details tab when branch creation has failed", async () => {
      await renderComponent({
        createBranchStage: {
          ...BASE_EXECUTION.createBranchStage,
          status: ValidationProcessStageStatus.FAILED,
          errorMessage: "Branch creation failed",
        },
      });

      expect(
        document.querySelector("mxevolve-validation-process-branch-details")
      ).toBeTruthy();
      expect(
        document.querySelector(
          "mxevolve-validation-process-activity-run-details"
        )
      ).toBeNull();
    });

    it("toggles the active tab closed when clicked again", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByText("Run Details"));

      expect(
        document.querySelector(
          "mxevolve-validation-process-activity-run-details"
        )
      ).toBeTruthy();

      await user.click(screen.getByText("Run Details"));

      expect(
        document.querySelector(
          "mxevolve-validation-process-activity-run-details"
        )
      ).toBeNull();
    });

    it("shows activity run details with the execution when the tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          ...BASE_EXECUTION.createBranchStage,
          status: ValidationProcessStageStatus.FAILED,
        },
      });

      await user.click(screen.getByText("Run Details"));

      const details = ngMocks.find(
        fixture,
        ValidationProcessActivityRunDetailsComponent
      );
      expect(ngMocks.input(details, "execution")).toMatchObject({
        id: "exec-123",
        projectId: "project-123",
      });
    });

    it("shows branch details with the execution when the Branch Details tab is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        createBranchStage: {
          ...BASE_EXECUTION.createBranchStage,
          status: ValidationProcessStageStatus.PASSED,
          developmentId: "dev-1",
        },
      });

      await user.click(screen.getByText("Branch Details"));

      const branchDetails = ngMocks.find(
        fixture,
        ValidationProcessBranchDetailsComponent
      );
      expect(ngMocks.input(branchDetails, "execution")).toMatchObject({
        id: "exec-123",
        projectId: "project-123",
      });
    });

    it("does not render a Reference Environment tab (D4 extension point inactive)", async () => {
      await renderComponent();

      expect(screen.queryByText("Reference Environment")).toBeNull();
    });
  });
});
