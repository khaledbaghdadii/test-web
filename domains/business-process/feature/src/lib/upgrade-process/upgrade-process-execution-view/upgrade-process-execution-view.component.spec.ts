import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Subject, of } from "rxjs";
import { userEvent } from "@testing-library/user-event";
import { UpgradeProcessExecutionViewComponent } from "./upgrade-process-execution-view.component";
import { ExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { ExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionStatus,
  StageStatus,
  UpgradeProcessExecution,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  MxevolveIconComponent,
  StepComponent,
  StepperComponent,
} from "@mxevolve/shared/ui/primitive";
import { Tooltip } from "primeng/tooltip";
import { Divider } from "primeng/divider";
import { ConvertBinaryStageComponent } from "../convert-binary-stage/convert-binary-stage.component";
import { RunQualityGateStageComponent } from "../run-quality-gate-stage/run-quality-gate-stage.component";
import { IntegrateChangesStageComponent } from "../integrate-changes-stage/integrate-changes-stage.component";
import { TagStageComponent } from "../tag-stage/tag-stage.component";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";
import { ActivatedRoute, Router } from "@angular/router";

const MOCK_IMPORTS = [
  MockComponent(ExecutionRunHeaderComponent),
  MockComponent(MxevolveIllustrationComponent),
  StepperComponent,
  StepComponent,
  MockComponent(MxevolveIconComponent),
  Tooltip,
  Divider,
  MockComponent(ConvertBinaryStageComponent),
  MockComponent(RunQualityGateStageComponent),
  MockComponent(IntegrateChangesStageComponent),
  MockComponent(TagStageComponent),
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

function buildExecution(
  overrides: Partial<UpgradeProcessExecution> = {}
): UpgradeProcessExecution {
  return {
    id: "execution-1",
    projectId: "project-1",
    name: "Upgrade Run",
    status: ExecutionStatus.RUNNING,
    definitionId: "def-1",
    supportsResourceManagement: false,
    notificationsRecipients: [],
    officiality: "OFFICIAL",
    input: {
      factoryProductId: "fp-1",
      mxVersion: "1.0",
      mxBuildId: "build-1",
      bipVersion: "2.0",
      bipBuildId: "bip-build-1",
      parentMxArchivalBranch: "main",
      repositoryId: "repo-1",
      configurationBranchName: "branch-1",
      configurationParentBranch: "main",
      createBranch: true,
      binaryConversionInfraGroupId: "infra-1",
      qualityGateExecutionInfraGroupId: "infra-2",
      binaryConversionTestScenarioId: "ts-1",
    },
    createBranchStage: {
      name: "create-branch",
      status: StageStatus.PASSED,
      developmentId: "dev-1",
    },
    binaryConversionStage: {
      name: "binary-conversion",
      status: StageStatus.RUNNING,
    },
    executeQualityGateStage: {
      name: "quality-gate",
      status: StageStatus.NOT_STARTED,
    },
    integrateChangesStage: {
      name: "integrate-changes",
      status: StageStatus.NOT_STARTED,
    },
    tagUpgradeBranchStage: {
      name: "tag",
      status: StageStatus.NOT_STARTED,
    },
    referenceEnvironmentDeployment: {
      name: "ref-env",
      status: StageStatus.NOT_STARTED,
      supported: false,
      enabledInCurrentlyActiveStage: false,
      limitReached: false,
      canCleanAndDeploy: false,
    },
    ...overrides,
  } as UpgradeProcessExecution;
}

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS> = {},
  queryParams: Record<string, string> = {}
) {
  return render(UpgradeProcessExecutionViewComponent, {
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
        provide: ExecutionFetcherService,
        useValue: mockExecutionFetcherService,
      },
    ],
  });
}

describe("UpgradeProcessExecutionViewComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutionFetcherService.fetchExecution.mockReturnValue(
      of(buildExecution())
    );
  });

  describe("loading state", () => {
    it("shows loading indicator while execution is being fetched", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        new Subject<UpgradeProcessExecution>()
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
    it("shows 'Your branch is being created' when binary conversion has not started", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.NOT_STARTED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Your branch is being created")).toBeTruthy()
      );
    });

    it("does not show the stepper when binary conversion has not started", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.NOT_STARTED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-stepper")).toBeNull()
      );
    });
  });

  describe("execution run header", () => {
    it("shows the execution run header with the loaded execution", async () => {
      const execution = buildExecution();
      mockExecutionFetcherService.fetchExecution.mockReturnValue(of(execution));

      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-execution-run-header")
        ).toBeTruthy();
        expect(
          ngMocks.find(fixture, ExecutionRunHeaderComponent).componentInstance
            .execution as unknown as UpgradeProcessExecution
        ).toEqual(execution);
      });
    });
  });

  describe("default opened stage", () => {
    it("convert binary stage is opened by default when binary conversion is running", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-convert-binary-stage")
        ).toBeTruthy()
      );
    });

    it("convert binary stage is opened by default when binary conversion is pending input", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PENDING_INPUT,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-convert-binary-stage")
        ).toBeTruthy()
      );
    });

    it("convert binary stage is opened by default when binary conversion has failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.FAILED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-convert-binary-stage")
        ).toBeTruthy()
      );
    });

    it("run quality gate stage is opened by default when quality gate is running", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.RUNNING,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-run-quality-gate-stage")
        ).toBeTruthy()
      );
    });

    it("run quality gate stage is opened by default when quality gate is pending input", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PENDING_INPUT,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-run-quality-gate-stage")
        ).toBeTruthy()
      );
    });

    it("run quality gate stage is opened by default when quality gate has failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.FAILED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-run-quality-gate-stage")
        ).toBeTruthy()
      );
    });

    it("integrate changes stage is opened by default when integrate changes is running", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.RUNNING,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-integrate-changes-stage")
        ).toBeTruthy()
      );
    });

    it("integrate changes stage is opened by default when integrate changes is pending input", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PENDING_INPUT,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-integrate-changes-stage")
        ).toBeTruthy()
      );
    });

    it("integrate changes stage is opened by default when integrate changes has failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.FAILED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-integrate-changes-stage")
        ).toBeTruthy()
      );
    });

    it("tag stage is opened by default when tag is running", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PASSED,
            },
            tagUpgradeBranchStage: {
              name: "tag",
              status: StageStatus.RUNNING,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-tag-stage")).toBeTruthy()
      );
    });

    it("tag stage is opened by default when tag is pending input", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PASSED,
            },
            tagUpgradeBranchStage: {
              name: "tag",
              status: StageStatus.PENDING_INPUT,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-tag-stage")).toBeTruthy()
      );
    });

    it("tag stage is opened by default when tag has failed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PASSED,
            },
            tagUpgradeBranchStage: {
              name: "tag",
              status: StageStatus.FAILED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-tag-stage")).toBeTruthy()
      );
    });

    it("tag stage is opened by default when all stages are passed", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PASSED,
            },
            tagUpgradeBranchStage: {
              name: "tag",
              status: StageStatus.PASSED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-tag-stage")).toBeTruthy()
      );
    });
  });

  describe("alert display", () => {
    it("renders alert display with the correct inputs", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            expiryDate: "2025-12-01T00:00:00Z",
            endDate: "2025-11-01T00:00:00Z",
            errorMessage: "Something went wrong",
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-execution-alert-display")
        ).toBeTruthy()
      );
      const alertDisplay = ngMocks.find(
        fixture,
        ExecutionAlertDisplayComponent
      );
      expect(ngMocks.input(alertDisplay, "expiryDate")).toBe(
        "2025-12-01T00:00:00Z"
      );
      expect(ngMocks.input(alertDisplay, "endDate")).toBe(
        "2025-11-01T00:00:00Z"
      );
      expect(ngMocks.input(alertDisplay, "errorMessage")).toBe(
        "Something went wrong"
      );
      expect(ngMocks.input(alertDisplay, "aborted")).toBe(false);
    });

    it("passes aborted as true when status is ABORTED", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            status: ExecutionStatus.ABORTED,
          })
        )
      );

      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-execution-alert-display")
        ).toBeTruthy()
      );
      const alertDisplay = ngMocks.find(
        fixture,
        ExecutionAlertDisplayComponent
      );
      expect(ngMocks.input(alertDisplay, "aborted")).toBe(true);
    });

    it("passes aborted as false when status is not ABORTED", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            status: ExecutionStatus.RUNNING,
          })
        )
      );
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-execution-alert-display")
        ).toBeTruthy()
      );
      const alertDisplay = ngMocks.find(
        fixture,
        ExecutionAlertDisplayComponent
      );
      expect(ngMocks.input(alertDisplay, "aborted")).toBe(false);
    });
  });

  describe("step navigation", () => {
    it("shows the correct stage when clicking through all step titles", async () => {
      const user = userEvent.setup();
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PASSED,
            },
            tagUpgradeBranchStage: {
              name: "tag",
              status: StageStatus.PASSED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(document.querySelector("mxevolve-tag-stage")).toBeTruthy()
      );

      await user.click(screen.getByText("Convert Binary"));

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-convert-binary-stage")
        ).toBeTruthy();
        expect(document.querySelector("mxevolve-tag-stage")).toBeNull();
      });

      await user.click(screen.getByText("Run Quality Gate"));

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-run-quality-gate-stage")
        ).toBeTruthy();
        expect(
          document.querySelector("mxevolve-convert-binary-stage")
        ).toBeNull();
      });

      await user.click(screen.getByText("Merge"));

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-integrate-changes-stage")
        ).toBeTruthy();
        expect(
          document.querySelector("mxevolve-run-quality-gate-stage")
        ).toBeNull();
      });

      await user.click(screen.getByText("Tag"));

      await waitFor(() => {
        expect(document.querySelector("mxevolve-tag-stage")).toBeTruthy();
        expect(
          document.querySelector("mxevolve-integrate-changes-stage")
        ).toBeNull();
      });
    });
  });

  describe("step URL synchronization", () => {
    it("opens the step specified in the route query param", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.RUNNING,
            },
          })
        )
      );

      await renderComponent({}, { step: "run-quality-gate" });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-run-quality-gate-stage")
        ).toBeTruthy()
      );
    });

    it("updates the URL query param when a step is clicked", async () => {
      const user = userEvent.setup();
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(
          buildExecution({
            binaryConversionStage: {
              name: "binary-conversion",
              status: StageStatus.PASSED,
            },
            executeQualityGateStage: {
              name: "quality-gate",
              status: StageStatus.PASSED,
            },
            integrateChangesStage: {
              name: "integrate-changes",
              status: StageStatus.PASSED,
            },
            tagUpgradeBranchStage: {
              name: "tag",
              status: StageStatus.PASSED,
            },
          })
        )
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Convert Binary")).toBeTruthy()
      );

      await user.click(screen.getByText("Convert Binary"));

      await waitFor(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith([], {
          relativeTo: expect.anything(),
          queryParams: { step: "convert-binary" },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      });
    });

    it("defaults to undefined selectedStepId when no query param is present", async () => {
      mockExecutionFetcherService.fetchExecution.mockReturnValue(
        of(buildExecution())
      );

      await renderComponent();

      // Without a step query param, the stepper auto-selects based on active status
      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-convert-binary-stage")
        ).toBeTruthy()
      );
    });
  });
});
