import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { MockComponent, ngMocks } from "ng-mocks";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { RerunScenarioButtonComponent } from "./rerun-scenario-button.component";
import { RerunDialogComponent } from "../rerun-dialog/rerun-dialog.component";

const MOCK_IMPORTS = [
  MockComponent(MxevolveIconComponent),
  MockComponent(RerunDialogComponent),
  Button,
  TooltipModule,
];

const mockScenarioRunService = {
  rerunScenarioFromFactoryProduct: jest.fn(),
  isRepushAllowed: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  scenarioRunId: "scenario-run-456",
};

async function renderComponent(
  inputs: Partial<
    typeof REQUIRED_INPUTS & {
      factoryProductId: string;
      warningMessage: string;
      executionGroupId: string;
      repushable: boolean;
      repushAllowed: boolean;
    }
  > = {}
) {
  return render(RerunScenarioButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

async function openModal() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Rerun scenario" }));
}

describe("RerunScenarioButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioRunService.rerunScenarioFromFactoryProduct.mockReturnValue(
      of({ testExecutionId: "exec-1" })
    );
  });

  it("renders the rerun button", async () => {
    await renderComponent();

    expect(screen.getByRole("button", { name: "Rerun scenario" })).toBeTruthy();
  });

  it("has a Rerun tooltip on the button", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.hover(screen.getByRole("button", { name: "Rerun scenario" }));

    await waitFor(() => {
      expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
        "Rerun"
      );
    });
  });

  it("opens the modal when the button is clicked", async () => {
    const { fixture } = await renderComponent();

    await openModal();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    expect(ngMocks.input(dialog, "visible")).toBe(true);
  });

  it("shows the warning message when provided", async () => {
    const { fixture } = await renderComponent({
      warningMessage: "This is a warning",
    });

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    expect(ngMocks.input(dialog, "warningMessage")).toBe("This is a warning");
  });

  it("does not show the warning message when not provided", async () => {
    const { fixture } = await renderComponent();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    expect(ngMocks.input(dialog, "warningMessage")).toBeUndefined();
  });

  it("shows commit ID helper text", async () => {
    const { fixture } = await renderComponent();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    expect(ngMocks.input(dialog, "projectId")).toBe("project-123");
  });

  it("disables the rerun button when no factory product is selected", async () => {
    const { fixture } = await renderComponent();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    expect(ngMocks.input(dialog, "visible")).toBe(false);
  });

  it("shows a success toast after a successful rerun", async () => {
    const { fixture } = await renderComponent();
    await openModal();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    ngMocks.output(dialog, "rerunRequested").emit({
      factoryProductId: "fp-123",
    });

    expect(mockToastService.showSuccess).toHaveBeenCalledWith(
      "Scenario rerun requested successfully."
    );
  });

  it("closes the modal after a successful rerun", async () => {
    const { fixture } = await renderComponent();
    await openModal();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    ngMocks.output(dialog, "rerunRequested").emit({
      factoryProductId: "fp-123",
    });

    await waitFor(() => {
      expect(ngMocks.input(dialog, "visible")).toBe(false);
    });
  });

  it("emits scenarioRerun on success", async () => {
    const scenarioRerunSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.scenarioRerun.subscribe(scenarioRerunSpy);
    await openModal();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    ngMocks.output(dialog, "rerunRequested").emit({
      factoryProductId: "fp-123",
    });

    expect(scenarioRerunSpy).toHaveBeenCalled();
  });

  it("shows an error toast when the rerun fails", async () => {
    mockScenarioRunService.rerunScenarioFromFactoryProduct.mockReturnValue(
      throwError(() => new Error("Server error"))
    );
    const { fixture } = await renderComponent();
    await openModal();

    const dialog = ngMocks.find(fixture, RerunDialogComponent);
    ngMocks.output(dialog, "rerunRequested").emit({
      factoryProductId: "fp-123",
    });

    expect(mockToastService.showError).toHaveBeenCalledWith(
      "Failed to rerun scenario."
    );
  });

  it("disables the button when repushable is false", async () => {
    await renderComponent({ repushable: false });

    expect(
      screen.getByRole("button", { name: "Rerun scenario" })
    ).toBeDisabled();
  });

  it("disables the button when repushAllowed is false", async () => {
    await renderComponent({ repushAllowed: false });

    expect(
      screen.getByRole("button", { name: "Rerun scenario" })
    ).toBeDisabled();
  });

  it("enables the button when both repushable and repushAllowed are true", async () => {
    await renderComponent({ repushable: true, repushAllowed: true });

    expect(
      screen.getByRole("button", { name: "Rerun scenario" })
    ).not.toBeDisabled();
  });

  describe("rejection reason tooltip", () => {
    it("shows rejection reason in tooltip when action is not allowed with LIMIT_REACHED", async () => {
      mockScenarioRunService.isRepushAllowed.mockReturnValue(
        of({
          actionAllowed: false,
          rejectionReasons: ["LIMIT_REACHED"],
          warnings: [],
        })
      );
      await renderComponent({ executionGroupId: "eg-123" });
      const user = userEvent.setup();

      await user.hover(screen.getByRole("button", { name: "Rerun scenario" }));

      await waitFor(() => {
        expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
          "Concurrent scenario executions limit has been reached"
        );
      });
    });

    it("shows default Rerun tooltip when action is allowed", async () => {
      mockScenarioRunService.isRepushAllowed.mockReturnValue(
        of({
          actionAllowed: true,
          rejectionReasons: [],
          warnings: [],
        })
      );
      await renderComponent({ executionGroupId: "eg-123" });
      const user = userEvent.setup();

      await user.hover(screen.getByRole("button", { name: "Rerun scenario" }));

      await waitFor(() => {
        expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
          "Rerun"
        );
      });
    });

    it("falls back to Rerun tooltip when rejection reasons are unknown", async () => {
      mockScenarioRunService.isRepushAllowed.mockReturnValue(
        of({
          actionAllowed: false,
          rejectionReasons: ["UNDERWAY_SCENARIO"],
          warnings: [],
        })
      );
      await renderComponent({ executionGroupId: "eg-123" });
      const user = userEvent.setup();

      await user.hover(screen.getByRole("button", { name: "Rerun scenario" }));

      await waitFor(() => {
        expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
          "Rerun"
        );
      });
    });
  });
});
