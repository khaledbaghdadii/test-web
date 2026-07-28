import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { BuildAndTestTestSectionComponent } from "./build-and-test-test-section.component";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  RunScenarioComponent,
  ScenarioRunsComponent,
  SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE,
} from "@mxevolve/domains/test/widget";
import { Development } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(ScenarioRunsComponent),
  MockComponent(RunScenarioComponent),
];

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const DEVELOPMENT: Development = {
  id: "development-1",
  name: "feature/temp-branch",
  source: "main",
  projectId: "proj-001",
  repository: { id: "repo-1", url: "https://git.example/repo.git" },
  latestCommitId: "head-commit",
  createdOn: "2026-01-01T00:00:00Z",
  parentCommitId: "parent-commit",
  deleted: false,
};

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    processId: string;
    development: Development;
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

  it("renders the Test panel header and the Test Results heading", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Test")).toBeTruthy());
    expect(screen.getByText("Test Results")).toBeTruthy();
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
    expect(scenarioRuns.componentInstance.hideEnvironmentPanelWhenCleaned).toBe(
      true
    );
    expect(scenarioRuns.componentInstance.enableKeepServices).toBe(true);
    expect(scenarioRuns.componentInstance.showOpenConfigEditorAction).toBe(
      true
    );
    expect(scenarioRuns.componentInstance.showHistory).toBe(false);
    expect(scenarioRuns.componentInstance.showHistorySummary).toBe(true);
    expect(scenarioRuns.componentInstance.sortPanelsByStartDateDesc).toBe(true);
    expect(
      scenarioRuns.componentInstance.showEnvironmentDetailsOnlyWhenExpanded
    ).toBe(true);
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

  describe("run scenario row", () => {
    it("renders the run scenario row when development and execution group are available", async () => {
      await renderComponent({
        development: DEVELOPMENT,
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() =>
        expect(document.querySelector("mxevolve-run-scenario")).toBeTruthy()
      );
    });

    it("passes legacy run scenario inputs to the run scenario wrapper", async () => {
      const { fixture } = await renderComponent({
        development: DEVELOPMENT,
        executionGroupId: "scenario-group-001",
        machineGroupId: "infra-group-001",
      });

      await waitFor(() =>
        expect(document.querySelector("mxevolve-run-scenario")).toBeTruthy()
      );

      const runScenario = ngMocks.find(fixture, RunScenarioComponent);
      expect(ngMocks.input(runScenario, "projectId")).toBe("proj-001");
      expect(ngMocks.input(runScenario, "branchName")).toBe(DEVELOPMENT.name);
      expect(ngMocks.input(runScenario, "executionGroupId")).toBe(
        "scenario-group-001"
      );
      expect(ngMocks.input(runScenario, "machineGroupId")).toBe(
        "infra-group-001"
      );
      expect(ngMocks.input(runScenario, "warningMessageMap")).toEqual(
        SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE
      );
    });

    it("reloads the execution when a scenario is pushed", async () => {
      const { fixture } = await renderComponent({
        development: DEVELOPMENT,
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() =>
        expect(document.querySelector("mxevolve-run-scenario")).toBeTruthy()
      );

      ngMocks
        .find(fixture, RunScenarioComponent)
        .componentInstance.scenarioPushed.emit();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        "proc-001",
        "proj-001"
      );
    });

    it("shows the error from the run scenario row as a toast", async () => {
      const { fixture } = await renderComponent({
        development: DEVELOPMENT,
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() =>
        expect(document.querySelector("mxevolve-run-scenario")).toBeTruthy()
      );

      ngMocks
        .find(fixture, RunScenarioComponent)
        .componentInstance.errorOccurred.emit("run failed");

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "run failed"
      );
    });

    it("given development related info is not resolved yet, then the run scenario capability should not be shown to the user", async () => {
      await renderComponent({ executionGroupId: "scenario-group-001" });

      await waitFor(() =>
        expect(screen.getByText("Test Results")).toBeTruthy()
      );
      expect(document.querySelector("mxevolve-run-scenario")).toBeNull();
    });

    it("when the scenario execution group is not yet available, then the run scenario capability should not be shown to the user", async () => {
      await renderComponent({ development: DEVELOPMENT });

      await waitFor(() =>
        expect(screen.getByText("Test Results")).toBeTruthy()
      );
      expect(document.querySelector("mxevolve-run-scenario")).toBeNull();
    });

    it("when development related info and execution group are both available, then the run scenario capability is shown to the user", async () => {
      const { fixture } = await renderComponent({
        development: DEVELOPMENT,
        executionGroupId: "scenario-group-001",
        machineGroupId: "infra-group-001",
      });

      await waitFor(() =>
        expect(document.querySelector("mxevolve-run-scenario")).toBeTruthy()
      );

      const runScenario = ngMocks.find(fixture, RunScenarioComponent);
      expect(ngMocks.input(runScenario, "projectId")).toBe("proj-001");
      expect(ngMocks.input(runScenario, "branchName")).toBe(DEVELOPMENT.name);
      expect(ngMocks.input(runScenario, "executionGroupId")).toBe(
        "scenario-group-001"
      );
      expect(ngMocks.input(runScenario, "machineGroupId")).toBe(
        "infra-group-001"
      );
      expect(ngMocks.input(runScenario, "configurationAudit")).toStrictEqual({
        enabled: true,
        baselineCommit: DEVELOPMENT.parentCommitId,
      });
    });

    it("given the rest of the pre-requisite info to run a scenario are present, when the parent commit id gets resolved to an empty value for some reason, then the run scenario capability is still shown to the user but with linting disabled", async () => {
      const developmentWithoutCommit = {
        ...DEVELOPMENT,
        parentCommitId: undefined,
      } as unknown as Development;

      const { fixture } = await renderComponent({
        development: developmentWithoutCommit,
        executionGroupId: "scenario-group-001",
      });

      await waitFor(() => {
        expect(document.querySelector("mxevolve-run-scenario")).toBeTruthy();
      });

      const runScenario = ngMocks.find(fixture, RunScenarioComponent);
      expect(ngMocks.input(runScenario, "configurationAudit")).toStrictEqual({
        enabled: false,
      });
    });
  });
});
