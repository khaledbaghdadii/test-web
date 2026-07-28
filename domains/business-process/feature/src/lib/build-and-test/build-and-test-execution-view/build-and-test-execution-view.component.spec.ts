import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, Subject } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Tooltip } from "primeng/tooltip";
import { Divider } from "primeng/divider";
import { BuildAndTestExecutionViewComponent } from "./build-and-test-execution-view.component";
import { BuildAndTestMergeStageComponent } from "../merge-stage/build-and-test-merge-stage.component";
import { PrepareBuildStageComponent } from "../prepare-build-stage/prepare-build-stage.component";
import { BuildAndTestExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { BuildAndTestExecutionsService } from "@mxevolve/domains/business-process/data-access";
import {
  BuildAndTestProcessExecution,
  BuildAndTestSourceType,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
  StepComponent,
  StepDefinition,
  StepperComponent,
} from "@mxevolve/shared/ui/primitive";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";
import { BusinessProcessExecutionService } from "@mxflow/features/business-process";

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
  createUrlTree: jest.fn(() => ({})),
  serializeUrl: jest.fn(() => "/business-process-url"),
};

const mockBusinessProcessExecutionService = {
  getBusinessProcessExecution: jest.fn(),
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
      {
        provide: BusinessProcessExecutionService,
        useValue: mockBusinessProcessExecutionService,
      },
    ],
    componentProviders: [
      {
        provide: BuildAndTestExecutionsService,
        useValue: mockExecutionFetcherService,
      },
    ],
  });
}

function getSteps(fixture: { componentInstance: unknown }): StepDefinition[] {
  return ngMocks
    .find(fixture as never, StepperComponent)
    .componentInstance.steps();
}

describe("BuildAndTestExecutionViewComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutionFetcherService.fetchExecution.mockReturnValue(
      of(buildExecution())
    );
    mockBusinessProcessExecutionService.getBusinessProcessExecution.mockReturnValue(
      of({ name: "Parent BP" })
    );
  });

  describe("loading state", () => {
    it("shows loading indicator while execution is being fetched", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        new Subject<BuildAndTestProcessExecution>()
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.queryByTestId("skeleton")).toBeTruthy()
      );
    });

    it("hides the loading indicator once execution data is loaded", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.queryByTestId("skeleton")).toBeNull());
    });
  });

  describe("started by a business process", () => {
    it("shows the originating BP message and link when the source is a business process", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            source: {
              id: "bp-execution-1",
              type: BuildAndTestSourceType.BUSINESS_PROCESS,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByText(/This process was started by the following BP:/)
        ).toBeTruthy()
      );
      expect(screen.getByText("Parent BP")).toBeTruthy();
      expect(
        mockBusinessProcessExecutionService.getBusinessProcessExecution
      ).toHaveBeenCalledWith("project-1", "bp-execution-1");
    });

    it("does not show the originating BP message when the source is a user", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            source: { id: "source-1", type: BuildAndTestSourceType.USER },
          })
        )
      );

      await renderComponent();

      await waitFor(() => expect(screen.queryByTestId("skeleton")).toBeNull());
      expect(
        screen.queryByText(/This process was started by the following BP:/)
      ).toBeNull();
      expect(
        mockBusinessProcessExecutionService.getBusinessProcessExecution
      ).not.toHaveBeenCalled();
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
    it("renders the three CI steps with their titles", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => expect(getSteps(fixture).length).toBe(3));
      const steps = getSteps(fixture);
      expect(steps.map((s) => s.id)).toEqual([
        "prepare-build",
        "build-and-test",
        "merge",
      ]);
      expect(steps.map((s) => s.title)).toEqual([
        "Prepare Setup",
        "Build & Test",
        "Merge",
      ]);
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

      await waitFor(() => expect(getSteps(fixture).length).toBe(3));
      const steps = getSteps(fixture);
      expect(steps.map((s) => s.status)).toEqual([
        "completed",
        "active",
        "inactive",
      ]);
    });

    it("maps an ON_HOLD Merge stage status to an on-hold (pause icon, clickable) step", async () => {
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
              StageStatus.PENDING_INPUT
            ),
            integrateChangesStage: buildStage(
              "integrate-changes",
              "integrate-changes",
              StageStatus.ON_HOLD
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => expect(getSteps(fixture).length).toBe(3));
      const mergeStep = getSteps(fixture).find((s) => s.id === "merge");
      expect(mergeStep?.status).toBe("on-hold");
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

      await waitFor(() => expect(getSteps(fixture).length).toBeGreaterThan(0));
      const prepareBuild = getSteps(fixture).find(
        (s) => s.id === "prepare-build"
      );
      expect(prepareBuild?.status).toBe("skipped");
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

      await waitFor(() => expect(getSteps(fixture).length).toBeGreaterThan(0));
      const prepareBuild = getSteps(fixture).find(
        (s) => s.id === "prepare-build"
      );
      expect(prepareBuild?.status).toBe("skipped");
    });

    it("folds the Create Branch start date into the Prepare Setup tooltip", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: buildStage(
              "create-branch",
              "create-branch",
              StageStatus.PASSED,
              {
                startDate: "2026-01-01T10:00:00Z",
                endDate: "2026-01-01T10:30:00Z",
              }
            ),
            prepareBuildStage: buildStage(
              "prepare-build",
              "prepare-build",
              StageStatus.PASSED,
              {
                startDate: "2026-01-01T10:30:00Z",
                endDate: "2026-01-01T11:00:00Z",
              }
            ),
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => expect(getSteps(fixture).length).toBeGreaterThan(0));
      const prepareBuild = getSteps(fixture).find(
        (s) => s.id === "prepare-build"
      );
      expect(prepareBuild?.tooltip).toContain("Start:");
      expect(prepareBuild?.tooltip).toContain("End:");
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

      await waitFor(() => expect(getSteps(fixture).length).toBeGreaterThan(0));
      const merge = getSteps(fixture).find((s) => s.id === "merge");
      expect(merge?.tooltip).toBeUndefined();
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
        expect(fixture.componentInstance.selectedStepId()).toBe(
          "build-and-test"
        );
      });
    });

    it("opens the latest reached step when Prepare Setup is skipped", async () => {
      const execution = buildExecution({
        createBranchStage: buildStage(
          "create-branch",
          "create-branch",
          StageStatus.PASSED
        ),
        buildAndTestStage: buildStage(
          "build-and-test",
          "build-and-test",
          StageStatus.PASSED
        ),
      });
      execution.input.buildEnvironment.skipEnvironmentDeployment = true;
      mockExecutionFetcherService.fetchExecution.mockReturnValue(of(execution));

      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(fixture.componentInstance.selectedStepId()).toBe(
          "build-and-test"
        )
      );
    });

    it("never selects a skipped Prepare Setup step", async () => {
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

      await waitFor(() =>
        expect(fixture.componentInstance.selectedStepId()).not.toBe(
          "prepare-build"
        )
      );
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
