import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { ValidationProcessIntegrateFixesStageComponent } from "./integrate-fixes-stage.component";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { Message } from "primeng/message";
import {
  type ValidationProcessCreateBranchStage,
  type ValidationProcessExecuteQualityGateStage,
  type ValidationProcessExecution,
  type ValidationProcessIntegrateFixesStage,
  ValidationProcessStageStatus,
  type ValidationProcessTagArchivalStage,
} from "@mxevolve/domains/business-process/data-access";
import {
  ValidationFixIssuesComponent,
  ValidationRetryMergeRequestComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const mockToastMessageService = {
  showError: jest.fn(),
};

function buildExecution(
  integrateFixesStatus: ValidationProcessStageStatus = ValidationProcessStageStatus.PENDING_INPUT,
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
    description: "",
    hidden: false,
    errorMessage: "",
    startDate: "",
    endDate: "",
    expiryDate: "",
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
      headCommitIdUponExecution: "head-1",
      createdBranch: true,
      startDate: "",
      endDate: "",
      errorMessage: "",
      route: "create-branch",
    } as unknown as ValidationProcessCreateBranchStage,
    executeQualityGatesStage: {
      name: "Execute Quality Gates",
      status: ValidationProcessStageStatus.PASSED,
      validationResult: null,
      startDate: "",
      endDate: "",
      errorMessage: "",
      route: "execute-quality-gates",
    } as unknown as ValidationProcessExecuteQualityGateStage,
    tagArchivalBranchStage: {
      name: "Tag Archival",
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
      route: "tag-archival",
    } as unknown as ValidationProcessTagArchivalStage,
    integrateFixesStage: {
      name: "Integrate Fixes",
      status: integrateFixesStatus,
      latestMergeJobId: "merge-job-1",
      stopActionMaker: "user-stop",
      skipActionMaker: "user-skip",
      finalProductPublishing: { id: "", publishingStartDate: "" },
      startDate: "",
      endDate: "",
      errorMessage: "",
      route: "integrate-fixes",
    } as unknown as ValidationProcessIntegrateFixesStage,
    ...overrides,
  } as unknown as ValidationProcessExecution;
}

async function renderIntegrateFixesStage(
  execution: ValidationProcessExecution
) {
  return render(ValidationProcessIntegrateFixesStageComponent, {
    componentImports: [
      StageContainerComponent,
      BusinessProcessContentContainerComponent,
      MockComponent(MergeRequestStepperComponent),
      MockComponent(ValidationRetryMergeRequestComponent),
      MockComponent(ValidationFixIssuesComponent),
      Message,
    ],
    inputs: { execution },
    providers: [
      {
        provide: ToastMessageService,
        useValue: mockToastMessageService,
      },
    ],
  });
}

describe("ValidationProcessIntegrateFixesStageComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("merge stepper and final product binding", () => {
    it("renders the merge request stepper with mergeRequestId and projectId from stage", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
        expect(ngMocks.input(stepper, "mergeRequestId")).toBe("merge-job-1");
        expect(ngMocks.input(stepper, "projectId")).toBe("project-1");
      });
    });

    it("passes finalProductPublishing.id as finalProductId on the stepper when present", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          integrateFixesStage: {
            name: "Integrate Fixes",
            status: ValidationProcessStageStatus.PENDING_INPUT,
            latestMergeJobId: "merge-job-1",
            stopActionMaker: "",
            skipActionMaker: "",
            finalProductPublishing: {
              id: "fp-publishing-1",
              publishingStartDate: "",
            },
            startDate: "",
            endDate: "",
            errorMessage: "",
            route: "integrate-fixes",
          } as unknown as ValidationProcessIntegrateFixesStage,
        }
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
        expect(ngMocks.input(stepper, "showFinalProduct")).toBe(true);
        expect(ngMocks.input(stepper, "finalProductId")).toBe(
          "fp-publishing-1"
        );
      });
    });

    it("shows the final product while publishing is in progress (no id yet)", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          integrateFixesStage: {
            name: "Integrate Fixes",
            status: ValidationProcessStageStatus.PENDING_INPUT,
            latestMergeJobId: "merge-job-1",
            stopActionMaker: "",
            skipActionMaker: "",
            finalProductPublishing: {
              id: "",
              publishingStartDate: "2024-01-01T00:00:00Z",
            },
            startDate: "",
            endDate: "",
            errorMessage: "",
            route: "integrate-fixes",
          } as unknown as ValidationProcessIntegrateFixesStage,
        }
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
        expect(ngMocks.input(stepper, "showFinalProduct")).toBe(true);
      });
    });

    it("does not show the final product when publishing has not started and no failure", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          integrateFixesStage: {
            name: "Integrate Fixes",
            status: ValidationProcessStageStatus.PENDING_INPUT,
            latestMergeJobId: "merge-job-1",
            stopActionMaker: "",
            skipActionMaker: "",
            finalProductPublishing: { id: "", publishingStartDate: "" },
            startDate: "",
            endDate: "",
            errorMessage: "",
            route: "integrate-fixes",
          } as unknown as ValidationProcessIntegrateFixesStage,
        }
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
        expect(ngMocks.input(stepper, "showFinalProduct")).toBe(false);
      });
    });
  });

  describe("Issue 5 — merge stage actions mirror the upgrade process", () => {
    it("renders the Merge (retry merge request) action when isReOpenable is false", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        expect(
          ngMocks.find(fixture, ValidationRetryMergeRequestComponent)
        ).toBeTruthy();
        expect(
          ngMocks.findAll(fixture, ValidationFixIssuesComponent).length
        ).toBe(0);
      });
    });

    it("renders the Re-open (fix issues) action when isReOpenable is true", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
      ngMocks.output(stepper, "isReOpenable").emit(true);
      fixture.detectChanges();

      await waitFor(() => {
        expect(
          ngMocks.findAll(fixture, ValidationRetryMergeRequestComponent).length
        ).toBe(0);
        expect(
          ngMocks.find(fixture, ValidationFixIssuesComponent)
        ).toBeTruthy();
      });
    });

    it("passes the stage status to the retry merge request action when isReOpenable is false", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        const retry = ngMocks.find(
          fixture,
          ValidationRetryMergeRequestComponent
        );
        expect(ngMocks.input(retry, "stageStatus")).toBe(
          ValidationProcessStageStatus.PENDING_INPUT
        );
      });
    });

    it("passes the development id to the retry merge request action", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        const retry = ngMocks.find(
          fixture,
          ValidationRetryMergeRequestComponent
        );
        expect(ngMocks.input(retry, "developmentId")).toBe("dev-1");
      });
    });

    it("passes the process id to the fix action when isReOpenable is true", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderIntegrateFixesStage(execution);

      const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
      ngMocks.output(stepper, "isReOpenable").emit(true);
      fixture.detectChanges();

      await waitFor(() => {
        const fix = ngMocks.find(fixture, ValidationFixIssuesComponent);
        expect(ngMocks.input(fix, "processId")).toBe("execution-1");
      });
    });

    it("hides the merge action and shows an info message when stage is STOPPED", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.STOPPED);
      const { fixture } = await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        expect(
          ngMocks.findAll(fixture, ValidationRetryMergeRequestComponent).length
        ).toBe(0);
        expect(
          screen.getByText("This stage was stopped or skipped.")
        ).toBeTruthy();
      });
    });

    it("shows an info message when stage is SKIPPED", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.SKIPPED);
      await renderIntegrateFixesStage(execution);

      await waitFor(() => {
        expect(
          screen.getByText("This stage was stopped or skipped.")
        ).toBeTruthy();
      });
    });
  });
});
