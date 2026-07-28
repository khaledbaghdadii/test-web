import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { NgTemplateOutlet } from "@angular/common";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { PanelModule } from "primeng/panel";
import { Skeleton } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
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
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  DevelopmentService,
  MergeConfigurationService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { BuildAndTestBackportExecutionsSummaryComponent } from "./build-and-test-backport-executions-summary.component";
import { BuildAndTestMergeStageComponent } from "./build-and-test-merge-stage.component";
import { BuildAndTestMergeRequestReopenComponent } from "../merge-request-reopen/build-and-test-merge-request-reopen.component";
import { BuildAndTestSendForReviewComponent } from "./build-and-test-send-for-review.component";
import { BuildAndTestLegacyBackportChangesComponent } from "./legacy/build-and-test-legacy-backport-changes.component";

const MOCK_IMPORTS = [
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
  Button,
  Message,
  MxevolveIconComponent,
  NgTemplateOutlet,
  PanelModule,
  Skeleton,
  TabsModule,
  MockComponent(BuildAndTestBackportExecutionsSummaryComponent),
  MockComponent(BuildAndTestLegacyBackportChangesComponent),
  MockComponent(BuildAndTestMergeRequestReopenComponent),
  MockComponent(BuildAndTestSendForReviewComponent),
  MockComponent(MergeRequestStepperComponent),
];

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

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
    const { fixture } = await renderComponent();

    expect(screen.getByText("Merge")).toBeInTheDocument();
    const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
    expect(stepper).toBeTruthy();
    expect(ngMocks.input(stepper, "showFinalProduct")).toBe(true);
    expect(ngMocks.input(stepper, "finalProductId")).toBe("final-product-1");
  });

  it("does not render final product details when the publishing object is absent", async () => {
    const { fixture } = await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        willPublishFinalProduct: true,
        finalProductPublishing: undefined,
      },
    });

    const stepper = ngMocks.find(fixture, MergeRequestStepperComponent);
    expect(ngMocks.input(stepper, "showFinalProduct")).toBe(false);
  });

  it("opens the send for review modal from the Create MR action", async () => {
    const { fixture } = await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        latestMergeJobId: undefined,
        status: StageStatus.PENDING_INPUT,
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: "Merge" }));

    const sendForReview = ngMocks.find(
      fixture,
      BuildAndTestSendForReviewComponent
    );
    expect(sendForReview).toBeTruthy();
    expect(ngMocks.input(sendForReview, "visible")).toBe(true);
  });

  it("reopens merge request when the fetched merge request is reopenable", async () => {
    mergeRequestService.getMergeRequestById.mockReturnValue(
      of({ id: "merge-job-1", pullRequestId: "1234", isReOpenable: true })
    );

    const { fixture } = await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        status: StageStatus.PENDING_INPUT,
      },
    });

    const reopen = await waitFor(() =>
      ngMocks.find(fixture, BuildAndTestMergeRequestReopenComponent)
    );
    expect(ngMocks.input(reopen, "areMergeRequestDetailsEditable")).toBe(false);

    ngMocks.output(reopen, "reopened").emit();

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

  it("renders v1 legacy backport tabs and hides actions when backport started", async () => {
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
      screen.queryByRole("button", { name: "Merge" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fix" })
    ).not.toBeInTheDocument();
  });

  it("hides the action buttons when the stage is not awaiting input", async () => {
    await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        status: StageStatus.PASSED,
      },
    });

    expect(
      screen.queryByRole("button", { name: "Merge" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fix" })
    ).not.toBeInTheDocument();
  });

  it("shows the action buttons when the stage is awaiting input", async () => {
    await renderComponent({
      integrateChangesStage: {
        ...baseExecution().integrateChangesStage,
        latestMergeJobId: undefined,
        status: StageStatus.PENDING_INPUT,
      },
    });

    expect(
      await screen.findByRole("button", { name: "Merge" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fix" })).toBeInTheDocument();
  });

  function renderComponent(
    overrides: Partial<BuildAndTestProcessExecution> = {}
  ) {
    return render(BuildAndTestMergeStageComponent, {
      inputs: { execution: { ...baseExecution(), ...overrides } },
      componentImports: MOCK_IMPORTS,
      componentProviders: [
        { provide: BuildAndTestUserInputService, useValue: userInputService },
        {
          provide: BuildAndTestProcessStateUpdaterService,
          useValue: stateUpdater,
        },
        { provide: MergeRequestService, useValue: mergeRequestService },
        { provide: DevelopmentService, useValue: developmentService },
        {
          provide: MergeConfigurationService,
          useValue: mergeConfigurationService,
        },
        { provide: ToastMessageService, useValue: mockToastMessageService },
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
