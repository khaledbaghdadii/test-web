import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { FinalProductDetailsComponent } from "@mxevolve/domains/artifact/widget";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import {
  BuildAndTestProcessExecution,
  CherryPickStatus,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { DevelopmentDetailsComponent } from "@mxevolve/domains/scm/composite-widget";
import {
  DevelopmentService,
  MergeConfigurationService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { BuildAndTestBackportExecutionsSummaryComponent } from "./build-and-test-backport-executions-summary.component";
import { BuildAndTestMergeStageComponent } from "./build-and-test-merge-stage.component";
import { BuildAndTestSendForReviewComponent } from "./build-and-test-send-for-review.component";
import { BuildAndTestLegacyBackportChangesComponent } from "./legacy/build-and-test-legacy-backport-changes.component";

describe("BuildAndTestMergeStageComponent", () => {
  const userInputService = {
    reopenMergeRequest: jest.fn(),
    fixIntegrationIssues: jest.fn(),
  };
  const stateUpdater = {
    reloadProcessDetails: jest.fn(),
  };
  const mergeRequestService = {
    getMergeRequestById: jest.fn(),
  };
  const developmentService = {
    getDevelopment: jest.fn(),
  };
  const mergeConfigurationService = {
    getFilteredMergeConfigurations: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    userInputService.reopenMergeRequest.mockReturnValue(of(undefined));
    userInputService.fixIntegrationIssues.mockReturnValue(of(undefined));
    mergeRequestService.getMergeRequestById.mockReturnValue(
      of({
        id: "merge-job-1",
        pullRequestId: "1234",
        destinationBranch: "master",
        isReOpenable: false,
      })
    );
    developmentService.getDevelopment.mockReturnValue(
      of({
        id: "development-1",
        name: "VAL-1",
        repository: { id: "repository-1" },
      })
    );
    mergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
      of({
        content: [{ id: "config-1", branchName: "support/1" }],
      })
    );
  });

  it("renders merge request stepper and final product details", async () => {
    await renderComponent();

    expect(screen.getByText("Merge")).toBeInTheDocument();
    const stepper = document.querySelector("mxevolve-merge-request-stepper");
    expect(stepper).toBeTruthy();
    expect(document.querySelector("mxevolve-final-product-details")).toBeTruthy();
  });

  it("does not render final product details when the publishing object is absent", async () => {
    await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        willPublishFinalProduct: true,
        finalProductPublishing: undefined,
      },
    });

    expect(document.querySelector("mxevolve-final-product-details")).toBeNull();
  });

  it("opens the send for review modal from the Create MR action", async () => {
    const { fixture } = await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        latestMergeJobId: undefined,
        status: StageStatus.PENDING_INPUT,
      },
    });

    await userEvent.click(screen.getByText("Create a New Merge Request"));

    const sendForReview = ngMocks.find(
      fixture,
      BuildAndTestSendForReviewComponent
    );
    expect(sendForReview).toBeTruthy();
    expect(sendForReview.componentInstance.visible()).toBe(true);
  });

  it("reopens merge request when the fetched merge request is reopenable", async () => {
    mergeRequestService.getMergeRequestById.mockReturnValue(
      of({ id: "merge-job-1", pullRequestId: "1234", isReOpenable: true })
    );

    await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        status: StageStatus.PENDING_INPUT,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Reopen Merge Request")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Reopen Merge Request"));

    expect(userInputService.reopenMergeRequest).toHaveBeenCalledWith({
      projectId: "project-1",
      processId: "process-1",
    });
    expect(stateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      "process-1",
      "project-1"
    );
  });

  it("renders v2 backports summary tab", async () => {
    await renderComponent({
      ciVersion: 2,
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        backportRequested: true,
        backportExecutions: ["exec-1"],
        failedBackportDefinitions: ["definition-1"],
      },
    });

    expect(screen.getByText("Backports")).toBeInTheDocument();
    expect(
      document.querySelector(
        "mxevolve-build-and-test-backport-executions-summary"
      )
    ).toBeTruthy();
  });

  it("renders v1 legacy backport tabs and disables actions when backport started", async () => {
    await renderComponent({
      ciVersion: 1,
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        status: StageStatus.PENDING_INPUT,
        backportRequested: true,
        backports: [
          {
            mergeConfigurationId: "config-1",
            willPublishFinalProduct: false,
            initializeDevelopmentState: {
              destinationBranchName: "support/1",
              developmentId: "backport-development-1",
            },
            applyBackportDevelopmentState: {
              cherryPickStatus: CherryPickStatus.COMMITS_CHERRY_PICKED,
            },
            mergeDevelopmentState: {
              latestMergeJobId: "backport-merge-job-1",
              canRepush: true,
            },
          },
        ],
      },
    });

    expect(screen.getByText("Backport to support/1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create a New Merge Request" })
    ).toBeDisabled();
  });

  function renderComponent(
    overrides: Partial<BuildAndTestProcessExecution> = {}
  ) {
    return render(BuildAndTestMergeStageComponent, {
      inputs: { execution: { ...baseExecution(), ...overrides } },
      imports: [
        MockComponent(BuildAndTestBackportExecutionsSummaryComponent),
        MockComponent(BuildAndTestLegacyBackportChangesComponent),
        MockComponent(BuildAndTestSendForReviewComponent),
        MockComponent(DevelopmentDetailsComponent),
        MockComponent(FinalProductDetailsComponent),
        MockComponent(MergeRequestStepperComponent),
      ],
      componentProviders: [
        { provide: BuildAndTestUserInputService, useValue: userInputService },
        { provide: BuildAndTestProcessStateUpdaterService, useValue: stateUpdater },
        { provide: MergeRequestService, useValue: mergeRequestService },
        { provide: DevelopmentService, useValue: developmentService },
        { provide: MergeConfigurationService, useValue: mergeConfigurationService },
      ],
    });
  }

  function baseExecution(): BuildAndTestProcessExecution {
    return {
      id: "process-1",
      name: "Build and Test",
      projectId: "project-1",
      definitionId: "definition-1",
      definitionName: "Build and Test",
      familyName: "Build and Test",
      processName: "CI",
      owner: "owner",
      supportsResourceManagement: true,
      hasPredefinedMergeRequestInputs: false,
      ciVersion: 2,
      status: ExecutionStatus.PENDING_INPUT,
      source: { id: "source-1", type: "BUSINESS_PROCESS" as never },
      input: {
        repositoryId: "repository-1",
        configurationBranchName: "VAL-1",
        configurationParentBranch: "master",
        userStoryIds: ["VAL-1"],
        buildAndTestInfraGroup: "infra-1",
        buildEnvironmentInfraGroup: "infra-2",
        buildEnvironment: {
          skipEnvironmentDeployment: false,
          scenarioDefinitionId: "scenario-1",
        },
      },
      createBranchStage: {
        name: "Create Branch",
        route: "create-branch",
        status: StageStatus.PASSED,
        developmentId: "development-1",
      },
      prepareBuildStage: {
        name: "Prepare Setup",
        route: "prepare-build",
        status: StageStatus.PASSED,
      },
      buildAndTestStage: {
        name: "Build & Test",
        route: "build-and-test",
        status: StageStatus.PASSED,
      },
      integrateChangesStage: {
        name: "Merge",
        route: "integrate-changes",
        status: StageStatus.PENDING_INPUT,
        latestMergeJobId: "merge-job-1",
        requester: "requester",
        backportRequested: false,
        willPublishFinalProduct: true,
        finalProductPublishing: {
          id: "final-product-1",
          publishingStartDate: "2026-06-08T12:00:00Z",
        },
        backportExecutions: [],
        failedBackportDefinitions: [],
        backports: [],
      },
    };
  }
});
