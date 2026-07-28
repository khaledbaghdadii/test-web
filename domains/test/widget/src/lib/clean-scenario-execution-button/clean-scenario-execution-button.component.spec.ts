import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";
import { Button } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
import { MockComponent } from "ng-mocks";
import {
  ScenarioRunService,
  TestManagementAnalyticsTrackerService,
} from "@mxevolve/domains/test/data-access";
import { ScenarioExecutionHousekeepingStatus } from "@mxevolve/domains/test/model";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { CleanScenarioExecutionButtonComponent } from "./clean-scenario-execution-button.component";

const MOCK_IMPORTS = [
  Button,
  ConfirmDialogModule,
  TooltipModule,
  MockComponent(MxevolveIconComponent),
];

const mockScenarioRunService = {
  housekeepScenarioExecution: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const mockAnalyticsTrackerService = {
  trackCleanScenarioExecution: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  scenarioExecution: {
    id: "scenario-run-456",
    cleaningStatus: ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED,
    isFinished: true,
  },
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  const merged = { ...REQUIRED_INPUTS, ...inputs };

  return render(CleanScenarioExecutionButtonComponent, {
    inputs: {
      projectId: merged.projectId,
      scenarioExecution: merged.scenarioExecution,
    },
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

async function clickCleanAndConfirm() {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Clean scenario run" }));
  await user.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("CleanScenarioExecutionButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioRunService.housekeepScenarioExecution.mockReturnValue(
      of(undefined)
    );
  });

  it("renders the clean button", async () => {
    await renderComponent();

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).toBeTruthy();
  });

  it("has a Clean tooltip on the button", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.hover(
      screen.getByRole("button", { name: "Clean scenario run" })
    );

    await waitFor(() => {
      expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
        "Clean"
      );
    });
  });

  it("is disabled when the scenario is not finished", async () => {
    await renderComponent({
      scenarioExecution: {
        ...REQUIRED_INPUTS.scenarioExecution,
        isFinished: false,
      },
    });

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).toBeDisabled();
  });

  it("is enabled when the scenario is finished and cleaning is not yet launched", async () => {
    await renderComponent({
      scenarioExecution: {
        ...REQUIRED_INPUTS.scenarioExecution,
        isFinished: true,
        cleaningStatus: ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED,
      },
    });

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).not.toBeDisabled();
  });

  it("is enabled when the scenario is finished and cleaning failed previously", async () => {
    await renderComponent({
      scenarioExecution: {
        ...REQUIRED_INPUTS.scenarioExecution,
        isFinished: true,
        cleaningStatus: ScenarioExecutionHousekeepingStatus.FAILED,
      },
    });

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).not.toBeDisabled();
  });

  it("is disabled when the scenario is finished but cleaning is still in progress", async () => {
    await renderComponent({
      scenarioExecution: {
        ...REQUIRED_INPUTS.scenarioExecution,
        isFinished: true,
        cleaningStatus: ScenarioExecutionHousekeepingStatus.UNDERWAY,
      },
    });

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).toBeDisabled();
  });

  it("is disabled when the scenario is finished but cleaning already passed", async () => {
    await renderComponent({
      scenarioExecution: {
        ...REQUIRED_INPUTS.scenarioExecution,
        isFinished: true,
        cleaningStatus: ScenarioExecutionHousekeepingStatus.PASSED,
      },
    });

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).toBeDisabled();
  });

  it("is disabled when the scenario is finished but cleaning is scheduled", async () => {
    await renderComponent({
      scenarioExecution: {
        ...REQUIRED_INPUTS.scenarioExecution,
        isFinished: true,
        cleaningStatus:
          ScenarioExecutionHousekeepingStatus.SCHEDULED_FOR_CLEANING,
      },
    });

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).toBeDisabled();
  });

  it("opens the confirmation dialog when the button is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Clean scenario run" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Are you sure you want to clean this run?")
      ).toBeTruthy();
    });
  });

  it("shows a success toast after a successful clean", async () => {
    await renderComponent();

    await clickCleanAndConfirm();

    expect(mockToastService.showSuccess).toHaveBeenCalledWith(
      "Scenario cleanup requested successfully."
    );
  });

  it("calls the housekeeping service with the correct project and scenario execution id", async () => {
    await renderComponent();

    await clickCleanAndConfirm();

    expect(
      mockScenarioRunService.housekeepScenarioExecution
    ).toHaveBeenCalledWith(
      REQUIRED_INPUTS.projectId,
      REQUIRED_INPUTS.scenarioExecution.id
    );
  });

  it("tracks clean scenario run when cleanup is confirmed", async () => {
    await renderComponent();

    await clickCleanAndConfirm();

    expect(
      mockAnalyticsTrackerService.trackCleanScenarioExecution
    ).toHaveBeenCalledTimes(1);
  });

  it("should hide the confirmation popup once confirm is clicked", async () => {
    await renderComponent();

    await clickCleanAndConfirm();

    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to clean this run?")
      ).toBeNull();
    });
  });

  it("should hide the confirmation popup once cancel is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Clean scenario run" })
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to clean this run?")
      ).toBeNull();
    });
  });

  it("emits that the scenario cleaning was triggered after a successful clean", async () => {
    const cleaned = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.scenarioCleaned.subscribe(cleaned);

    await clickCleanAndConfirm();

    expect(cleaned).toHaveBeenCalled();
  });

  it("does not clean when the user clicks Cancel", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Clean scenario run" })
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockToastService.showError).not.toHaveBeenCalled();
  });

  it("shows an error toast when the clean fails", async () => {
    mockScenarioRunService.housekeepScenarioExecution.mockReturnValue(
      throwError(() => new Error("network error"))
    );
    await renderComponent();

    await clickCleanAndConfirm();

    expect(mockToastService.showError).toHaveBeenCalledWith(
      "Failed to clean scenario run."
    );
  });

  it("shows a loading state while the clean request is in progress", async () => {
    const abortSubject = new Subject<void>();
    mockScenarioRunService.housekeepScenarioExecution.mockReturnValue(
      abortSubject
    );

    await renderComponent();

    await clickCleanAndConfirm();

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).toBeDisabled();

    abortSubject.next();
    abortSubject.complete();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Clean scenario run" })
      ).not.toBeDisabled()
    );
  });

  it("removes the loading state after a failed clean", async () => {
    mockScenarioRunService.housekeepScenarioExecution.mockReturnValue(
      throwError(() => new Error("network error"))
    );
    await renderComponent();

    await clickCleanAndConfirm();

    expect(
      screen.getByRole("button", { name: "Clean scenario run" })
    ).not.toBeDisabled();
  });
});
