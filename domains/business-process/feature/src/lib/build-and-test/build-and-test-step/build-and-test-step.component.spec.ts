import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, Subject, throwError } from "rxjs";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { BuildAndTestStepComponent } from "./build-and-test-step.component";
import { BuildAndTestBuildSectionComponent } from "./build-and-test-build-section/build-and-test-build-section.component";
import { BuildAndTestTestSectionComponent } from "./build-and-test-test-section/build-and-test-test-section.component";
import { BuildAndTestTechnicalReseedSectionComponent } from "./build-and-test-technical-reseed-section/build-and-test-technical-reseed-section.component";
import { BuildAndTestSendForReviewComponent } from "../merge-stage/build-and-test-send-for-review.component";
import { BuildAndTestMergeRequestReopenComponent } from "../merge-request-reopen/build-and-test-merge-request-reopen.component";
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
  StageContainerComponent,
  BusinessProcessContentContainerComponent,
  Button,
  Message,
  Skeleton,
  MockComponent(MxevolveIllustrationComponent),
  MockComponent(BuildAndTestBuildSectionComponent),
  MockComponent(BuildAndTestTestSectionComponent),
  MockComponent(BuildAndTestTechnicalReseedSectionComponent),
  MockComponent(BuildAndTestSendForReviewComponent),
  MockComponent(BuildAndTestMergeRequestReopenComponent),
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
    componentImports: MOCK_IMPORTS,
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
      await renderComponent(buildExecution({ readyForBuildAndTest: false }));

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
      await renderComponent(buildExecution({ readyForBuildAndTest: false }));

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
      await renderComponent(buildExecution({ cherryPickRunning: true }));

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
            "Cherry-pick could not be completed automatically. Please manually cherry-pick your commits to the branch 'feature/temp-branch' and then click 'Merge' to open a merge request."
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

  describe("Build Environment Section", () => {
    it("given the page loaded, when the build and test build env section is being prepared to be rendered, then the project id needed to render the section is resolved and set", async () => {
      const executionDetails = buildExecution();
      const { fixture } = await renderComponent(executionDetails);

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
      });
      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );

      await waitFor(() => {
        expect(ngMocks.input(buildSection, "projectId")).toBe(
          executionDetails.projectId
        );
      });
    });

    it("given the page loaded, when the build and test build env section is being prepared to be rendered, then the process id needed to render the section is resolved and set", async () => {
      const executionDetails = buildExecution();
      const { fixture } = await renderComponent(executionDetails);

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
      });
      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      await waitFor(() => {
        expect(ngMocks.input(buildSection, "processId")).toBe(
          executionDetails.id
        );
      });
    });

    it("given the page loaded, when the build and test build env section is being prepared to be rendered, then the user story ids needed to render the section is resolved and set", async () => {
      const executionDetails = buildExecution();
      const { fixture } = await renderComponent(executionDetails);

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
      });
      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      await waitFor(() => {
        expect(ngMocks.input(buildSection, "storyIds")).toBe(
          executionDetails.input.userStoryIds
        );
      });
    });

    it("given the page loaded, when the build and test build env section is being prepared to be rendered, then the flag signalling merge request predefined inputs needed to render the section is resolved and set", async () => {
      const executionDetails = buildExecution();
      const { fixture } = await renderComponent(executionDetails);

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
      });
      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      await waitFor(() => {
        expect(ngMocks.input(buildSection, "automerge")).toBe(
          executionDetails.hasPredefinedMergeRequestInputs
        );
      });
    });

    it("given the page loaded, when the build and test build env section is being prepared to be rendered, then the development info needed to render the section is resolved and set", async () => {
      const executionDetails = buildExecution();
      const { fixture } = await renderComponent(executionDetails);

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
      });
      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      await waitFor(() => {
        expect(ngMocks.input(buildSection, "development")).toBe(DEVELOPMENT);
      });
    });

    it("when the build env scenario is rerun by the user, then the scenario executions section is reloaded", async () => {
      const executionDetails = buildExecution();
      const { fixture } = await renderComponent(executionDetails);

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy()
      );

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      ngMocks.output(buildSection, "scenarioRerun").emit();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        executionDetails.id,
        executionDetails.projectId
      );
    });

    it.each([
      { status: StageStatus.PENDING_INPUT, expectedDisabled: false },
      { status: StageStatus.RUNNING, expectedDisabled: false },
      { status: StageStatus.NOT_STARTED, expectedDisabled: true },
      { status: StageStatus.PASSED, expectedDisabled: true },
      { status: StageStatus.FAILED, expectedDisabled: true },
      { status: StageStatus.STOPPED, expectedDisabled: true },
      { status: StageStatus.SKIPPED, expectedDisabled: true },
      { status: StageStatus.NA, expectedDisabled: true },
    ])(
      "given the page loaded, when the build and test build env section is being prepared to be rendered, then the legacy scenario details flags is set for backward compatability",
      async ({ status, expectedDisabled }) => {
        const { fixture } = await renderComponent(buildExecution({ status }));

        await waitFor(() =>
          expect(
            document.querySelector("mxevolve-build-and-test-build-section")
          ).toBeTruthy()
        );

        const section = ngMocks.find(
          fixture,
          BuildAndTestBuildSectionComponent
        );
        await waitFor(() => {
          expect(section.componentInstance.scenarioDetailsDisabled).toBe(
            expectedDisabled
          );
        });
      }
    );

    it("given the build environment capability was skipped, when the page is loaded, then the build and test build env section should render regardless", async () => {
      const { fixture } = await renderComponent(
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

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
        expect(ngMocks.input(buildSection, "environmentId")).toBe(undefined);
        expect(
          mockEnvironmentResolver.resolveEnvironment
        ).not.toHaveBeenCalled();
        expect(
          ngMocks.input(buildSection, "showEnvironmentWaitingMessage")
        ).toBe(false);
      });
    });

    it("given the build environment capability was not skipped, when the page is loaded, then the scenario's env info should be resolved from the latest executed scenario", async () => {
      mockEnvironmentResolver.resolveEnvironment.mockReturnValue(
        of({ environmentId: "env-123", environmentStatus: "" })
      );

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

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
        expect(mockEnvironmentResolver.resolveEnvironment).toHaveBeenCalledWith(
          "project-1",
          "scenario-exec-1"
        );
        expect(ngMocks.input(buildSection, "environmentId")).toBe("env-123");
        expect(
          ngMocks.input(buildSection, "showEnvironmentWaitingMessage")
        ).toBe(false);
      });
    });

    it("given the build environment capability was not skipped and the build scenario was not yet run, when the page is loaded, then we should display the build section normally to the user but with no environment waiting message since nothing is being fetched", async () => {
      const execution = {
        ...buildExecution(),
        prepareBuildStage: {
          name: "prepare-build",
          route: "prepare-build",
          status: StageStatus.RUNNING,
          latestScenarioExecutionId: undefined,
        },
      } as BuildAndTestProcessExecution;

      const { fixture } = await renderComponent(execution);

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
        expect(
          mockEnvironmentResolver.resolveEnvironment
        ).not.toHaveBeenCalled();
        expect(
          ngMocks.input(buildSection, "showEnvironmentWaitingMessage")
        ).toBe(false);
      });
    });

    it("given the build environment capability was not skipped and the build scenario has indeed run, when still resolving its the build scenario's env id, then we should display the build section normally to the user but with a message that we are still waiting for the env info to be resolved", async () => {
      const pending$ = new Subject<{
        environmentId: string;
        environmentStatus: string;
      }>();
      mockEnvironmentResolver.resolveEnvironment.mockReturnValue(
        pending$.asObservable()
      );

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

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );
      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
        expect(mockEnvironmentResolver.resolveEnvironment).toHaveBeenCalled();
        expect(
          ngMocks.input(buildSection, "showEnvironmentWaitingMessage")
        ).toBe(true);
        expect(ngMocks.input(buildSection, "environmentId")).toBe(undefined);
      });
    });

    it("given the build environment capability was not skipped and the build scenario has indeed run, when the scenario's environment resolution fails, then the build section is still displayed to the user but with no env info and an error toast", async () => {
      mockEnvironmentResolver.resolveEnvironment.mockReturnValue(
        throwError(() => new Error("Unable to resolve environment"))
      );

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

      const buildSection = ngMocks.find(
        fixture,
        BuildAndTestBuildSectionComponent
      );

      await waitFor(() => {
        expect(mockEnvironmentResolver.resolveEnvironment).toHaveBeenCalled();
        expect(
          document.querySelector("mxevolve-build-and-test-build-section")
        ).toBeTruthy();
        expect(ngMocks.input(buildSection, "environmentId")).toBeUndefined();
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Unable to resolve environment"
        );
      });
    });
  });

  describe("Run & View Scenario Executions Section", () => {
    it("given the page loaded, when the build and test scenario section is being prepared to be rendered, then all needed info to render the section are resolved and set", async () => {
      const execution = buildExecution();
      const { fixture } = await renderComponent(execution);

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-test-section")
        ).toBeTruthy();
        expect(mockDevelopmentService.getDevelopment).toHaveBeenCalledWith(
          "project-1",
          "development-1",
          true
        );
      });

      const testSection = ngMocks.find(
        fixture,
        BuildAndTestTestSectionComponent
      );
      await waitFor(() => {
        expect(ngMocks.input(testSection, "projectId")).toBe(
          execution.projectId
        );
        expect(ngMocks.input(testSection, "processId")).toBe(execution.id);
        expect(ngMocks.input(testSection, "development")).toBe(DEVELOPMENT);
        expect(ngMocks.input(testSection, "executionGroupId")).toBe(
          execution.buildAndTestStage.scenarioExecutionGroup
        );
        expect(ngMocks.input(testSection, "machineGroupId")).toBe(
          execution.input.buildAndTestInfraGroup
        );
      });
    });

    it("given we were not able to fetch the development info, when the page is loaded, then the test section still renders while a toast is shown to the user", async () => {
      mockDevelopmentService.getDevelopment.mockReturnValue(
        throwError(() => new Error("error"))
      );

      const { fixture } = await renderComponent(buildExecution());

      const testSection = ngMocks.find(
        fixture,
        BuildAndTestTestSectionComponent
      );

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-build-and-test-test-section")
        ).toBeTruthy();
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Unable to retrieve branch-related information due to a technical issue. As a result, launching scenarios is currently unavailable."
        );
        expect(ngMocks.input(testSection, "development")).toBeUndefined();
      });
    });
  });

  describe("Technical Reseed Section", () => {
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
      expect(reseedSection.componentInstance.infraGroup).toBe("test-env-infra");
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

  describe("send for review action", () => {
    it("renders the legacy Create New Merge Request action at the bottom of Build and Test", async () => {
      await renderComponent(buildExecution());

      await waitFor(() => expect(screen.getByText("Merge")).toBeTruthy());
    });

    it("opens the send for review dialog from the Build and Test action", async () => {
      const { fixture } = await renderComponent(buildExecution());

      await userEvent.click(screen.getByText("Merge"));

      const sendForReview = ngMocks.find(
        fixture,
        BuildAndTestSendForReviewComponent
      );
      expect(ngMocks.input(sendForReview, "visible")).toBe(true);
    });

    it("disables the send for review action when the Build and Test stage is not pending input", async () => {
      await renderComponent(buildExecution({ status: StageStatus.RUNNING }));

      const action = await screen.findByText("Merge");
      expect(action.closest("button")).toBeDisabled();
    });

    it("shows the reopen action when an existing merge request is reopenable", async () => {
      mockMergeRequestService.getMergeRequestById.mockReturnValue(
        of({ id: "merge-job-1", isReOpenable: true, destinationBranch: "main" })
      );

      const { fixture } = await renderComponent({
        ...buildExecution(),
        integrateChangesStage: {
          name: "integrate-changes",
          route: "integrate-changes",
          status: StageStatus.NOT_STARTED,
          latestMergeJobId: "merge-job-1",
        },
      } as BuildAndTestProcessExecution);

      await waitFor(() =>
        expect(
          ngMocks.find(fixture, BuildAndTestMergeRequestReopenComponent)
        ).toBeTruthy()
      );
    });

    it("reloads the execution when the reopen component reports success", async () => {
      mockMergeRequestService.getMergeRequestById.mockReturnValue(
        of({ id: "merge-job-1", isReOpenable: true, destinationBranch: "main" })
      );

      const { fixture } = await renderComponent({
        ...buildExecution(),
        integrateChangesStage: {
          name: "integrate-changes",
          route: "integrate-changes",
          status: StageStatus.NOT_STARTED,
          latestMergeJobId: "merge-job-1",
        },
      } as BuildAndTestProcessExecution);

      const reopen = await waitFor(() =>
        ngMocks.find(fixture, BuildAndTestMergeRequestReopenComponent)
      );
      expect(ngMocks.input(reopen, "areMergeRequestDetailsEditable")).toBe(
        true
      );

      ngMocks.output(reopen, "reopened").emit();

      expect(mockStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        "execution-1",
        "project-1"
      );
    });

    it("shows the process advancement banner in blue/info style when the stage passed", async () => {
      const { fixture } = await renderComponent(
        buildExecution({
          status: StageStatus.PASSED,
          requester: "reviewer-1",
        })
      );

      await waitFor(() =>
        expect(
          screen.getByText("The process was advanced by reviewer-1")
        ).toBeTruthy()
      );
      const message = ngMocks.find(fixture, Message);
      expect(ngMocks.input(message, "severity")).toBe("info");
    });

    it("keeps the legacy decision result wording for non-passed statuses", async () => {
      await renderComponent(
        buildExecution({
          status: StageStatus.STOPPED,
          requester: "reviewer-1",
        })
      );

      await waitFor(() =>
        expect(screen.getByText("Stopped by reviewer-1")).toBeTruthy()
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
