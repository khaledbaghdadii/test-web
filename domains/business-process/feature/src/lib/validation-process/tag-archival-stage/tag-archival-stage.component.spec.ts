import { render, screen, waitFor } from "@testing-library/angular";
import { of } from "rxjs";
import { MockComponent, ngMocks } from "ng-mocks";
import { ValidationProcessTagArchivalStageComponent } from "./tag-archival-stage.component";
import {
  JiraDetailsService,
  type ValidationProcessCreateBranchStage,
  type ValidationProcessExecuteQualityGateStage,
  type ValidationProcessExecution,
  type ValidationProcessIntegrateFixesStage,
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
  type ValidationProcessTagArchivalStage,
} from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { ValidationProcessArchivalUserStoriesComponent } from "@mxevolve/domains/business-process/widget";
import { ValidationProceedToNextStepComponent } from "@mxevolve/domains/business-process/composite-widget";
import { FinalProductDetailsComponent } from "@mxevolve/domains/artifact/widget";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import {
  CommitIdDisplayComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { Message } from "primeng/message";
import { Divider } from "primeng/divider";

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockFeatureFlagResolver = {
  isFeatureEnabled: jest.fn().mockResolvedValue(false),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const mockJiraDetailsService = {
  getJiraDetails: jest.fn().mockReturnValue(
    of({
      projectId: "project-1",
      jiraProjectId: "JP",
      jiraBaseUrl: "https://jira.example.com",
    })
  ),
};

const mockFinalProductApiService = {
  getFinalProductById: jest.fn().mockReturnValue(
    of({
      id: "fp-1",
      projectId: "project-1",
      branch: "Main-Test",
      repositoryId: "repo-1",
      version: "v1",
      configurationCommitId: "5600aca8c8aa",
      state: "available",
      createdOn: "2024-01-01T00:00:00Z",
    })
  ),
};

function buildExecution(
  tagStatus: ValidationProcessStageStatus = ValidationProcessStageStatus.PENDING_INPUT,
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
      status: tagStatus,
      configTagName: "config-tag",
      configCommitId: "config-commit",
      rtpTagName: "rtp-tag",
      rtpCommitId: "rtp-commit",
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
      status: ValidationProcessStageStatus.NOT_STARTED,
      latestMergeJobId: "",
      stopActionMaker: "",
      skipActionMaker: "",
      finalProductPublishing: { id: "", publishingStartDate: "" },
      startDate: "",
      endDate: "",
      errorMessage: "",
      route: "integrate-fixes",
    } as unknown as ValidationProcessIntegrateFixesStage,
    ...overrides,
  } as unknown as ValidationProcessExecution;
}

async function renderTagArchivalStage(execution: ValidationProcessExecution) {
  return render(ValidationProcessTagArchivalStageComponent, {
    componentImports: [
      StageContainerComponent,
      BusinessProcessContentContainerComponent,
      ValidationProcessArchivalUserStoriesComponent,
      MockComponent(ValidationProceedToNextStepComponent),
      FinalProductDetailsComponent,
      CommitIdDisplayComponent,
      Message,
      Divider,
    ],
    inputs: { execution },
    providers: [
      {
        provide: ValidationProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      {
        provide: FeatureFlagResolver,
        useValue: mockFeatureFlagResolver,
      },
      {
        provide: JiraDetailsService,
        useValue: mockJiraDetailsService,
      },
      {
        provide: FinalProductApiService,
        useValue: mockFinalProductApiService,
      },
      {
        provide: ToastMessageService,
        useValue: mockToastMessageService,
      },
    ],
  });
}

describe("ValidationProcessTagArchivalStageComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
  });

  // BC 2.1: areActionsDisabled = !(status === PENDING_INPUT)
  describe("BC 2.1 — actions disabled gate", () => {
    it("renders the proceed action with the stage status when PENDING_INPUT", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderTagArchivalStage(execution);

      await waitFor(() => {
        const proceed = ngMocks.find(
          fixture,
          ValidationProceedToNextStepComponent
        );
        expect(ngMocks.input(proceed, "stageStatus")).toBe(
          ValidationProcessStageStatus.PENDING_INPUT
        );
      });
    });

    it("hides the proceed action when status is RUNNING", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.RUNNING);
      const { fixture } = await renderTagArchivalStage(execution);

      // proceed action visible only when PENDING_INPUT or archivalUserStoriesUpdateStatus.startDate
      await waitFor(() => {
        expect(
          ngMocks.findAll(fixture, ValidationProceedToNextStepComponent).length
        ).toBe(0);
      });
    });

    it("hides the proceed action when status is NOT_STARTED", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.NOT_STARTED
      );
      const { fixture } = await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          ngMocks.findAll(fixture, ValidationProceedToNextStepComponent).length
        ).toBe(0);
      });
    });
  });

  // BC 2.3: user-stories archival visibility
  describe("BC 2.3 — user-stories archival section", () => {
    it("hides user-stories archival section when feature flag is disabled", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.queryByText("User Story Archival")).toBeNull();
      });
    });

    it("hides user-stories archival when flag enabled but quality level is not MQG", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          input: {
            repositoryId: "repo-1",
            createBranch: true,
            archivalBranchName: "archival-branch",
            parentBranch: "main",
            scenarioDefinitionIds: [],
            businessProcessQualityLevel: "DQG",
            finalProductId: "fp-1",
            qualityGateExecutionInfraGroupId: "infra-1",
            configCommitId: "config-commit-1",
            rtpCommitId: "rtp-commit-1",
            nightlyRepusherEnabled: false,
          },
        }
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.queryByText("User Story Archival")).toBeNull();
      });
    });

    it("hides user-stories archival when flag enabled + MQG but not OFFICIAL", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          officiality: "UNOFFICIAL",
        }
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.queryByText("User Story Archival")).toBeNull();
      });
    });

    it("shows user-stories archival when flag enabled + MQG + OFFICIAL (BC 2.3 + 3.1)", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          tagArchivalBranchStage: {
            name: "Tag Archival",
            status: ValidationProcessStageStatus.PENDING_INPUT,
            configTagName: "config-tag",
            configCommitId: "config-commit",
            rtpTagName: "rtp-tag",
            rtpCommitId: "rtp-commit",
            promotedFinalProductId: "",
            promotionSuccessful: false,
            promotionErrorMessage: "",
            archivalUserStoriesUpdateStatus: {
              facedTechnicalIssues: false,
              result: [],
            },
            startDate: "",
            endDate: "",
            errorMessage: "",
            route: "tag-archival",
          } as unknown as ValidationProcessTagArchivalStage,
        }
      );
      // default execution is MQG + OFFICIAL + flag enabled
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.getByText("User Story Archival")).toBeTruthy();
      });
    });
  });

  // BC 2.4: tag-in-progress banner
  describe("BC 2.4 — tag-in-progress banner", () => {
    it("shows tag-in-progress banner when RUNNING and no archival startDate", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.RUNNING);
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          screen.getByText(/currently tagging the configuration/)
        ).toBeTruthy();
      });
    });

    it("does NOT show tag-in-progress banner when RUNNING but archival startDate exists", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.RUNNING, {
        tagArchivalBranchStage: {
          name: "Tag Archival",
          status: ValidationProcessStageStatus.RUNNING,
          configTagName: "config-tag",
          configCommitId: "config-commit",
          rtpTagName: "rtp-tag",
          rtpCommitId: "rtp-commit",
          promotedFinalProductId: "",
          promotionSuccessful: false,
          promotionErrorMessage: "",
          archivalUserStoriesUpdateStatus: { startDate: "2024-01-01" },
          startDate: "",
          endDate: "",
          errorMessage: "",
          route: "tag-archival",
        } as unknown as ValidationProcessTagArchivalStage,
      });
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          screen.queryByText(/currently tagging the configuration/)
        ).toBeNull();
      });
    });

    it("does NOT show tag-in-progress banner when PENDING_INPUT", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          screen.queryByText(/currently tagging the configuration/)
        ).toBeNull();
      });
    });
  });

  // BC 2.5: proceed button visibility
  describe("BC 2.5 — proceed button visibility", () => {
    it("shows proceed action when status is PENDING_INPUT", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      const { fixture } = await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          ngMocks.find(fixture, ValidationProceedToNextStepComponent)
        ).toBeTruthy();
      });
    });

    it("shows proceed action when archivalUserStoriesUpdateStatus.startDate exists (even if not PENDING_INPUT)", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.RUNNING, {
        tagArchivalBranchStage: {
          name: "Tag Archival",
          status: ValidationProcessStageStatus.RUNNING,
          configTagName: "",
          configCommitId: "",
          rtpTagName: "",
          rtpCommitId: "",
          promotedFinalProductId: "",
          promotionSuccessful: false,
          promotionErrorMessage: "",
          archivalUserStoriesUpdateStatus: { startDate: "2024-01-01" },
          startDate: "",
          endDate: "",
          errorMessage: "",
          route: "tag-archival",
        } as unknown as ValidationProcessTagArchivalStage,
      });
      const { fixture } = await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          ngMocks.find(fixture, ValidationProceedToNextStepComponent)
        ).toBeTruthy();
      });
    });

    it("hides proceed action when NOT PENDING_INPUT and no archivalUserStoriesUpdateStatus.startDate", async () => {
      const execution = buildExecution(ValidationProcessStageStatus.PASSED);
      const { fixture } = await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(
          ngMocks.findAll(fixture, ValidationProceedToNextStepComponent).length
        ).toBe(0);
      });
    });
  });

  // BC 2.2: promoted final product section
  describe("BC 2.2 — promoted final product section", () => {
    it("shows promoted final product section when input.finalProductId is present", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.getByText("Promoted Final Product")).toBeTruthy();
      });
    });

    it("hides promoted final product section when input.finalProductId is empty", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          input: {
            repositoryId: "repo-1",
            createBranch: true,
            archivalBranchName: "archival-branch",
            parentBranch: "main",
            scenarioDefinitionIds: [],
            businessProcessQualityLevel: "MQG",
            finalProductId: "",
            qualityGateExecutionInfraGroupId: "infra-1",
            configCommitId: "config-commit-1",
            rtpCommitId: "rtp-commit-1",
            nightlyRepusherEnabled: false,
          },
        }
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.queryByText("Promoted Final Product")).toBeNull();
      });
    });

    it("shows the promotion error message instead of details when promotionErrorMessage is set", async () => {
      const execution = buildExecution(
        ValidationProcessStageStatus.PENDING_INPUT,
        {
          tagArchivalBranchStage: {
            name: "Tag Archival",
            status: ValidationProcessStageStatus.PENDING_INPUT,
            configTagName: "config-tag",
            configCommitId: "config-commit",
            rtpTagName: "rtp-tag",
            rtpCommitId: "rtp-commit",
            promotedFinalProductId: "fp-1",
            promotionSuccessful: false,
            promotionErrorMessage: "Promotion failed badly",
            archivalUserStoriesUpdateStatus: undefined,
            startDate: "",
            endDate: "",
            errorMessage: "",
            route: "tag-archival",
          } as unknown as ValidationProcessTagArchivalStage,
        }
      );
      await renderTagArchivalStage(execution);

      await waitFor(() => {
        expect(screen.getByText("Promotion failed badly")).toBeTruthy();
      });
    });
  });
});
