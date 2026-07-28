import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { MockComponent } from "ng-mocks";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { Checkbox } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { Message } from "primeng/message";
import { TooltipModule } from "primeng/tooltip";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { RunScenarioComponent } from "./run-scenario.component";
import { ScenarioDefinitionDropdownComponent } from "../scenario-definition-dropdown/scenario-definition-dropdown.component";

const MOCK_IMPORTS = [
  MockComponent(ScenarioDefinitionDropdownComponent),
  MockComponent(MxevolveIconComponent),
  ButtonModule,
  Checkbox,
  DialogModule,
  FormsModule,
  Message,
  ReactiveFormsModule,
  TooltipModule,
];

const scenarioRunService = {
  isExecutionAllowed: jest.fn(),
  runScenario: jest.fn(),
};

async function renderComponent(
  inputs: {
    projectId?: string;
    branchName?: string;
    executionGroupId?: string;
    machineGroupId?: string;
    subContextId?: string;
    warningMessageMap?: Record<string, string>;
    configurationAudit?: { enabled: boolean; baselineCommit?: string };
  } = {},
  permission: {
    actionAllowed: boolean;
    rejectionReasons: string[];
    warnings: string[];
  } = { actionAllowed: true, rejectionReasons: [], warnings: [] }
) {
  scenarioRunService.isExecutionAllowed.mockReturnValue(of(permission));
  scenarioRunService.runScenario.mockReturnValue(
    of({ testExecutionId: "test-execution-1" })
  );

  return render(RunScenarioComponent, {
    inputs: {
      projectId: "project-1",
      branchName: "feature/temp-branch",
      executionGroupId: "scenario-group-001",
      ...inputs,
    },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunService, useValue: scenarioRunService },
    ],
  });
}

describe("RunScenarioComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // The Run Scenario dialog renders with [appendTo]="'body'", so its overlay
    // lives outside the testing-library container and is not removed by
    // auto-cleanup. Remove any leftover dialog overlays to avoid leaking
    // buttons across tests.
    document
      .querySelectorAll("p-dialog, .p-dialog-mask")
      .forEach((overlay) => overlay.remove());
  });

  it("renders the Select Scenario and Run Scenario controls", async () => {
    await renderComponent();

    expect(
      screen.getByText(
        /Select a Scenario that you wish to launch to validate your change/
      )
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run Scenario" })).toBeTruthy();
  });

  it("checks the execution-group can-push permission", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(scenarioRunService.isExecutionAllowed).toHaveBeenCalledWith(
        "project-1",
        "scenario-group-001"
      )
    );
  });

  it("keeps Run Scenario disabled when execution is not allowed", async () => {
    await renderComponent(
      {},
      {
        actionAllowed: false,
        rejectionReasons: ["LIMIT_REACHED"],
        warnings: [],
      }
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).toBeDisabled()
    );
  });

  it("runs the selected scenario with the configured sub-context and request flags", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      machineGroupId: "infra-group-001",
    });

    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));
    const runButtons = screen.getAllByRole("button", { name: "Run Scenario" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(scenarioRunService.runScenario).toHaveBeenCalledWith("project-1", {
      scenarioDefinitionId: "scenario-definition-1",
      subContextId: "BUILD_AND_TEST",
      branchName: "feature/temp-branch",
      commitId: null,
      executionGroupId: "scenario-group-001",
      machineGroupId: "infra-group-001",
      disableKeepExecution: true,
      stopServices: true,
      disableConfigurationEditor: false,
      supportReconActivities: false,
      validationScopeEnabled: false,
      incidentEnabled: false,
      configurationAuditing: undefined,
    });
  });

  it("given that the component renders with a configurationAudit input, then the scenario run request should include the configurationAuditing field", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      configurationAudit: { enabled: true, baselineCommit: "abc" },
    });

    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));
    const runButtons = screen.getAllByRole("button", { name: "Run Scenario" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(scenarioRunService.runScenario).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({
        configurationAuditing: { enabled: true, baselineCommit: "abc" },
      })
    );
  });

  it("runs the scenario with a custom sub-context when provided", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      subContextId: "CUSTOM_SUB_CONTEXT",
    });

    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));
    const runButtons = screen.getAllByRole("button", { name: "Run Scenario" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(scenarioRunService.runScenario).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ subContextId: "CUSTOM_SUB_CONTEXT" })
    );
  });

  it("maps permission warnings through the provided warningMessageMap", async () => {
    const { fixture } = await renderComponent(
      { warningMessageMap: { NEEDS_CLEANUP: "Cleanup is required first" } },
      { actionAllowed: true, rejectionReasons: [], warnings: ["NEEDS_CLEANUP"] }
    );

    await waitFor(() =>
      expect(fixture.componentInstance.warningMessage()).toBe(
        "Cleanup is required first"
      )
    );
  });

  it("keeps services running when the dialog checkbox is selected", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));
    await user.click(screen.getByLabelText("Keep services running"));
    const runButtons = screen.getAllByRole("button", { name: "Run Scenario" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(scenarioRunService.runScenario).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ stopServices: false })
    );
  });

  it("emits scenarioPushed after the scenario is launched", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const pushedSpy = jest.fn();

    fixture.componentInstance.scenarioPushed.subscribe(pushedSpy);
    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));
    const runButtons = screen.getAllByRole("button", { name: "Run Scenario" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(pushedSpy).toHaveBeenCalled();
  });

  it("emits errorOccurred when launching the scenario fails", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const errorSpy = jest.fn();

    scenarioRunService.runScenario.mockReturnValue(
      throwError(() => new Error("launch failed"))
    );
    fixture.componentInstance.errorOccurred.subscribe(errorSpy);
    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));
    const runButtons = screen.getAllByRole("button", { name: "Run Scenario" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(errorSpy).toHaveBeenCalledWith("launch failed");
  });

  it("does not render a Cancel button in the dialog footer", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    fixture.componentInstance.runScenarioForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Run Scenario" })
      ).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run Scenario" }));

    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Run Scenario" }).length
      ).toBe(2)
    );
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
  });
});
