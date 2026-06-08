import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";
import { Button } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
import { MockComponent } from "ng-mocks";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { AbortScenarioRunButtonComponent } from "./abort-scenario-run-button.component";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

const MOCK_IMPORTS = [
  Button,
  ConfirmDialogModule,
  TooltipModule,
  MockComponent(MxevolveIconComponent),
];

const mockScenarioRunService = {
  abortScenarioRun: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const mockAnalyticsTrackerService = {
  trackAbortExecution: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  scenarioRunId: "scenario-run-456",
  scenarioRunName: "my-scenario-run",
  scenarioRunStatus: ScenarioRunStatus.UNDERWAY,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(AbortScenarioRunButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
      { provide: ConfirmationService, useValue: new ConfirmationService() },
      {
        provide: TestManagementAnalyticsTrackerService,
        useValue: mockAnalyticsTrackerService,
      },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

describe("AbortScenarioRunButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioRunService.abortScenarioRun.mockReturnValue(of(undefined));
  });

  describe("abort button", () => {
    it("renders the abort button", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeTruthy();
    });

    it("has an Abort tooltip on the button", async () => {
      await renderComponent();
      const user = userEvent.setup();

      await user.hover(
        screen.getByRole("button", { name: "Abort scenario run" })
      );

      await waitFor(() => {
        expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
          "Abort"
        );
      });
    });

    it("is enabled when the status is UNDERWAY", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.UNDERWAY });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).not.toBeDisabled();
    });

    it("is disabled when the status is PASSED", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.PASSED });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });

    it("is disabled when the status is FAILED", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.FAILED });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });

    it("is disabled when the status is ABORTING", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.ABORTING });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });

    it("is disabled when the status is ABORTED", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.ABORTED });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });

    it("is disabled when the status is FAILED_TO_ABORT", async () => {
      await renderComponent({
        scenarioRunStatus: ScenarioRunStatus.FAILED_TO_ABORT,
      });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });

    it("is disabled when the status is READY", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.READY });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });

    it("is disabled when the status is NA", async () => {
      await renderComponent({ scenarioRunStatus: ScenarioRunStatus.NA });

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();
    });
  });

  describe("confirmation dialog", () => {
    it("opens the confirmation dialog when the button is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );

      expect(screen.getByText(/Are you sure you want to abort/)).toBeTruthy();
    });

    it("shows the scenario run name in the confirmation message", async () => {
      const user = userEvent.setup();
      await renderComponent({ scenarioRunName: "my-scenario-run" });

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );

      expect(screen.getByText("my-scenario-run")).toBeTruthy();
    });
  });

  describe("aborting the scenario run", () => {
    it("shows a success toast after a successful abort", async () => {
      const user = userEvent.setup();
      await renderComponent({ scenarioRunName: "my-scenario-run" });

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Scenario run my-scenario-run abort requested successfully."
      );
    });

    it("does not abort when the user clicks Cancel", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockToastService.showSuccess).not.toHaveBeenCalled();
      expect(mockToastService.showError).not.toHaveBeenCalled();
    });

    it("tracks abort execution when the scenario run is aborted", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(
        mockAnalyticsTrackerService.trackAbortExecution
      ).toHaveBeenCalled();
    });

    it("shows an error toast when the abort fails", async () => {
      mockScenarioRunService.abortScenarioRun.mockReturnValue(
        throwError(() => new Error("network error"))
      );
      const user = userEvent.setup();
      await renderComponent({ scenarioRunName: "my-scenario-run" });

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "Failed to abort scenario run my-scenario-run."
      );
    });

    it("shows a loading state while the abort request is in progress", async () => {
      const abortSubject = new Subject<void>();
      mockScenarioRunService.abortScenarioRun.mockReturnValue(abortSubject);
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).toBeDisabled();

      abortSubject.next();
      abortSubject.complete();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Abort scenario run" })
        ).not.toBeDisabled()
      );
    });

    it("removes the loading state after a failed abort", async () => {
      mockScenarioRunService.abortScenarioRun.mockReturnValue(
        throwError(() => new Error("network error"))
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort scenario run" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(
        screen.getByRole("button", { name: "Abort scenario run" })
      ).not.toBeDisabled();
    });
  });
});
