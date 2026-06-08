import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Subject, of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Tooltip } from "primeng/tooltip";
import { Divider } from "primeng/divider";
import { BuildAndTestExecutionViewComponent } from "./build-and-test-execution-view.component";
import { BuildAndTestMergeStageComponent } from "../merge-stage/build-and-test-merge-stage.component";
import { PrepareBuildStageComponent } from "../prepare-build-stage/prepare-build-stage.component";
import { BuildAndTestExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { BuildAndTestExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import {
  BuildAndTestProcessExecution,
  BuildAndTestSourceType,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  MxevolveIconComponent,
  StepComponent,
  StepDefinition,
  StepperComponent,
} from "@mxevolve/shared/ui/primitive";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";

const MOCK_IMPORTS = [
  MockComponent(BuildAndTestExecutionRunHeaderComponent),
  MockComponent(MxevolveIllustrationComponent),
  StepperComponent,
  StepComponent,
  MockComponent(MxevolveIconComponent),
  MockComponent(BuildAndTestMergeStageComponent),
  MockComponent(PrepareBuildStageComponent),
  Tooltip,
  Divider,
  MockComponent(ExecutionAlertDisplayComponent),
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  executionId: "execution-1",
};

const mockExecutionFetcherService = {
  fetchExecution: jest.fn(),
};

const mockRouter = {
  navigate: jest.fn(),
};

function buildMockActivatedRoute(queryParams: Record<string, string> = {}) {
  return {
    snapshot: { queryParams },
  };
}

function buildStage(
  name: string,
  route: string,
  status: StageStatus = StageStatus.NOT_STARTED,
  dates: { startDate?: string; endDate?: string } = {}
) {
  return { name, route, status, ...dates };
}

function buildExecution(
  overrides: Partial<BuildAndTestProcessExecution> = {}
): BuildAndTestProcessExecution {
  return {
    id: "execution-1",
    projectId: "project-1",
    name: "CI Run",
    status: ExecutionStatus.RUNNING,
    definitionId: "def-1",
    definitionName: "definition-name",
    familyName: "Build & Test Process",
    processName: "Configuration Build & Test",
    supportsResourceManagement: false,
    hasPredefinedMergeRequestInputs: false,
    ciVersion: 2,
    notificationsRecipients: [],
    owner: "owner",
    source: { id: "source-1", type: BuildAndTestSourceType.USER },
    input: {
      repositoryId: "repo-1",
      configurationBranchName: "branch-1",
      configurationParentBranch: "main",
      userStoryIds: ["US-1"],
      buildAndTestInfraGroup: "test-env-infra",
      buildEnvironmentInfraGroup: "build-env-infra",
      buildEnvironment: {
        skipEnvironmentDeployment: false,
        scenarioDefinitionId: "scenario-1",
      },
    },
    createBranchStage: buildStage(
      "create-branch",
      "create-branch",
      StageStatus.RUNNING
    ),
    prepareBuildStage: buildStage("prepare-build", "prepare-build"),
    buildAndTestStage: buildStage("build-and-test", "build-and-test"),
    integrateChangesStage: buildStage("integrate-changes", "integrate-changes"),
    ...overrides,
  } as BuildAndTestProcessExecution;
}

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS> = {},
  queryParams: Record<string, string> = {}
) {
  return render(BuildAndTestExecutionViewComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    providers: [
      { provide: Router, useValue: mockRouter },
      {
        provide: ActivatedRoute,
        useValue: buildMockActivatedRoute(queryParams),
      },
    ],
    componentProviders: [
      {
        provide: BuildAndTestExecutionFetcherService,
        useValue: mockExecutionFetcherService,
      },
    ],
  });
}

function getSteps(fixture: { componentInstance: unknown }): StepDefinition[] {
  return ngMocks.find(fixture as never, StepperComponent).componentInstance
    .steps() as StepDefinition[];
}

describe("BuildAndTestExecutionViewComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutionFetcherService.fetchExecution.mockReturnValue(
      of(buildExecution())
    );
  });

  describe("loading state", () => {
    it("shows loading indicator while execution is being fetched", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        new Subject<BuildAndTestProcessExecution>()
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("LOADING SCREEN COMING SOON")).toBeTruthy()
      );
    });

    it("hides the loading indicator once execution data is loaded", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(screen.queryByText("LOADING SCREEN COMING SOON")).toBeNull()
      );
    });
  });

  describe("pending branch creation state", () => {
    it("shows 'Your branch is being created' when create branch has not started", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.NOT_STARTED
            ),
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Your branch is being created")).toBeTruthy()
      );
    });

    it("does not show the stepper when create branch has not started", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.NOT_STARTED
            ),
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeNull()
      );
    });

    it("shows the stepper when create branch has failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.FAILED
            ),
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeTruthy()
      );
    });
  });

  describe("execution run header", () => {
    it("shows the run header with the loaded execution", async () => {
      const execution = buildExecution();
      mockExecutionFetcherService.fetchExecution.mockReturnValue(of(execution));

      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-run-header")
        ).toBeTruthy();
        expect(
          ngMocks.find(fixture, BuildAndTestExecutionRunHeaderComponent)
            .componentInstance
            .execution as unknown as BuildAndTestProcessExecution
        ).toEqual(execution);
      });
    });
  });

  describe("steps", () => {
    it("renders the four CI steps with their titles", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const steps = getSteps(fixture);
        expect(steps.map((s) => s.id)).toEqual([
          "create-branch",
          "prepare-build",
          "build-and-test",
          "merge",
        ]);
        expect(steps.map((s) => s.title)).toEqual([
          "Create Branch",
          "Prepare Setup",
          "Build & Test",
          "Merge",
        ]);
      });
    });

    it("maps stage statuses to step statuses", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED
            ),
            prepareBuildStage: buildStage(
              "prepare-build",
              "prepare-build",
              StageStatus.PASSED
            ),
            buildAndTestStage: buildStage(
              "build-and-test",
              "build-and-test",
              StageStatus.RUNNING
            ),
            integrateChangesStage: buildStage(
              "integrate-changes",
              "integrate-changes",
              StageStatus.NOT_STARTED
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const steps = getSteps(fixture);
        expect(steps.map((s) => s.status)).toEqual([
          "completed",
          "completed",
          "active",
          "inactive",
        ]);
      });
    });

    it("passes the mapped Prepare Setup status into the Prepare stage", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED
            ),
            prepareBuildStage: buildStage(
              "prepare-build",
              "prepare-build",
              StageStatus.RUNNING
            ),
          })
        )
      );

      const { fixture } = await renderComponent({}, { step: "prepare-build" });

      await waitFor(() => {
        const prepareStage = ngMocks.find(fixture, PrepareBuildStageComponent);
        expect(prepareStage.componentInstance.stageStatus).toBe("active");
      });
    });

    it("marks Prepare Setup as skipped when environment deployment is skipped", async () => {
      const execution = buildExecution({
        createBranchStage: buildStage(
          "create-branch",
          "create-branch",
          StageStatus.PASSED
        ),
      });
      execution.input.buildEnvironment.skipEnvironmentDeployment = true;
      mockExecutionFetcherService.fetchExecution.mockReturnValue(of(execution));

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const steps = getSteps(fixture);
        const prepareBuild = steps.find((s) => s.id === "prepare-build");
        expect(prepareBuild?.status).toBe("skipped");
      });
    });

    it("maps a SKIPPED stage status to a skipped step", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED
            ),
            prepareBuildStage: buildStage(
              "prepare-build",
              "prepare-build",
              StageStatus.SKIPPED
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const steps = getSteps(fixture);
        const prepareBuild = steps.find((s) => s.id === "prepare-build");
        expect(prepareBuild?.status).toBe("skipped");
      });
    });

    it("builds a date tooltip for a completed step with start and end dates", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED,
              {
                startDate: "2026-01-01T10:00:00Z",
                endDate: "2026-01-01T11:00:00Z",
              }
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const steps = getSteps(fixture);
        const createBranch = steps.find((s) => s.id === "create-branch");
        expect(createBranch?.tooltip).toContain("Start:");
        expect(createBranch?.tooltip).toContain("End:");
      });
    });

    it("does not build a tooltip for an inactive step", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED
            ),
            integrateChangesStage: buildStage(
              "integrate-changes",
              "integrate-changes",
              StageStatus.NOT_STARTED
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const steps = getSteps(fixture);
        const merge = steps.find((s) => s.id === "merge");
        expect(merge?.tooltip).toBeUndefined();
      });
    });
  });

  describe("default step selection", () => {
    it("selects the active step by default", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED
            ),
            buildAndTestStage: buildStage(
              "build-and-test",
              "build-and-test",
              StageStatus.RUNNING
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          fixture.componentInstance.selectedStepId()
        ).toBe("build-and-test");
      });
    });

    it("honours the step query parameter when provided", async () => {
      const { fixture } = await renderComponent({}, { step: "merge" });

      await waitFor(() =>
        expect(fixture.componentInstance.selectedStepId()).toBe("merge")
      );
    });

    it("renders the Merge stage with the loaded execution", async () => {
      const execution = buildExecution({
        createBranchStage: buildStage(
          "create-branch",
          "create-branch",
          StageStatus.PASSED
        ),
        integrateChangesStage: buildStage(
          "integrate-changes",
          "integrate-changes",
          StageStatus.PENDING_INPUT
        ),
      });
      mockExecutionFetcherService.fetchExecution.mockReturnValue(of(execution));

      const { fixture } = await renderComponent({}, { step: "merge" });

      await waitFor(() => {
        const mergeStage = ngMocks.find(
          fixture,
          BuildAndTestMergeStageComponent
        );
        const executionInput = mergeStage.componentInstance.execution;
        expect(
          typeof executionInput === "function"
            ? executionInput()
            : executionInput
        ).toEqual(execution);
      });
    });
  });
});
