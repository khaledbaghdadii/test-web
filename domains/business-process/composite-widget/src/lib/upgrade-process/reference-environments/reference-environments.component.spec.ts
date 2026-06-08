import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";
import { Button } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Message } from "primeng/message";
import { Toast } from "primeng/toast";
import { Tooltip } from "primeng/tooltip";
import { ConfirmationService } from "primeng/api";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  UserRequestService,
  UserRequestStatus,
} from "@mxevolve/domains/environment/data-access";
import {
  ReferenceEnvironmentService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { EnvironmentsTableComponent } from "@mxevolve/domains/environment/widget";
import { MockComponent, ngMocks } from "ng-mocks";
import { ReferenceEnvironmentsComponent } from "./reference-environments.component";

const MOCK_IMPORTS = [
  MockComponent(EnvironmentsTableComponent),
  MxevolveIconComponent,
  Button,
  ConfirmDialog,
  Message,
  Toast,
  Tooltip,
];

const mockUserRequestService = {
  fetchUserRequestStatus: jest.fn(() =>
    of({
      environmentIds: ["env-1", "env-2"],
      latestRequestInProgress: false,
      latestRequestFailed: false,
    })
  ),
};

const mockUpgradeProcessExecutionService = {
  deployReferenceEnvironment: jest.fn(() => of(undefined)),
  cleanAndDeployReferenceEnvironment: jest.fn(() => of(undefined)),
};

const mockUpgradeProcessStateUpdaterService = {
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  processId: "process-456",
  enabledInCurrentlyActiveStage: true,
  limitReached: false,
  canCleanAndDeploy: true,
  environmentIds: [] as string[],
  requestIds: [] as string[],
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ReferenceEnvironmentsComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: UserRequestService, useValue: mockUserRequestService },
      {
        provide: ReferenceEnvironmentService,
        useValue: mockUpgradeProcessExecutionService,
      },
      { provide: ConfirmationService, useValue: new ConfirmationService() },
      {
        provide: UpgradeProcessStateUpdaterService,
        useValue: mockUpgradeProcessStateUpdaterService,
      },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("ReferenceEnvironmentsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("title", () => {
    it("shows the Reference Environment title", async () => {
      await renderComponent();

      expect(screen.getByText("Reference Environment")).toBeTruthy();
    });
  });

  describe("environments table", () => {
    it("renders the environments table from the provided environemnts ids and project ID", async () => {
      const { fixture } = await renderComponent({
        projectId: "project-123",
        environmentIds: ["env-1", "env-2"],
        requestIds: [],
      });

      expect(
        document.querySelector("mxevolve-environments-table")
      ).toBeTruthy();
      const tableComponent = ngMocks.find(fixture, EnvironmentsTableComponent);
      expect(tableComponent.componentInstance.projectId).toBe("project-123");
      await waitFor(() =>
        expect(tableComponent.componentInstance.environmentIds).toEqual([
          "env-1",
          "env-2",
        ])
      );
    });

    it("renders the environments table from the resolved environments ids when request IDs are provided", async () => {
      mockUserRequestService.fetchUserRequestStatus = jest.fn(() =>
        of({
          environmentIds: ["env-3", "env-4"],
          latestRequestInProgress: false,
          latestRequestFailed: false,
        })
      );

      const { fixture } = await renderComponent({
        environmentIds: [],
        requestIds: ["req-1"],
      });

      expect(
        document.querySelector("mxevolve-environments-table")
      ).toBeTruthy();
      const tableComponent = ngMocks.find(fixture, EnvironmentsTableComponent);
      expect(tableComponent.componentInstance.projectId).toBe("project-123");
      await waitFor(() =>
        expect(tableComponent.componentInstance.environmentIds).toEqual([
          "env-3",
          "env-4",
        ])
      );
    });

    it("shows an error toast when fetching the request status fails", async () => {
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        throwError(() => new Error("fetch failed"))
      );
      await renderComponent({ requestIds: ["req-1"] });

      await waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Failed to fetch the reference environments."
        )
      );
    });

    it("shows an info message when the latest request is in progress", async () => {
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        of({
          environmentIds: [],
          latestRequestInProgress: true,
          latestRequestFailed: false,
        })
      );

      await renderComponent({ requestIds: ["req-1"] });

      await waitFor(() =>
        expect(
          screen.getByText(/Environment provisioning is underway/)
        ).toBeTruthy()
      );
    });

    it("shows an error message when the latest request has failed", async () => {
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        of({
          environmentIds: [],
          latestRequestInProgress: false,
          latestRequestFailed: true,
        })
      );

      await renderComponent({ requestIds: ["req-1"] });

      await waitFor(() =>
        expect(
          screen.getByText(/An error occurred during environment provisioning/)
        ).toBeTruthy()
      );
    });

    it("disables the deploy button while the request status is loading", async () => {
      const statusSubject = new Subject<UserRequestStatus>();
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        statusSubject
      );

      await renderComponent({ requestIds: ["req-1"] });

      expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();

      statusSubject.next({
        environmentIds: [],
        latestRequestInProgress: false,
        latestRequestFailed: false,
      });
      statusSubject.complete();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Deploy" })
        ).not.toBeDisabled()
      );
    });

    it("does not call the request status service when request IDs are empty", async () => {
      await renderComponent({ requestIds: [] });

      expect(
        mockUserRequestService.fetchUserRequestStatus
      ).not.toHaveBeenCalled();
    });
  });

  describe("deploy button", () => {
    it("is enabled when the process is in an active stage, and the limit has not been reached", async () => {
      await renderComponent({
        enabledInCurrentlyActiveStage: true,
        limitReached: false,
      });

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Deploy" })
        ).not.toBeDisabled()
      );
    });

    it("is disabled when the deployment is not enabled in the current stage", async () => {
      await renderComponent({ enabledInCurrentlyActiveStage: false });

      expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();
    });

    it("is disabled when the limit has been reached and clean and deploy is not allowed", async () => {
      await renderComponent({ limitReached: true, canCleanAndDeploy: false });

      expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();
    });

    it("is enabled when the limit has been reached but clean and deploy is allowed", async () => {
      await renderComponent({ limitReached: true, canCleanAndDeploy: true });

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Deploy" })
        ).not.toBeDisabled()
      );
    });

    it("deploys a reference environment when clicked and the limit has not been reached", async () => {
      const user = userEvent.setup();
      await renderComponent({ limitReached: false });

      await user.click(screen.getByRole("button", { name: "Deploy" }));

      expect(
        mockUpgradeProcessExecutionService.deployReferenceEnvironment
      ).toHaveBeenCalledWith("project-123", "process-456");
    });

    it("shows a success toast after a successful deployment", async () => {
      const user = userEvent.setup();
      await renderComponent({ limitReached: false });

      await user.click(screen.getByRole("button", { name: "Deploy" }));

      expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
        "Reference environment deployment requested successfully."
      );
    });

    it("reloads the process details after a successful deployment", async () => {
      const user = userEvent.setup();
      await renderComponent({ limitReached: false });

      await user.click(screen.getByRole("button", { name: "Deploy" }));

      expect(
        mockUpgradeProcessStateUpdaterService.reloadProcessDetails
      ).toHaveBeenCalledWith("process-456", "project-123");
    });

    it("shows an error toast when deployment fails", async () => {
      mockUpgradeProcessExecutionService.deployReferenceEnvironment.mockReturnValue(
        throwError(() => new Error("deployment failed"))
      );
      const user = userEvent.setup();
      await renderComponent({ limitReached: false });

      await user.click(screen.getByRole("button", { name: "Deploy" }));

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "deployment failed"
      );
    });

    it("shows a loading state while the deployment request is being processed", async () => {
      const deploymentRequestSubject = new Subject<undefined>();
      mockUpgradeProcessExecutionService.deployReferenceEnvironment.mockReturnValue(
        deploymentRequestSubject
      );
      const user = userEvent.setup();

      await renderComponent();

      const deployButton = screen.getByRole("button", { name: "Deploy" });

      await user.click(deployButton);

      expect(deployButton).toBeDisabled();

      deploymentRequestSubject.next(undefined);
      deploymentRequestSubject.complete();

      await waitFor(() => expect(deployButton).not.toBeDisabled());
    });

    it("removes loading state when the deployment request fails", async () => {
      mockUpgradeProcessExecutionService.deployReferenceEnvironment.mockReturnValue(
        throwError(() => new Error("deployment failed"))
      );
      const user = userEvent.setup();

      await renderComponent();

      const deployButton = screen.getByRole("button", { name: "Deploy" });

      await user.click(deployButton);

      expect(deployButton).not.toBeDisabled();
    });
  });

  describe("clean and deploy", () => {
    it("shows a confirmation dialog when the limit has been reached and Deploy is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        environmentIds: ["env-1"],
        requestIds: [],
      });

      await user.click(screen.getByRole("button", { name: "Deploy" }));

      expect(
        screen.getByText(/You have deployed the maximum number/)
      ).toBeTruthy();
    });

    it("cleans and deploys the latest environment when the user confirms", async () => {
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        of({
          environmentIds: ["env-1", "env-2"],
          latestRequestInProgress: false,
          latestRequestFailed: false,
        })
      );
      const user = userEvent.setup();
      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        requestIds: ["req-1"],
      });

      await user.click(screen.getByRole("button", { name: "Deploy" }));
      await user.click(
        screen.getByRole("button", { name: "Clean and Deploy" })
      );

      expect(
        mockUpgradeProcessExecutionService.cleanAndDeployReferenceEnvironment
      ).toHaveBeenCalledWith("project-123", "process-456", "env-2");
    });

    it("does not clean and deploy when the user cancels the confirmation", async () => {
      const user = userEvent.setup();
      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        environmentIds: ["env-1"],
        requestIds: [],
      });

      await user.click(screen.getByRole("button", { name: "Deploy" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        mockUpgradeProcessExecutionService.cleanAndDeployReferenceEnvironment
      ).not.toHaveBeenCalled();
    });

    it("shows a success toast after clean and deploy", async () => {
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        of({
          environmentIds: ["env-1"],
          latestRequestInProgress: false,
          latestRequestFailed: false,
        })
      );
      const user = userEvent.setup();
      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        requestIds: ["req-1"],
      });

      await user.click(screen.getByRole("button", { name: "Deploy" }));
      await user.click(
        screen.getByRole("button", { name: "Clean and Deploy" })
      );

      expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
        "Reference environment deployment requested successfully."
      );
    });

    it("reloads the process details after clean and deploy", async () => {
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        of({
          environmentIds: ["env-1"],
          latestRequestInProgress: false,
          latestRequestFailed: false,
        })
      );
      const user = userEvent.setup();
      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        requestIds: ["req-1"],
      });

      await user.click(screen.getByRole("button", { name: "Deploy" }));
      await user.click(
        screen.getByRole("button", { name: "Clean and Deploy" })
      );

      expect(
        mockUpgradeProcessStateUpdaterService.reloadProcessDetails
      ).toHaveBeenCalledWith("process-456", "project-123");
    });

    it("shows an error toast when clean and deploy fails", async () => {
      mockUpgradeProcessExecutionService.cleanAndDeployReferenceEnvironment.mockReturnValue(
        throwError(() => new Error("clean and deploy failed"))
      );
      mockUserRequestService.fetchUserRequestStatus.mockReturnValue(
        of({
          environmentIds: ["env-1"],
          latestRequestInProgress: false,
          latestRequestFailed: false,
        })
      );
      const user = userEvent.setup();
      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        requestIds: ["req-1"],
      });

      await user.click(screen.getByRole("button", { name: "Deploy" }));
      await user.click(
        screen.getByRole("button", { name: "Clean and Deploy" })
      );

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "clean and deploy failed"
      );
    });

    it("shows a loading state while the deployment request is being processed", async () => {
      const deploymentRequestSubject = new Subject<undefined>();
      mockUpgradeProcessExecutionService.cleanAndDeployReferenceEnvironment.mockReturnValue(
        deploymentRequestSubject
      );
      const user = userEvent.setup();

      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        environmentIds: ["env-1"],
        requestIds: [],
      });

      const deployButton = screen.getByRole("button", { name: "Deploy" });

      await user.click(deployButton);
      await user.click(
        screen.getByRole("button", { name: "Clean and Deploy" })
      );

      expect(deployButton).toBeDisabled();

      deploymentRequestSubject.next(undefined);
      deploymentRequestSubject.complete();

      await waitFor(() => expect(deployButton).not.toBeDisabled());
    });

    it("removes loading state when the deployment request fails", async () => {
      mockUpgradeProcessExecutionService.cleanAndDeployReferenceEnvironment.mockReturnValue(
        throwError(() => new Error("clean and deploy failed"))
      );
      const user = userEvent.setup();

      await renderComponent({
        limitReached: true,
        canCleanAndDeploy: true,
        environmentIds: ["env-1"],
        requestIds: [],
      });

      const deployButton = screen.getByRole("button", { name: "Deploy" });

      await user.click(deployButton);
      await user.click(
        screen.getByRole("button", { name: "Clean and Deploy" })
      );

      expect(deployButton).not.toBeDisabled();
    });
  });

  describe("tooltip", () => {
    it("shows a tooltip explaining the stage restriction when deployment is not enabled in the current stage", async () => {
      const user = userEvent.setup();
      await renderComponent({ enabledInCurrentlyActiveStage: false });

      await user.hover(screen.getByRole("button", { name: "Deploy" }));

      expect(
        screen.getByText(
          "Reference environment deployment is not allowed in the current stage of the process."
        )
      ).toBeTruthy();
    });

    it("shows a tooltip when a previous deployment is still in progress", async () => {
      const user = userEvent.setup();
      await renderComponent({ limitReached: true, canCleanAndDeploy: false });

      await user.hover(screen.getByRole("button", { name: "Deploy" }));

      expect(
        screen.getByText(
          "You cannot deploy a new reference environment while a previous one is still deploying."
        )
      ).toBeTruthy();
    });
  });
});
