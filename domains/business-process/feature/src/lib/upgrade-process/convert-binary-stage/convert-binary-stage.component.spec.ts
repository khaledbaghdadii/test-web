import { render, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { ConvertBinaryStageComponent } from "./convert-binary-stage.component";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { PickReferenceScenarioComponent } from "@mxevolve/domains/business-process/composite-widget";

const MOCK_IMPORTS = [
  MockComponent(ScenarioRunsComponent),
  MockComponent(PickReferenceScenarioComponent),
  StageContainerComponent,
  BusinessProcessContentContainerComponent,
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  processId: "process-1",
  stageStatus: StageStatus.PENDING_INPUT,
};

const mockUpgradeProcessStateUpdaterService = {
  reloadProcessDetails: jest.fn(),
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return await render(ConvertBinaryStageComponent, {
    componentImports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      {
        provide: UpgradeProcessStateUpdaterService,
        useValue: mockUpgradeProcessStateUpdaterService,
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConvertBinaryStageComponent", () => {
  it("renders the scenario runs component", async () => {
    await renderComponent();

    expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy();
  });

  it("renders the pick reference scenario component", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-pick-reference-scenario")
    ).toBeTruthy();
  });

  it("passes the correct inputs to the scenario runs component", async () => {
    const { fixture } = await renderComponent({
      projectId: "my-project",
      processId: "my-process",
    });

    const scenarioRuns = ngMocks.find(fixture, ScenarioRunsComponent);
    expect(scenarioRuns.componentInstance.projectId).toBe("my-project");
    expect(scenarioRuns.componentInstance.contextId).toBe("my-process");
    expect(scenarioRuns.componentInstance.subContextId).toBe(
      "TECHNICAL_UPGRADE"
    );
    expect(scenarioRuns.componentInstance.showEnvironmentLink).toBe(false);
    expect(scenarioRuns.componentInstance.showHistory).toBe(true);
    expect(scenarioRuns.componentInstance.showHistorySummary).toBe(true);
  });

  it("passes the correct inputs to the pick reference scenario component", async () => {
    const { fixture } = await renderComponent({
      projectId: "my-project",
      processId: "my-process",
      stageStatus: StageStatus.PENDING_INPUT,
    });

    const pickReference = ngMocks.find(fixture, PickReferenceScenarioComponent);
    expect(pickReference.componentInstance.projectId).toBe("my-project");
    expect(pickReference.componentInstance.processId).toBe("my-process");
    expect(pickReference.componentInstance.stageStatus).toBe(
      StageStatus.PENDING_INPUT
    );
  });

  it("reloads the process details when the scenario changes", async () => {
    const { fixture } = await renderComponent({
      projectId: "my-project",
      processId: "my-process",
    });

    ngMocks
      .find(fixture, ScenarioRunsComponent)
      .componentInstance.scenarioChanged.emit();

    await waitFor(() => {
      expect(
        mockUpgradeProcessStateUpdaterService.reloadProcessDetails
      ).toHaveBeenCalledWith("my-process", "my-project");
    });
  });
});
