import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { BuildAndTestTestSectionComponent } from "./build-and-test-test-section.component";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import {
  ConfigAuditButtonComponent,
  EnvironmentStatusPanelComponent,
} from "@mxevolve/domains/environment/widget";
import { SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE } from "../scenario-execution-group-permission-warning-message";
import { BuildAndTestRunTpkComponent } from "./build-and-test-run-tpk.component";
import { ToastMessageService } from "@mxflow/ui/alert";

const MOCK_IMPORTS = [
  MockComponent(ScenarioRunsComponent),
  MockComponent(ConfigAuditButtonComponent),
  MockComponent(EnvironmentStatusPanelComponent),
  MockComponent(BuildAndTestRunTpkComponent),
];

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    processId: string;
    environmentId: string;
    branchName: string;
    executionGroupId: string;
    machineGroupId: string;
  }> = {}
) {
  return render(BuildAndTestTestSectionComponent, {
    imports: MOCK_IMPORTS,
    inputs: { projectId: "proj-001", processId: "proc-001", ...inputs },
    componentProviders: [
      {
        provide: BuildAndTestProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      {
        provide: ToastMessageService,
        useValue: mockToastMessageService,
      },
    ],
  });
}

describe("BuildAndTestTestSectionComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Test panel header and the TPK Results heading", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Test")).toBeTruthy());
    expect(screen.getByText("TPK Results")).toBeTruthy();
  });

  it("wires the scenario-runs widget with the build-and-test context and warning map", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy()
    );

    const scenarioRuns = ngMocks.find(fixture, ScenarioRunsComponent);
    expect(scenarioRuns.componentInstance.projectId).toBe("proj-001");
    expect(scenarioRuns.componentInstance.contextId).toBe("proc-001");
    expect(scenarioRuns.componentInstance.subContextId).toBe("BUILD_AND_TEST");
    expect(scenarioRuns.componentInstance.warningMessageMap).toEqual(
      SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE
    );
  });

  it("reloads the execution when a scenario changes", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy()
    );

    ngMocks
      .find(fixture, ScenarioRunsComponent)
      .componentInstance.scenarioChanged.emit();

    expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      "proc-001",
      "proj-001"
    );
  });

  describe("run TPK row", () => {
    it("renders the run TPK row when branch name and execution group are available", async () => {
      await renderComponent({
        branchName: "feature/temp-branch",
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-run-tpk")
        ).toBeTruthy()
      );
    });

    it("passes legacy run scenario inputs to the run TPK wrapper", async () => {
      const { fixture } = await renderComponent({
        branchName: "feature/temp-branch",
        executionGroupId: "scenario-group-001",
        machineGroupId: "infra-group-001",
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-run-tpk")
        ).toBeTruthy()
      );

      const runTpk = ngMocks.find(fixture, BuildAndTestRunTpkComponent);
      expect(runTpk.componentInstance.branchName).toBe("feature/temp-branch");
      expect(runTpk.componentInstance.executionGroupId).toBe(
        "scenario-group-001"
      );
      expect(runTpk.componentInstance.machineGroupId).toBe("infra-group-001");
    });

    it("hides the run TPK row until both branch name and execution group are available", async () => {
      await renderComponent({ branchName: "feature/temp-branch" });

      await waitFor(() => expect(screen.getByText("TPK Results")).toBeTruthy());
      expect(
        document.querySelector("mxevolve-build-and-test-run-tpk")
      ).toBeNull();
    });

    it("reloads the execution when a TPK is pushed", async () => {
      const { fixture } = await renderComponent({
        branchName: "feature/temp-branch",
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-run-tpk")
        ).toBeTruthy()
      );

      ngMocks
        .find(fixture, BuildAndTestRunTpkComponent)
        .componentInstance.scenarioPushed.emit();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        "proc-001",
        "proj-001"
      );
    });

    it("shows the error from the run TPK row", async () => {
      const { fixture } = await renderComponent({
        branchName: "feature/temp-branch",
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-run-tpk")
        ).toBeTruthy()
      );

      ngMocks
        .find(fixture, BuildAndTestRunTpkComponent)
        .componentInstance.errorOccurred.emit("run failed");

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "run failed"
      );
    });
  });

  describe("environment bar", () => {
    it("does not render the environment status panel when no environment id is provided", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Test")).toBeTruthy());
      expect(
        document.querySelector("mxevolve-environment-status-panel")
      ).toBeNull();
    });

    it("renders the environment status panel with the Config Audit action when an environment id is provided", async () => {
      await renderComponent({ environmentId: "env-001" });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-status-panel")
        ).toBeTruthy()
      );
      expect(
        document.querySelector("mxevolve-config-audit-button")
      ).toBeTruthy();
    });
  });
});
