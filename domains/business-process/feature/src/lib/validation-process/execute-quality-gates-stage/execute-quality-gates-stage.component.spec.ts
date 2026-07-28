import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";
import { MockComponent, MockDirective, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { ValidationProcessExecuteQualityGatesStageComponent } from "./execute-quality-gates-stage.component";
import type { ValidationProcessExecuteQualityGateStage } from "@mxevolve/domains/business-process/data-access";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessContentContainerComponent,
  QualityGateValidationBannerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  ScenarioRunsComponent,
  ScenarioRunsSummaryComponent,
} from "@mxevolve/domains/test/widget";
import { FormsModule } from "@angular/forms";
import { Message } from "primeng/message";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Textarea } from "primeng/textarea";
import { Checkbox } from "primeng/checkbox";
import { RadioButton } from "primeng/radiobutton";
import { Chip } from "primeng/chip";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";

const MOCK_IMPORTS = [
  StageContainerComponent,
  BusinessProcessContentContainerComponent,
  QualityGateValidationBannerComponent,
  Message,
  Button,
  FormsModule,
  Dialog,
  Textarea,
  Checkbox,
  RadioButton,
  MockComponent(ScenarioRunsComponent),
  MockComponent(ScenarioRunsSummaryComponent),
  Chip,
  MockDirective(ShowElementIfAuthorizedDirective),
];

const mockStateUpdater = {
  markQualityGatePassed: jest.fn().mockReturnValue(of(undefined)),
  markQualityGateFailed: jest.fn().mockReturnValue(of(undefined)),
  reloadProcessDetails: jest.fn(),
};

function buildStage(
  status: ValidationProcessStageStatus = ValidationProcessStageStatus.PENDING_INPUT,
  overrides: Partial<ValidationProcessExecuteQualityGateStage> = {}
): ValidationProcessExecuteQualityGateStage {
  return {
    name: "Execute Quality Gates",
    status,
    validationResult: null,
    startDate: "",
    endDate: "",
    errorMessage: "",
    route: "execute-quality-gates",
    ...overrides,
  } as ValidationProcessExecuteQualityGateStage;
}

async function renderStage(
  stage: ValidationProcessExecuteQualityGateStage,
  inputs?: {
    projectId?: string;
    processId?: string;
    processName?: string;
    developmentId?: string;
    branch?: string;
  }
) {
  return render(ValidationProcessExecuteQualityGatesStageComponent, {
    inputs: {
      stage,
      projectId: inputs?.projectId ?? "project-1",
      processId: inputs?.processId ?? "execution-1",
      processName: inputs?.processName ?? "MV Run",
      developmentId: inputs?.developmentId ?? "dev-1",
      branch: inputs?.branch ?? "feature/branch-1",
    },
    componentImports: MOCK_IMPORTS,
    providers: [
      {
        provide: ValidationProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
    ],
  });
}

describe("ValidationProcessExecuteQualityGatesStageComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateUpdater.markQualityGatePassed.mockReturnValue(of(undefined));
    mockStateUpdater.markQualityGateFailed.mockReturnValue(of(undefined));
  });

  describe("rerun defaults", () => {
    it("defaults the scenario runs rerun mode to official", async () => {
      const { fixture } = await renderStage(buildStage());

      const scenarioRuns = ngMocks.find(fixture, ScenarioRunsComponent);
      expect(ngMocks.input(scenarioRuns, "defaultRerunMode")).toBe("official");
    });
  });

  describe("button availability", () => {
    it("enables the Next Step button when PENDING_INPUT and no validationResult", async () => {
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT);
      await renderStage(stage);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Next Step" })
        ).not.toBeDisabled();
      });
    });

    it("disables the Next Step button when status is RUNNING", async () => {
      const stage = buildStage(ValidationProcessStageStatus.RUNNING);
      await renderStage(stage);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Next Step" })
        ).toBeDisabled();
      });
    });

    it("disables the Next Step button when validationResult already exists (regardless of PENDING_INPUT)", async () => {
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT, {
        validationResult: {
          decision: "PASSED",
          comment: "",
        } as unknown as ValidationProcessExecuteQualityGateStage["validationResult"],
      });
      await renderStage(stage);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Next Step" })
        ).toBeDisabled();
      });
    });
  });

  // BC 4.1: mark QG passed — calls correct endpoint
  describe("BC 4.1 — mark quality gate passed", () => {
    it("opens the validate dialog when Next Step is clicked", async () => {
      const user = userEvent.setup();
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT);
      await renderStage(stage);

      await user.click(screen.getByRole("button", { name: "Next Step" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
        expect(screen.getByText("Validate Quality Gate")).toBeTruthy();
      });
    });

    it("calls markQualityGatePassed with correct projectId/executionId when confirmed (BC 4.1)", async () => {
      const user = userEvent.setup();
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT);
      await renderStage(stage);

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await waitFor(() => screen.getByRole("dialog"));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await waitFor(() => {
        expect(mockStateUpdater.markQualityGatePassed).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: "project-1",
            executionId: "execution-1",
          })
        );
      });
    });

    it("calls reloadProcessDetails after markQualityGatePassed succeeds (BC 1.6)", async () => {
      const user = userEvent.setup();
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT);
      await renderStage(stage);

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await waitFor(() => screen.getByRole("dialog"));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await waitFor(() => {
        expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
          "execution-1",
          "project-1"
        );
      });
    });
  });

  // BC 4.1: mark QG failed — calls correct endpoint with developmentId + shouldCleanDevelopment (BC 6.2)
  describe("BC 4.1 / BC 6.2 — mark quality gate failed", () => {
    it("calls markQualityGateFailed with developmentId + shouldCleanDevelopment when failed decision is chosen (BC 4.1)", async () => {
      const user = userEvent.setup();
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT);
      await renderStage(stage);

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await waitFor(() => screen.getByRole("dialog"));
      await user.click(screen.getByText("Failed and Stop the process"));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await waitFor(() => {
        expect(mockStateUpdater.markQualityGateFailed).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: "project-1",
            executionId: "execution-1",
            developmentId: "dev-1",
            shouldCleanDevelopment: false,
          })
        );
      });
    });

    it("calls reloadProcessDetails after markQualityGateFailed succeeds (BC 1.6)", async () => {
      const user = userEvent.setup();
      const stage = buildStage(ValidationProcessStageStatus.PENDING_INPUT);
      await renderStage(stage);

      await user.click(screen.getByRole("button", { name: "Next Step" }));
      await waitFor(() => screen.getByRole("dialog"));
      await user.click(screen.getByText("Failed and Stop the process"));
      await user.click(screen.getByRole("button", { name: "Next" }));

      await waitFor(() => {
        expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
          "execution-1",
          "project-1"
        );
      });
    });
  });

  describe("multi-filter", () => {
    it("adds a filter when filterClicked emits from the summary", async () => {
      const stage = buildStage();
      const { fixture } = await renderStage(stage);
      const component = fixture.componentInstance;

      await waitFor(() => {
        expect(document.querySelector("mxevolve-stage-container")).toBeTruthy();
      });

      component.toggleFilter({
        type: "analysisStatus",
        value: "Under Analysis",
        label: "1 Under Analysis",
      });
      fixture.detectChanges();

      expect(component.activeFilters()).toHaveLength(1);
      expect(component.activeFilters()[0]).toEqual(
        expect.objectContaining({
          type: "analysisStatus",
          value: "Under Analysis",
        })
      );
    });

    it("removes a filter when the same filterClicked event is toggled again", async () => {
      const stage = buildStage();
      const { fixture } = await renderStage(stage);
      const component = fixture.componentInstance;

      const filter = {
        type: "analysisStatus" as const,
        value: "Under Analysis",
        label: "1 Under Analysis",
      };

      component.toggleFilter(filter);
      fixture.detectChanges();
      expect(component.activeFilters()).toHaveLength(1);

      component.toggleFilter(filter);
      fixture.detectChanges();
      expect(component.activeFilters()).toHaveLength(0);
    });

    it("can have multiple filters active at once (OR logic)", async () => {
      const stage = buildStage();
      const { fixture } = await renderStage(stage);
      const component = fixture.componentInstance;

      component.toggleFilter({
        type: "analysisStatus",
        value: "Under Analysis",
        label: "1 Under Analysis",
      });
      component.toggleFilter({
        type: "detection",
        value: "impacts",
        label: "3 Impacts",
      });
      fixture.detectChanges();

      expect(component.activeFilters()).toHaveLength(2);
    });

    it("removes a specific filter when removeFilter is called", async () => {
      const stage = buildStage();
      const { fixture } = await renderStage(stage);
      const component = fixture.componentInstance;

      const filter1 = {
        type: "analysisStatus" as const,
        value: "Under Analysis",
        label: "",
      };
      const filter2 = {
        type: "detection" as const,
        value: "impacts",
        label: "",
      };

      component.toggleFilter(filter1);
      component.toggleFilter(filter2);
      fixture.detectChanges();
      expect(component.activeFilters()).toHaveLength(2);

      component.removeFilter(filter1);
      fixture.detectChanges();

      expect(component.activeFilters()).toHaveLength(1);
      expect(component.activeFilters()[0]).toEqual(
        expect.objectContaining({ value: "impacts" })
      );
    });

    it("clears all filters when onScenarioChanged is called", async () => {
      const stage = buildStage();
      const { fixture } = await renderStage(stage);
      const component = fixture.componentInstance;

      component.toggleFilter({
        type: "analysisStatus",
        value: "Under Analysis",
        label: "",
      });
      component.toggleFilter({
        type: "detection",
        value: "impacts",
        label: "",
      });
      fixture.detectChanges();
      expect(component.activeFilters()).toHaveLength(2);

      component.onScenarioChanged();
      fixture.detectChanges();

      expect(component.activeFilters()).toHaveLength(0);
    });

    it("reloads the business process when onScenarioChanged is called", async () => {
      const stage = buildStage();
      const { fixture } = await renderStage(stage);
      const component = fixture.componentInstance;

      component.onScenarioChanged();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        component.processId(),
        component.projectId()
      );
    });
  });

  describe("authorization", () => {
    it("hides the entire Summary section behind view permission on analysis_object", async () => {
      const stage = buildStage();
      await renderStage(stage);

      const directive = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      )[0];

      expect(directive.showElementIfAuthorized).toEqual({
        action: "view",
        resource: "analysis_object",
        package: "web",
        attributes: {},
      });
    });
  });

  it("should display a warning in case no scenario runs were fetched", async () => {
    const stage = buildStage();
    const { fixture } = await renderStage(stage);

    const scenarioRunsComponent = ngMocks.find(fixture, ScenarioRunsComponent);
    scenarioRunsComponent.componentInstance.scenarioRunsFetched.emit([]);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Scenarios are currently being executed. Please refresh to see the latest result."
        )
      ).toBeTruthy();
    });
  });

  it("should not display a warning in case scenario runs were fetched", async () => {
    const stage = buildStage();
    const { fixture } = await renderStage(stage);

    const scenarioRunsComponent = ngMocks.find(fixture, ScenarioRunsComponent);
    scenarioRunsComponent.componentInstance.scenarioRunsFetched.emit(["run-1"]);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Scenarios are currently being executed. Please refresh to see the latest result."
        )
      ).toBeNull();
    });
  });
});
