import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, Subject } from "rxjs";
import { ValidationProcessExecutionViewComponent } from "./validation-process-execution-view.component";
import { ValidationProcessExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import {
  type ValidationProcessCreateBranchStage,
  type ValidationProcessExecuteQualityGateStage,
  type ValidationProcessExecution,
  ValidationProcessExecutionFetcherService,
  type ValidationProcessIntegrateFixesStage,
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
  type ValidationProcessTagArchivalStage,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import {
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
  StepComponent,
  StepperComponent,
} from "@mxevolve/shared/ui/primitive";
import { Tooltip } from "primeng/tooltip";
import { Divider } from "primeng/divider";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";
import { ActivatedRoute, Router } from "@angular/router";
import { ValidationProcessExecuteQualityGatesStageComponent } from "../execute-quality-gates-stage/execute-quality-gates-stage.component";
import { ValidationProcessTagArchivalStageComponent } from "../tag-archival-stage/tag-archival-stage.component";
import { ValidationProcessIntegrateFixesStageComponent } from "../integrate-fixes-stage/integrate-fixes-stage.component";
import { Title } from "@angular/platform-browser";

const MOCK_IMPORTS = [
  MockComponent(ValidationProcessExecutionRunHeaderComponent),
  MockComponent(MxevolveIllustrationComponent),
  StepperComponent,
  StepComponent,
  MockComponent(MxevolveIconComponent),
  Tooltip,
  Divider,
  MockComponent(ValidationProcessExecuteQualityGatesStageComponent),
  MockComponent(ValidationProcessTagArchivalStageComponent),
  MockComponent(ValidationProcessIntegrateFixesStageComponent),
  MockComponent(ExecutionAlertDisplayComponent),
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  executionId: "execution-1",
};

const stepWithId = (id: string) => (step: { id: string; status: string }) =>
  step.id === id;

const mockExecutionFetcherService = {
  fetchExecution: jest.fn(),
};

const mockReloadTrigger$ = new Subject<void>();
const mockStateUpdater = {
  reloadTrigger$: mockReloadTrigger$,
};

const mockRouter = {
  navigate: jest.fn(),
};

const mockTitle = {
  setTitle: jest.fn(),
};

function buildMockActivatedRoute(queryParams: Record<string, string> = {}) {
  return {
    snapshot: { queryParams },
  };
}

function buildExecution(
  overrides: Partial<ValidationProcessExecution> = {}
): ValidationProcessExecution {
  return {
    id: "execution-1",
    projectId: "project-1",
    projectName: "My Project",
    name: "MV Run 1",
    status: ExecutionStatus.RUNNING,
    definitionId: "def-1",
    definitionName: "Template A",
    sourceDefinitionId: "src-def-1",
    familyId: "master-validation",
    familyName: "Master Validation",
    processName: "MV Process",
    description: "A description",
    hidden: false,
    errorMessage: "",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "",
    expiryDate: "2024-12-31T00:00:00Z",
    businessProcessQualityLevel: "MQG",
    officiality: "OFFICIAL",
    daysExtended: 0,
    owner: "owner-1",
    input: {
      repositoryId: "repo-1",
      createBranch: true,
      archivalBranchName: "archival-branch",
      parentBranch: "main",
      scenarioDefinitionIds: [],
      businessProcessQualityLevel: "MQG",
      finalProductId: "fp-1",
      qualityGateExecutionInfraGroupId: "infra-1",
      configCommitId: "config-commit-1",
      rtpCommitId: "rtp-commit-1",
      nightlyRepusherEnabled: false,
    },
    createBranchStage: {
      name: "Create Branch",
      status: ValidationProcessStageStatus.PASSED,
      developmentId: "dev-1",
      headCommitIdUponExecution: "head-commit-1",
      createdBranch: true,
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-01-01T00:01:00Z",
      errorMessage: "",
      route: "create-branch",
    },
    executeQualityGatesStage: {
      name: "Run Quality Gate",
      status: ValidationProcessStageStatus.RUNNING,
      validationResult: null,
      startDate: "2024-01-01T00:01:00Z",
      endDate: "",
      errorMessage: "",
      route: "run-quality-gate",
    },
    tagArchivalBranchStage: {
      name: "Tag",
      status: ValidationProcessStageStatus.NOT_STARTED,
      configTagName: "",
      configCommitId: "",
      rtpTagName: "",
      rtpCommitId: "",
      promotedFinalProductId: "",
      promotionSuccessful: false,
      promotionErrorMessage: "",
      archivalUserStoriesUpdateStatus: undefined,
      startDate: "",
      endDate: "",
      errorMessage: "",
      route: "tag",
    },
    integrateFixesStage: {
      name: "Merge",
      status: ValidationProcessStageStatus.NOT_STARTED,
      latestMergeJobId: "",
      stopActionMaker: "",
      skipActionMaker: "",
      finalProductPublishing: {
        id: "",
        publishingStartDate: "",
      },
      startDate: "",
      endDate: "",
      errorMessage: "",
      route: "merge",
    },
    ...overrides,
  } as unknown as ValidationProcessExecution;
}

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS> = {},
  queryParams: Record<string, string> = {}
) {
  return render(ValidationProcessExecutionViewComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    providers: [
      { provide: Router, useValue: mockRouter },
      {
        provide: ActivatedRoute,
        useValue: buildMockActivatedRoute(queryParams),
      },
      { provide: Title, useValue: mockTitle },
    ],
    componentProviders: [
      {
        provide: ValidationProcessExecutionFetcherService,
        useValue: mockExecutionFetcherService,
      },
      {
        provide: ValidationProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
    ],
  });
}

describe("ValidationProcessExecutionViewComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutionFetcherService.fetchExecution.mockReturnValue(
      of(buildExecution())
    );
  });

  // BC 4.8: loading skeleton
  describe("loading state", () => {
    it("shows loading skeleton while execution is being fetched", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        new Subject<ValidationProcessExecution>()
      );

      await renderComponent();

      // Skeleton divs are rendered; no stepper yet
      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeNull()
      );
    });

    it("hides the skeleton once execution data is loaded", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeTruthy()
      );
    });
  });

  // BC 4.5: waiting screen
  describe("waiting screen — branch being created", () => {
    it("shows waiting screen when createBranchStage is NOT_STARTED and not failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: {
              name: "Create Branch",
              status: ValidationProcessStageStatus.NOT_STARTED,
              developmentId: "",
              headCommitIdUponExecution: "",
              createdBranch: false,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "create-branch",
            } as unknown as ValidationProcessCreateBranchStage,
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Your branch is being created")).toBeTruthy()
      );
    });

    it("does not show the stepper when waiting screen is shown", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: {
              name: "Create Branch",
              status: ValidationProcessStageStatus.NOT_STARTED,
              developmentId: "",
              headCommitIdUponExecution: "",
              createdBranch: false,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "create-branch",
            } as unknown as ValidationProcessCreateBranchStage,
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeNull()
      );
    });

    it("does NOT show waiting screen when createBranchStage has FAILED", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: {
              name: "Create Branch",
              status: ValidationProcessStageStatus.FAILED,
              developmentId: "",
              headCommitIdUponExecution: "",
              createdBranch: false,
              startDate: "",
              endDate: "",
              errorMessage: "Branch failed",
              route: "create-branch",
            } as unknown as ValidationProcessCreateBranchStage,
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.queryByText("Your branch is being created")).toBeNull()
      );
    });

    it("shows the stepper when branch creation has FAILED (failedInBranchCreation = true)", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: {
              name: "Create Branch",
              status: ValidationProcessStageStatus.FAILED,
              developmentId: "",
              headCommitIdUponExecution: "",
              createdBranch: false,
              startDate: "",
              endDate: "",
              errorMessage: "Branch failed",
              route: "create-branch",
            } as unknown as ValidationProcessCreateBranchStage,
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeTruthy()
      );
    });
  });

  // No horizontal-timeline reference
  describe("stepper — no horizontal-timeline", () => {
    it("does not render a horizontal-timeline element", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-business-process-execution-progress")
        ).toBeNull()
      );
    });

    it("renders mxevolve-stepper with exactly 3 steps in MV order", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        expect(steps).toHaveLength(3);
        expect(steps[0].id).toBe("run-quality-gate");
        expect(steps[1].id).toBe("tag");
        expect(steps[2].id).toBe("merge");
      });
    });

    it("scopes the run-quality-gate stage to the archival branch, not the parent branch", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stage = ngMocks.find(
          fixture,
          ValidationProcessExecuteQualityGatesStageComponent
        );
        expect(ngMocks.input(stage, "branch")).toBe("archival-branch");
      });
    });

    it("passes the input final product id to the run-quality-gate stage", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stage = ngMocks.find(
          fixture,
          ValidationProcessExecuteQualityGatesStageComponent
        );
        expect(ngMocks.input(stage, "finalProductId")).toBe("fp-1");
      });
    });
  });

  // Run header
  describe("run header", () => {
    it("renders mxevolve-validation-process-execution-run-header with the loaded execution", async () => {
      const execution = buildExecution();
      mockExecutionFetcherService.fetchExecution.mockReturnValue(of(execution));

      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          document.querySelector(
            "mxevolve-validation-process-execution-run-header"
          )
        ).toBeTruthy();
        expect(
          ngMocks.find(fixture, ValidationProcessExecutionRunHeaderComponent)
            .componentInstance.execution
        ).toEqual(execution);
      });
    });
  });

  // Step status from stage status
  describe("step status mapping", () => {
    it("maps RUNNING stage to active step", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        // executeQualityGatesStage is RUNNING in default execution
        const qgStep = steps.find(stepWithId("run-quality-gate"));
        expect(qgStep?.status).toBe("active");
      });
    });

    it("maps PASSED stage to completed step", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            executeQualityGatesStage: {
              name: "Execute Quality Gates",
              status: ValidationProcessStageStatus.PASSED,
              validationResult: null,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "run-quality-gate",
            } as unknown as ValidationProcessExecuteQualityGateStage,
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        const qgStep = steps.find(stepWithId("run-quality-gate"));
        expect(qgStep?.status).toBe("completed");
      });
    });

    it("maps NOT_STARTED stage to inactive step", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        const tagStep = steps.find(stepWithId("tag"));
        expect(tagStep?.status).toBe("inactive");
      });
    });

    it("maps FAILED stage to failed step", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            executeQualityGatesStage: {
              name: "Execute Quality Gates",
              status: ValidationProcessStageStatus.FAILED,
              validationResult: null,
              startDate: "",
              endDate: "",
              errorMessage: "QG failed",
              route: "run-quality-gate",
            } as unknown as ValidationProcessExecuteQualityGateStage,
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        const qgStep = steps.find(stepWithId("run-quality-gate"));
        expect(qgStep?.status).toBe("failed");
      });
    });

    it("maps SKIPPED stage to skipped step", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            integrateFixesStage: {
              name: "Merge",
              status: ValidationProcessStageStatus.SKIPPED,
              latestMergeJobId: "",
              route: "merge",
            } as unknown as ValidationProcessIntegrateFixesStage,
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        const mergeStep = steps.find(stepWithId("merge"));
        expect(mergeStep?.status).toBe("skipped");
      });
    });

    it("maps PENDING_INPUT stage to active step", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            tagArchivalBranchStage: {
              name: "Tag",
              status: ValidationProcessStageStatus.PENDING_INPUT,
              configTagName: "",
              configCommitId: "",
              rtpTagName: "",
              rtpCommitId: "",
              promotedFinalProductId: "",
              promotionSuccessful: false,
              promotionErrorMessage: "",
              archivalUserStoriesUpdateStatus: undefined,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "tag",
            } as unknown as ValidationProcessTagArchivalStage,
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, StepperComponent);
        const steps = stepper.componentInstance.steps();
        const tagStep = steps.find(stepWithId("tag"));
        expect(tagStep?.status).toBe("active");
      });
    });
  });

  // BC 1.4: default step selection
  describe("default step selection (BC 1.4)", () => {
    it("selects the first RUNNING stage by default", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          [],
          expect.objectContaining({
            queryParams: { step: "run-quality-gate" },
          })
        );
      });
    });

    it("uses URL ?step= param when provided", async () => {
      await renderComponent({}, { step: "tag" });

      await waitFor(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          [],
          expect.objectContaining({
            queryParams: { step: "tag" },
          })
        );
      });
    });

    it("falls back to first stage (run-quality-gate) when no stage is active or failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            createBranchStage: {
              name: "Create Branch",
              status: ValidationProcessStageStatus.PASSED,
              developmentId: "dev-1",
              headCommitIdUponExecution: "",
              createdBranch: true,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "create-branch",
            } as unknown as ValidationProcessCreateBranchStage,
            executeQualityGatesStage: {
              name: "Run Quality Gate",
              status: ValidationProcessStageStatus.PASSED,
              validationResult: null,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "run-quality-gate",
            } as unknown as ValidationProcessExecuteQualityGateStage,
            tagArchivalBranchStage: {
              name: "Tag",
              status: ValidationProcessStageStatus.PASSED,
              configTagName: "",
              configCommitId: "",
              rtpTagName: "",
              rtpCommitId: "",
              promotedFinalProductId: "",
              promotionSuccessful: false,
              promotionErrorMessage: "",
              archivalUserStoriesUpdateStatus: undefined,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "tag",
            } as unknown as ValidationProcessTagArchivalStage,
            integrateFixesStage: {
              name: "Merge",
              status: ValidationProcessStageStatus.PASSED,
              latestMergeJobId: "",
              stopActionMaker: "",
              skipActionMaker: "",
              finalProductPublishing: { id: "", publishingStartDate: "" },
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "merge",
            } as unknown as ValidationProcessIntegrateFixesStage,
          })
        )
      );

      await renderComponent();

      await waitFor(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          [],
          expect.objectContaining({
            queryParams: { step: "run-quality-gate" },
          })
        );
      });
    });

    it("selects a STOPPED stage as default (BC 1.4 parity with legacy)", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            executeQualityGatesStage: {
              name: "Run Quality Gate",
              status: ValidationProcessStageStatus.PASSED,
              validationResult: null,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "run-quality-gate",
            } as unknown as ValidationProcessExecuteQualityGateStage,
            tagArchivalBranchStage: {
              name: "Tag",
              status: ValidationProcessStageStatus.STOPPED,
              configTagName: "",
              configCommitId: "",
              rtpTagName: "",
              rtpCommitId: "",
              promotedFinalProductId: "",
              promotionSuccessful: false,
              promotionErrorMessage: "",
              archivalUserStoriesUpdateStatus: undefined,
              startDate: "",
              endDate: "",
              errorMessage: "",
              route: "tag",
            } as unknown as ValidationProcessTagArchivalStage,
          })
        )
      );

      await renderComponent();

      await waitFor(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          [],
          expect.objectContaining({
            queryParams: { step: "tag" },
          })
        );
      });
    });
  });

  // Finding 3: soft reload via reloadTrigger$
  describe("soft reload on stateUpdater.reloadTrigger$", () => {
    it("re-fetches execution data when stateUpdater emits reloadTrigger$", async () => {
      await renderComponent();

      // Wait for initial load
      await waitFor(() =>
        expect(
          mockExecutionFetcherService.fetchExecution
        ).toHaveBeenCalledTimes(1)
      );

      const callsBefore =
        mockExecutionFetcherService.fetchExecution.mock.calls.length;

      // Trigger soft reload
      mockReloadTrigger$.next();

      await waitFor(() => {
        expect(
          mockExecutionFetcherService.fetchExecution.mock.calls.length
        ).toBeGreaterThan(callsBefore);
      });
    });
  });

  // BC 1.5: page title
  describe("page title (BC 1.5)", () => {
    it("sets the page title to 'BP Execution - {name} - {projectName}'", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockTitle.setTitle).toHaveBeenCalledWith(
          "BP Execution - MV Run 1 - My Project"
        );
      });
    });
  });

  // BC 4.6: alert display
  describe("execution alert display (BC 4.6)", () => {
    it("renders mxevolve-execution-alert-display with execution data", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const alertDisplay = ngMocks.find(
          fixture,
          ExecutionAlertDisplayComponent
        );
        expect(alertDisplay).toBeTruthy();
      });
    });

    it("passes aborted=true when execution status is ABORTED", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(buildExecution({ status: ExecutionStatus.ABORTED }))
      );

      const { fixture } = await renderComponent();

      await waitFor(() => {
        const alertDisplay = ngMocks.find(
          fixture,
          ExecutionAlertDisplayComponent
        );
        // ngMocks stores input values on the mock; for signal inputs check the raw property
        expect(ngMocks.input(alertDisplay, "aborted")).toBe(true);
      });
    });
  });
});
