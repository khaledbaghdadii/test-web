import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
} from "@mxevolve/domains/test/data-access";
import { BuildAndTestRunTpkComponent } from "./build-and-test-run-tpk.component";

const scenarioDefinitionService = {
  getScenarioDefinitions: jest.fn(),
};

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
  } = {}
) {
  scenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
    of([
      {
        id: "scenario-definition-1",
        projectId: "project-1",
        name: "TPK 1",
        archived: false,
        tests: [],
        idempotent: false,
        nonFunctionalTest: false,
        bpcs: [],
        environmentDefinitionId: "env-definition-1",
        heaviness: "LIGHT",
      },
    ])
  );
  scenarioRunService.isExecutionAllowed.mockReturnValue(
    of({ actionAllowed: true, rejectionReasons: [], warnings: [] })
  );
  scenarioRunService.runScenario.mockReturnValue(
    of({ testExecutionId: "test-execution-1" })
  );

  return render(BuildAndTestRunTpkComponent, {
    inputs: {
      projectId: "project-1",
      branchName: "feature/temp-branch",
      executionGroupId: "scenario-group-001",
      ...inputs,
    },
    providers: [provideNoopAnimations()],
    componentProviders: [
      {
        provide: ScenarioDefinitionService,
        useValue: scenarioDefinitionService,
      },
      { provide: ScenarioRunService, useValue: scenarioRunService },
    ],
  });
}

describe("BuildAndTestRunTpkComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the migrated Select TPK and Run TPK controls", async () => {
    await renderComponent();

    expect(
      screen.getByText(
        /Select a TPK that you wish to launch to validate your change/
      )
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run TPK" })).toBeTruthy();
    await waitFor(() =>
      expect(
        scenarioDefinitionService.getScenarioDefinitions
      ).toHaveBeenCalledWith("project-1")
    );
  });

  it("checks the legacy execution-group can-push permission", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(scenarioRunService.isExecutionAllowed).toHaveBeenCalledWith(
        "project-1",
        "scenario-group-001"
      )
    );
  });

  it("keeps Run TPK disabled when execution is not allowed", async () => {
    scenarioRunService.isExecutionAllowed.mockReturnValue(
      of({
        actionAllowed: false,
        rejectionReasons: ["LIMIT_REACHED"],
        warnings: [],
      })
    );

    await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run TPK" })).toBeDisabled()
    );
  });

  it("runs the selected TPK with the legacy Build and Test request flags", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      machineGroupId: "infra-group-001",
    });

    fixture.componentInstance.runTpkForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run TPK" })).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run TPK" }));
    const runButtons = screen.getAllByRole("button", { name: "Run TPK" });
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
    });
  });

  it("keeps services running when the dialog checkbox is selected", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    fixture.componentInstance.runTpkForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run TPK" })).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run TPK" }));
    await user.click(screen.getByLabelText("Keep services running"));
    const runButtons = screen.getAllByRole("button", { name: "Run TPK" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(scenarioRunService.runScenario).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ stopServices: false })
    );
  });

  it("emits scenarioPushed after the TPK is launched", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const pushedSpy = jest.fn();

    fixture.componentInstance.scenarioPushed.subscribe(pushedSpy);
    fixture.componentInstance.runTpkForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run TPK" })).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run TPK" }));
    const runButtons = screen.getAllByRole("button", { name: "Run TPK" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(pushedSpy).toHaveBeenCalled();
  });

  it("emits errorOccurred when launching the TPK fails", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const errorSpy = jest.fn();

    scenarioRunService.runScenario.mockReturnValue(
      throwError(() => new Error("launch failed"))
    );
    fixture.componentInstance.errorOccurred.subscribe(errorSpy);
    fixture.componentInstance.runTpkForm.controls.scenarioDefinitionId.setValue(
      "scenario-definition-1"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run TPK" })).not.toBeDisabled()
    );
    await user.click(screen.getByRole("button", { name: "Run TPK" }));
    const runButtons = screen.getAllByRole("button", { name: "Run TPK" });
    await user.click(runButtons[runButtons.length - 1]);

    expect(errorSpy).toHaveBeenCalledWith("launch failed");
  });
});
