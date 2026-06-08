import { render, screen, waitFor } from "@testing-library/angular";
import { PickReferenceScenarioComponent } from "./pick-reference-scenario.component";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { MockComponent, ngMocks } from "ng-mocks";
import { SingleSelectScenarioRunTableComponent } from "@mxevolve/domains/test/widget";
import {
  PickReferenceExecutionService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { userEvent } from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";

const MOCK_IMPORTS = [
  Button,
  Dialog,
  MockComponent(SingleSelectScenarioRunTableComponent),
];

const REQUIRED_INPUTS = {
  projectId: "projectId",
  processId: "processId",
  stageStatus: StageStatus.PENDING_INPUT,
};

const mockPickReferenceExecutionService = { pickReferenceExecution: jest.fn() };
const mockUpgradeProcessStateUpdaterService = {
  reloadProcessDetails: jest.fn(),
};
const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(PickReferenceScenarioComponent, {
    componentImports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      {
        provide: PickReferenceExecutionService,
        useValue: mockPickReferenceExecutionService,
      },
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

describe("PickReferenceScenarioComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickReferenceExecutionService.pickReferenceExecution.mockReturnValue(
      of(void 0)
    );
  });

  it("should be enabled when stage status is pending input", async () => {
    await renderComponent();
    expect(screen.getByRole("button", { name: /^Next Step/ })).toBeEnabled();
  });

  it("should be disabled when stage status is not pending input", async () => {
    await renderComponent({ stageStatus: StageStatus.FAILED });
    expect(screen.getByRole("button", { name: /^Next Step/ })).toBeDisabled();
  });

  it("should show the scenario run table when the dialog is opened", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    expect(
      document.querySelector("mxevolve-single-select-scenario-run-table")
    ).toBeTruthy();
  });

  it("should pass the correct inputs to the scenario run table", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      projectId: "my-project",
      processId: "my-process",
    });
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    const table = ngMocks.find(fixture, SingleSelectScenarioRunTableComponent);
    expect(table.componentInstance.projectId).toBe("my-project");
    expect(table.componentInstance.contextId).toBe("my-process");
    expect(table.componentInstance.subContextId).toBe("TECHNICAL_UPGRADE");
    expect(table.componentInstance.status).toBe("Passed");
  });

  it("should keep the confirm button disabled until a scenario run is selected", async () => {
    const user = userEvent.setup();
    await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled()
    );
  });

  it("should enable the confirm button when a scenario run is selected", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    ngMocks
      .find(fixture, SingleSelectScenarioRunTableComponent)
      .componentInstance.selectedScenarioRunId.emit("run-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
  });

  it("should show a success message and reload the process on successful submission", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    ngMocks
      .find(fixture, SingleSelectScenarioRunTableComponent)
      .componentInstance.selectedScenarioRunId.emit("run-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(mockToastMessageService.showSuccess).toHaveBeenCalled();
    expect(
      mockUpgradeProcessStateUpdaterService.reloadProcessDetails
    ).toHaveBeenCalledWith("processId", "projectId");
  });

  it("should close the dialog on successful submission", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    ngMocks
      .find(fixture, SingleSelectScenarioRunTableComponent)
      .componentInstance.selectedScenarioRunId.emit("run-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-single-select-scenario-run-table")
      ).toBeFalsy()
    );
  });

  it("should show an error message when submission fails", async () => {
    const errorMessage = "Failed to pick reference execution.";
    mockPickReferenceExecutionService.pickReferenceExecution.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    ngMocks
      .find(fixture, SingleSelectScenarioRunTableComponent)
      .componentInstance.selectedScenarioRunId.emit("run-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      errorMessage
    );
  });

  it("should keep the dialog open when submission fails", async () => {
    mockPickReferenceExecutionService.pickReferenceExecution.mockReturnValue(
      throwError(() => new Error("Error"))
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    ngMocks
      .find(fixture, SingleSelectScenarioRunTableComponent)
      .componentInstance.selectedScenarioRunId.emit("run-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-single-select-scenario-run-table")
      ).toBeTruthy()
    );
  });

  it("should disable the confirm button and show loading state while submitting", async () => {
    const subject = new Subject<void>();
    mockPickReferenceExecutionService.pickReferenceExecution.mockReturnValue(
      subject.asObservable()
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    await user.click(screen.getByRole("button", { name: /^Next Step/ }));
    ngMocks
      .find(fixture, SingleSelectScenarioRunTableComponent)
      .componentInstance.selectedScenarioRunId.emit("run-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    subject.next();
    subject.complete();
    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-single-select-scenario-run-table")
      ).toBeFalsy()
    );
  });
});
