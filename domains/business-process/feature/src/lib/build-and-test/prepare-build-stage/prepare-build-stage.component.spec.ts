import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import { PrepareBuildStageComponent } from "./prepare-build-stage.component";

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

async function renderComponent() {
  return render(PrepareBuildStageComponent, {
    imports: [
      MockComponent(BusinessProcessContentContainerComponent),
      MockComponent(StageContainerComponent),
      MockComponent(ScenarioRunsComponent),
    ],
    inputs: {
      projectId: "project-001",
      processId: "process-001",
      stageStatus: "active",
    },
    componentProviders: [
      {
        provide: BuildAndTestProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
    ],
  });
}

describe("PrepareBuildStageComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Prepare Setup container", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Prepare Setup")).toBeTruthy());
  });

  it("wires scenario runs with the prepare build environment context and flags", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy()
    );

    const scenarioRuns = ngMocks.find(fixture, ScenarioRunsComponent);
    expect(scenarioRuns.componentInstance.projectId).toBe("project-001");
    expect(scenarioRuns.componentInstance.contextId).toBe("process-001");
    expect(scenarioRuns.componentInstance.subContextId).toBe(
      "PREPARE_BUILD_ENVIRONMENT"
    );
    expect(scenarioRuns.componentInstance.showEnvironmentLink).toBe(false);
    expect(scenarioRuns.componentInstance.showHistory).toBe(true);
    expect(scenarioRuns.componentInstance.showHistorySummary).toBe(true);
    expect(scenarioRuns.componentInstance.showTopBarActions).toBe(false);
    expect(scenarioRuns.componentInstance.detailsExpandedByDefault).toBe(false);
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
      "process-001",
      "project-001"
    );
  });
});
