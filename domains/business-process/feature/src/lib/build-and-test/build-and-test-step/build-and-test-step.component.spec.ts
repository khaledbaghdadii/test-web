import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { BuildAndTestStepComponent } from "./build-and-test-step.component";
import { BuildAndTestBuildSectionComponent } from "./build-and-test-build-section/build-and-test-build-section.component";
import { BuildAndTestTestSectionComponent } from "./build-and-test-test-section/build-and-test-test-section.component";
import { BuildAndTestTechnicalReseedSectionComponent } from "./build-and-test-technical-reseed-section/build-and-test-technical-reseed-section.component";
import { BuildAndTestSendForReviewComponent } from "../merge-stage/build-and-test-send-for-review.component";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestEnvironmentResolverService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import {
  Development,
  DevelopmentService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import {
  BuildAndTestProcessExecution,
  BuildAndTestSourceType,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(MxevolveIllustrationComponent),
  MockComponent(BuildAndTestBuildSectionComponent),
  MockComponent(BuildAndTestTestSectionComponent),
  MockComponent(BuildAndTestTechnicalReseedSectionComponent),
  MockComponent(BuildAndTestSendForReviewComponent),
];

const mockStateUpdater = {
  reloadProcessDetails: jest.fn(),
};

const mockEnvironmentResolver = {
  resolveEnvironment: jest.fn(() =>
    of({ environmentId: "", environmentStatus: "" })
  ),
};

const DEVELOPMENT: Development = {
  id: "development-1",
  name: "feature/temp-branch",
  source: "main",
  projectId: "project-1",
  repository: { id: "repo-1", url: "https://git.example/repo.git" },
  latestCommitId: "head-commit",
  createdOn: "2026-01-01T00:00:00Z",
  parentCommitId: "parent-commit",
  deleted: false,
};

const mockDevelopmentService = {
  getDevelopment: jest.fn(() => of(DEVELOPMENT)),
};

const mockMergeRequestService = {
  getMergeRequestById: jest.fn(() =>
    of({ id: "merge-job-1", isReOpenable: false })
  ),
};

const mockUserInputService = {
  reopenMergeRequest: jest.fn(() => of({})),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

function buildStage(
  overrides: Partial<BuildAndTestProcessExecution["buildAndTestStage"]> = {}
): BuildAndTestProcessExecution["buildAndTestStage"] {
  return {
    name: "build-and-test",
    route: "build-and-test",
    status: StageStatus.PENDING_INPUT,
    readyForBuildAndTest: true,
    cherryPickRunning: false,
    cherryPickFailed: false,
    ...overrides,
  } as BuildAndTestProcessExecution["buildAndTestStage"];
}

function buildExecution(
  buildAndTestStageOverrides: Partial<
    BuildAndTestProcessExecution["buildAndTestStage"]
  > = {},
  inputOverrides: Partial<BuildAndTestProcessExecution["input"]> = {}
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
      configurationBranchName: "feature/temp-branch",
      configurationParentBranch: "main",
      userStoryIds: ["US-1"],
      buildAndTestInfraGroup: "test-env-infra",
      buildEnvironmentInfraGroup: "build-env-infra",
      buildEnvironment: {
        skipEnvironmentDeployment: false,
        scenarioDefinitionId: "scenario-1",
      },
      ...inputOverrides,
    },
    createBranchStage: {
      name: "create-branch",
      route: "create-branch",
      status: StageStatus.PASSED,
      developmentId: "development-1",
    },
    prepareBuildStage: {
      name: "prepare-build",
      route: "prepare-build",
      status: StageStatus.PASSED,
    },
    buildAndTestStage: buildStage(buildAndTestStageOverrides),
    integrateChangesStage: {
      name: "integrate-changes",
      route: "integrate-changes",
      status: StageStatus.NOT_STARTED,
    },
  } as BuildAndTestProcessExecution;
}

async function renderComponent(execution: BuildAndTestProcessExecution) {
  return render(BuildAndTestStepComponent, {
    imports: MOCK_IMPORTS,
    inputs: { execution, stageStatus: "active" },
    componentProviders: [
      {
        provide: BuildAndTestProcessStateUpdaterService,
        useValue: mockStateUpdater,
      },
      {
        provide: BuildAndTestEnvironmentResolverService,
        useValue: mockEnvironmentResolver,
      },
      {
        provide: DevelopmentService,
        useValue: mockDevelopmentService,
      },
      {
        provide: MergeRequestService,
        useValue: mockMergeRequestService,
      },
      {
        provide: BuildAndTestUserInputService,
        useValue: mockUserInputService,
      },
      {
        provide: ToastMessageService,
        useValue: mockToastMessageService,
      },
    ],
  });
}

describe("BuildAndTestStepComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevelopmentService.getDevelopment.mockReturnValue(of(DEVELOPMENT));
    mockMergeRequestService.getMergeRequestById.mockReturnValue(
      of({ id: "merge-job-1", isReOpenable: false })
    );
    mockUserInputService.reopenMergeRequest.mockReturnValue(of({}));
    mockEnvironmentResolver.resolveEnvironment.mockReturnValue(
      of({ environmentId: "", environmentStatus: "" })
    );
  });

  describe("error state", () => {
    it("renders the error alert when the stage has an error message", async () => {
      await renderComponent(
        buildExecution({ errorMessage: "Build failed badly" })
      );

      await waitFor(() =>
        expect(screen.getByText("Build failed badly")).toBeTruthy()
      );
    });

    it("hides the loading illustration when there is an error", async () => {
      await renderComponent(
        buildExecution({
          errorMessage: "Build failed badly",
          readyForBuildAndTest: false,
        })
      );

      await waitFor(() =>
        expect(screen.getByText("Build failed badly")).toBeTruthy()
      );
      expect(document.querySelector("mxevolve-illustration")).toBeNull();
    });
  });

  describe("loading state", () => {
    it("renders the loading illustration when not ready for build and test", async () => {
      await renderComponent(
        buildExecution({ readyForBuildAndTest: false })
      );

      await waitFor(() =>
        expect(document.querySelector("mxevolve-illustration")).toBeTruthy()
      );
      expect(
        screen.getByText(
          "The step is currently loading. Please refresh the page for the latest updates."
        )
      ).toBeTruthy();
    });

    it("hides the panels while loading", async () => {
      await renderComponent(
        buildExecution({ readyForBuildAndTest: false })
      );

      await waitFor(() =>
        expect(document.querySelector("mxevolve-illustration")).toBeTruthy()
      );
      expect(
        document.querySelector("mxevolve-build-and-test-build-section")
      ).toBeNull();
      expect(
        document.querySelector("mxevolve-build-and-test-test-section")
      ).toBeNull();
    });
  });

  describe("cherry-pick alert", () => {
    it("renders the cherry-pick running alert with the legacy text", async () => {
      await renderComponent(
        buildExecution({ cherryPickRunning: true })
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            "Automatic cherry picking is in progress. Please refresh the page for the latest update."
          )
        ).toBeTruthy()
      );
    });

    it("renders the cherry-pick failed alert with the legacy text and branch name", async () => {
      await renderComponent(
        buildExecution({ cherryPickRunning: false, cherryPickFailed: true })
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            "Cherry-pick could not be completed automatically. Please manually cherry-pick your commits to the branch 'feature/temp-branch' and then click 'Proceed to the Next Step' to open a merge request."
          )
        ).toBeTruthy()
      );
    });

    it("does not render any cherry-pick alert when both flags are false", async () => {
      await renderComponent(buildExecution());

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );
      expect(
        screen.queryByText(/Automatic cherry picking is in progress/)
      ).toBeNull();
      expect(
        screen.queryByText(/Cherry-pick could not be completed automatically/)
      ).toBeNull();
    });
  });

  describe("panels (ready state)", () => {
    it("renders the build and test sections when ready", async () => {
      await renderComponent(buildExecution());

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );
      expect(
        document.querySelector("mxevolve-build-and-test-test-section")
      ).toBeTruthy();
    });

    it("loads development details and passes them to the Build and Test panels", async () => {
      const { fixture } = await renderComponent(
        buildExecution({ scenarioExecutionGroup: "scenario-group-1" })
      );

      await waitFor(() =>
        expect(mockDevelopmentService.getDevelopment).toHaveBeenCalledWith(
          "project-1",
          "development-1",
          true
        )
      );

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      const testSection = ngMocks.find(
        fixture,
        BuildAndTestTestSectionComponent
      );

      expect(buildSection.componentInstance.development).toEqual(DEVELOPMENT);
      expect(testSection.componentInstance.branchName).toBe(
        "feature/temp-branch"
      );
      expect(testSection.componentInstance.executionGroupId).toBe(
        "scenario-group-1"
      );
      expect(testSection.componentInstance.machineGroupId).toBe(
        "test-env-infra"
      );
    });

    it("passes legacy user-intervention disabled state to the Build details action", async () => {
      const { fixture } = await renderComponent(
        buildExecution({ status: StageStatus.PASSED })
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      expect(buildSection.componentInstance.scenarioDetailsDisabled).toBe(true);
    });

    it("renders the build section regardless of environment deployment being skipped", async () => {
      await renderComponent(
        buildExecution(
          {},
          {
            buildEnvironment: {
              skipEnvironmentDeployment: true,
              scenarioDefinitionId: "scenario-1",
            },
          }
        )
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );
    });

    it("shows the technical reseed section only when a reseed execution group is present", async () => {
      const { fixture } = await renderComponent(
        buildExecution({ technicalReseedExecutionGroupId: "reseed-group-1" })
      );

      await waitFor(() =>
        expect(
          document.querySelector(
            "mxevolve-build-and-test-technical-reseed-section"
          )
        ).toBeTruthy()
      );

      const reseedSection = ngMocks.find(
        fixture,
        BuildAndTestTechnicalReseedSectionComponent
      );
      expect(reseedSection.componentInstance.executionGroupId).toBe(
        "reseed-group-1"
      );
      expect(reseedSection.componentInstance.infraGroup).toBe(
        "test-env-infra"
      );
      expect(reseedSection.componentInstance.targetBranch).toBe(
        "feature/temp-branch"
      );
    });

    it("hides the technical reseed section when there is no reseed execution group", async () => {
      await renderComponent(buildExecution());

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );
      expect(
        document.querySelector(
          "mxevolve-build-and-test-technical-reseed-section"
        )
      ).toBeNull();
    });
  });

  describe("environment resolution", () => {
    it("resolves the environment from the prepare-build latest scenario execution", async () => {
      const execution = {
        ...buildExecution(),
        prepareBuildStage: {
          name: "prepare-build",
          route: "prepare-build",
          status: StageStatus.PASSED,
          latestScenarioExecutionId: "scenario-exec-1",
        },
      } as BuildAndTestProcessExecution;

      await renderComponent(execution);

      await waitFor(() =>
        expect(mockEnvironmentResolver.resolveEnvironment).toHaveBeenCalledWith(
          "project-1",
          "scenario-exec-1"
        )
      );
    });

    it("does not resolve an environment when there is no deploy scenario", async () => {
      await renderComponent(buildExecution());

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );
      expect(mockEnvironmentResolver.resolveEnvironment).not.toHaveBeenCalled();
    });

    it("passes the legacy waiting message flag while the environment id is unavailable", async () => {
      const execution = {
        ...buildExecution(),
        prepareBuildStage: {
          name: "prepare-build",
          route: "prepare-build",
          status: StageStatus.PASSED,
          latestScenarioExecutionId: "scenario-exec-1",
        },
      } as BuildAndTestProcessExecution;
      const { fixture } = await renderComponent(execution);

      await waitFor(() =>
        expect(mockEnvironmentResolver.resolveEnvironment).toHaveBeenCalled()
      );

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      expect(buildSection.componentInstance.showEnvironmentWaitingMessage).toBe(
        true
      );
    });

    it("renders the error alert when environment resolution fails", async () => {
      const execution = {
        ...buildExecution(),
        prepareBuildStage: {
          name: "prepare-build",
          route: "prepare-build",
          status: StageStatus.PASSED,
          latestScenarioExecutionId: "scenario-exec-1",
        },
      } as BuildAndTestProcessExecution;
      mockEnvironmentResolver.resolveEnvironment.mockReturnValue(
        throwError(() => new Error("Unable to resolve environment"))
      );

      await renderComponent(execution);

      await waitFor(() =>
        expect(screen.getByText("Unable to resolve environment")).toBeTruthy()
      );
      expect(
        document.querySelector("mxevolve-build-and-test-build-section")
      ).toBeNull();
    });
  });

  describe("send for review action", () => {
    it("renders the legacy Create New Merge Request action at the bottom of Build and Test", async () => {
      await renderComponent(buildExecution());

      await waitFor(() =>
        expect(screen.getByText("Create New Merge Request")).toBeTruthy()
      );
    });

    it("opens the send for review dialog from the Build and Test action", async () => {
      const { fixture } = await renderComponent(buildExecution());

      await userEvent.click(screen.getByText("Create New Merge Request"));

      const sendForReview = ngMocks.find(
        fixture,
        BuildAndTestSendForReviewComponent
      );
      expect(sendForReview.componentInstance.visible()).toBe(true);
    });

    it("disables the send for review action when the Build and Test stage is not pending input", async () => {
      await renderComponent(buildExecution({ status: StageStatus.RUNNING }));

      const action = await screen.findByText("Create New Merge Request");
      expect(action.closest("button")).toBeDisabled();
    });

    it("shows the legacy reopen action when an existing merge request is reopenable", async () => {
      mockMergeRequestService.getMergeRequestById.mockReturnValue(
        of({ id: "merge-job-1", isReOpenable: true })
      );

      await renderComponent({
        ...buildExecution(),
        integrateChangesStage: {
          name: "integrate-changes",
          route: "integrate-changes",
          status: StageStatus.NOT_STARTED,
          latestMergeJobId: "merge-job-1",
        },
      } as BuildAndTestProcessExecution);

      await waitFor(() =>
        expect(screen.getByText("Reopen Merge Request")).toBeTruthy()
      );
    });

    it("reopens an existing merge request through the CI user-input endpoint", async () => {
      mockMergeRequestService.getMergeRequestById.mockReturnValue(
        of({ id: "merge-job-1", isReOpenable: true })
      );

      await renderComponent({
        ...buildExecution(),
        integrateChangesStage: {
          name: "integrate-changes",
          route: "integrate-changes",
          status: StageStatus.NOT_STARTED,
          latestMergeJobId: "merge-job-1",
        },
      } as BuildAndTestProcessExecution);

      await waitFor(() =>
        expect(screen.getByText("Reopen Merge Request")).toBeTruthy()
      );
      await userEvent.click(screen.getByText("Reopen Merge Request"));

      expect(mockUserInputService.reopenMergeRequest).toHaveBeenCalledWith({
        projectId: "project-1",
        processId: "execution-1",
      });
      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        "execution-1",
        "project-1"
      );
    });

    it("renders the legacy decision result requester when a decision is made", async () => {
      await renderComponent(
        buildExecution({
          status: StageStatus.PASSED,
          requester: "reviewer-1",
        })
      );

      await waitFor(() =>
        expect(screen.getByText("Passed by reviewer-1")).toBeTruthy()
      );
    });

    it("reloads the execution when the merge request is created", async () => {
      const { fixture } = await renderComponent(buildExecution());
      const sendForReview = ngMocks.find(
        fixture,
        BuildAndTestSendForReviewComponent
      );

      sendForReview.componentInstance.mergeRequestCreated.emit();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        "execution-1",
        "project-1"
      );
    });
  });
});
