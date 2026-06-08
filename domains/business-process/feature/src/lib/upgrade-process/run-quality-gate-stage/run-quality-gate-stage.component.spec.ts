import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { RunQualityGateStageComponent } from "./run-quality-gate-stage.component";
import { ProceedFromQualityGateWizardComponent } from "@mxevolve/domains/business-process/composite-widget";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  QualityGateValidationDecision,
  QualityGateValidationResult,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  ScenarioRunsComponent,
  ScenarioRunsSummaryComponent,
} from "@mxevolve/domains/test/widget";
import type { SummaryFilterEvent } from "@mxevolve/domains/test/widget";
import {
  ScenarioExecution,
  ScenarioExecutionService,
} from "@mxflow/test-management";
import { of, Subject, throwError } from "rxjs";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(ProceedFromQualityGateWizardComponent),
  MockComponent(ScenarioRunsComponent),
  MockComponent(ScenarioRunsSummaryComponent),
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
];

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const mockScenarioExecutionService = {
  getScenarioExecution: jest.fn().mockReturnValue(
    of({
      mxVersion: "9.24.0",
    } as Partial<ScenarioExecution>)
  ),
};

const REQUIRED_INPUTS = {
  projectId: "project-1",
  processId: "process-42",
  processName: "Upgrade Process",
  developmentId: "dev-7",
  stageStatus: StageStatus.RUNNING,
  supportsResourceManagement: true,
  parentBranchName: "main",
  validationResult: undefined as QualityGateValidationResult | undefined,
  referenceScenarioExecutionId: "scenario-exec-1",
  keptResourcesDecisionMade: true,
};

async function renderComponent(
  overrides: Partial<typeof REQUIRED_INPUTS> = {}
) {
  return render(RunQualityGateStageComponent, {
    inputs: { ...REQUIRED_INPUTS, ...overrides },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: UpgradeProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      {
        provide: ScenarioExecutionService,
        useValue: mockScenarioExecutionService,
      },
      {
        provide: ToastMessageService,
        useValue: mockToastMessageService,
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RunQualityGateStageComponent", () => {
  describe("scenario runs summary", () => {
    it("renders the scenario runs summary with the correct inputs", async () => {
      const { fixture } = await renderComponent();

      expect(
        document.querySelector("mxevolve-scenario-runs-summary")
      ).toBeTruthy();
      const summary = ngMocks.find(fixture, ScenarioRunsSummaryComponent);
      expect(ngMocks.input(summary, "contextId")).toBe("process-42");
      expect(ngMocks.input(summary, "projectId")).toBe("project-1");
      expect(ngMocks.input(summary, "bpExecutionName")).toBe("Upgrade Process");
      expect(ngMocks.input(summary, "subContextId")).toBe(
        "REGRESSION_TEST_PACKAGE"
      );
    });
  });

  describe("scenario runs", () => {
    it("renders the scenario runs with the correct inputs", async () => {
      const { fixture } = await renderComponent();

      expect(document.querySelector("mxevolve-scenario-runs")).toBeTruthy();
      const runs = ngMocks.find(fixture, ScenarioRunsComponent);
      expect(ngMocks.input(runs, "projectId")).toBe("project-1");
      expect(ngMocks.input(runs, "contextId")).toBe("process-42");
      expect(ngMocks.input(runs, "subContextId")).toBe(
        "REGRESSION_TEST_PACKAGE"
      );
      expect(ngMocks.input(runs, "showEnvironmentDetails")).toBe(false);
      expect(ngMocks.input(runs, "showEnvironmentLink")).toBe(true);
      expect(ngMocks.input(runs, "showHistory")).toBe(false);
      expect(ngMocks.input(runs, "detailsExpandedByDefault")).toBe(false);
      expect(ngMocks.input(runs, "showBulkRerun")).toBe(true);
    });

    it("passes no active filter to scenario runs by default", async () => {
      const { fixture } = await renderComponent();

      const runs = ngMocks.find(fixture, ScenarioRunsComponent);
      expect(ngMocks.input(runs, "filter")).toBeUndefined();
    });
  });

  describe("proceed from quality gate wizard", () => {
    it("renders the wizard with the correct inputs", async () => {
      const validationResult: QualityGateValidationResult = {
        decision: QualityGateValidationDecision.VALIDATION_PASSED,
        requester: "user-1",
        comment: "looks good",
      };
      const { fixture } = await renderComponent({
        validationResult,
        stageStatus: StageStatus.PENDING_INPUT,
      });

      expect(
        document.querySelector("mxevolve-proceed-from-quality-gate-wizard")
      ).toBeTruthy();
      const wizard = ngMocks.find(
        fixture,
        ProceedFromQualityGateWizardComponent
      );
      expect(ngMocks.input(wizard, "processId")).toBe("process-42");
      expect(ngMocks.input(wizard, "projectId")).toBe("project-1");
      expect(ngMocks.input(wizard, "developmentId")).toBe("dev-7");
      expect(ngMocks.input(wizard, "supportsResourceManagement")).toBe(true);
      expect(ngMocks.input(wizard, "parentBranchName")).toBe("main");
      expect(ngMocks.input(wizard, "stageStatus")).toBe(
        StageStatus.PENDING_INPUT
      );
      expect(ngMocks.input(wizard, "validationResult")).toBe(validationResult);
      expect(ngMocks.input(wizard, "keptResourcesDecisionMade")).toBe(true);
    });

    it("passes undefined validation result to the wizard when none is provided", async () => {
      const { fixture } = await renderComponent({
        validationResult: undefined,
      });

      const wizard = ngMocks.find(
        fixture,
        ProceedFromQualityGateWizardComponent
      );
      expect(ngMocks.input(wizard, "validationResult")).toBeUndefined();
    });
  });

  describe("filter propagation", () => {
    it("filters the scenario runs when the user selects a filter in the summary", async () => {
      const { fixture } = await renderComponent();
      const filter: SummaryFilterEvent = {
        type: "analysisStatus",
        value: "FAILED",
        label: "1 FAILED",
      };

      ngMocks
        .find(fixture, ScenarioRunsSummaryComponent)
        .componentInstance.filterClicked.emit(filter);

      await waitFor(() => {
        expect(
          ngMocks.input(ngMocks.find(fixture, ScenarioRunsComponent), "filter")
        ).toEqual(filter);
      });
    });

    it("removes the filter from the scenario runs when the user dismisses the summary filter", async () => {
      const { fixture } = await renderComponent();
      const filter: SummaryFilterEvent = {
        type: "analysisStatus",
        value: "FAILED",
        label: "1 FAILED",
      };

      ngMocks
        .find(fixture, ScenarioRunsSummaryComponent)
        .componentInstance.filterClicked.emit(filter);
      await waitFor(() => {
        expect(
          ngMocks.input(ngMocks.find(fixture, ScenarioRunsComponent), "filter")
        ).toEqual(filter);
      });

      ngMocks
        .find(fixture, ScenarioRunsSummaryComponent)
        .componentInstance.filterClicked.emit(null);

      await waitFor(() => {
        expect(
          ngMocks.input(ngMocks.find(fixture, ScenarioRunsComponent), "filter")
        ).toBeUndefined();
      });
    });
  });

  describe("reference scenario execution mxVersion", () => {
    it("displays the mxVersion when the reference scenario execution is loaded", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of({ mxVersion: "9.24.0" } as Partial<ScenarioExecution>)
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const scenarioRuns = ngMocks.find(fixture, ScenarioRunsComponent);
        ngMocks.render(
          scenarioRuns.componentInstance,
          ngMocks.findTemplateRef(scenarioRuns, "topBar")
        );
      });

      await waitFor(() => {
        expect(screen.getByText("9.24.0")).toBeTruthy();
      });
    });

    it("does not display the mxVersion message before the reference scenario execution is loaded", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        new Subject()
      );

      const { fixture } = await renderComponent();

      const scenarioRuns = ngMocks.find(fixture, ScenarioRunsComponent);
      ngMocks.render(
        scenarioRuns.componentInstance,
        ngMocks.findTemplateRef(scenarioRuns, "topBar")
      );

      expect(screen.queryByText(/executed under MX Version/i)).toBeFalsy();
    });

    it("shows a toast message when a failure occurs when fetching the reference scenario execution", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      waitFor(() =>
        expect(mockToastMessageService.showError).toHaveBeenCalled()
      );
    });
  });

  describe("process reload", () => {
    it("reloads the process execution when a scenario changes", async () => {
      const { fixture } = await renderComponent();

      ngMocks
        .find(fixture, ScenarioRunsComponent)
        .componentInstance.scenarioChanged.emit();

      await waitFor(() => {
        expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
          "process-42",
          "project-1"
        );
      });
    });
  });
});
