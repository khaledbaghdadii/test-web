import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { BuildAndTestBuildSectionComponent } from "./build-and-test-build-section.component";
import { EnvironmentStatusPanelComponent } from "@mxevolve/domains/environment/widget";
import {
  Development,
  MergeRequestOverview,
  MergeRequestState,
} from "@mxevolve/domains/scm/data-access";
import { MergeRequestCommitsComponent } from "@mxevolve/domains/scm/widget";
import { BuildEnvironmentScenarioActionsComponent } from "@mxevolve/domains/business-process/widget";
import { JiraDetailsService } from "@mxevolve/domains/business-process/data-access";

const MOCK_IMPORTS = [
  MockComponent(EnvironmentStatusPanelComponent),
  MockComponent(BuildEnvironmentScenarioActionsComponent),
  MockComponent(MergeRequestCommitsComponent),
];

const mockJiraDetailsService = {
  getJiraDetails: jest.fn(),
};

const DEVELOPMENT: Development = {
  id: "dev-001",
  name: "feature/temp-branch",
  source: "main",
  projectId: "proj-001",
  repository: { id: "repo-001", url: "https://git.example/repo.git" },
  latestCommitId: "head-commit",
  createdOn: "2026-01-01T00:00:00Z",
  parentCommitId: "parent-commit",
  deleted: false,
};

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    processId: string;
    storyIds: string[];
    environmentId: string;
    automerge: boolean;
    development: Development;
    mergeRequest: MergeRequestOverview;
    showEnvironmentWaitingMessage: boolean;
    scenarioDetailsDisabled: boolean;
  }> = {},
  jiraBaseUrl = "https://jira.example.com"
) {
  mockJiraDetailsService.getJiraDetails.mockReturnValue(
    of({ projectId: "proj-001", jiraProjectId: "JP", jiraBaseUrl })
  );
  return render(BuildAndTestBuildSectionComponent, {
    imports: MOCK_IMPORTS,
    inputs: { projectId: "proj-001", processId: "proc-001", ...inputs },
    providers: [
      { provide: JiraDetailsService, useValue: mockJiraDetailsService },
    ],
  });
}

describe("BuildAndTestBuildSectionComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Build panel header", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Build")).toBeTruthy());
  });

  describe("story chips", () => {
    it("renders a chip per story id beside the Build title", async () => {
      await renderComponent({ storyIds: ["VAL-125", "VAL-127"] });

      await waitFor(() => expect(screen.getByText("VAL-125")).toBeTruthy());
      expect(screen.getByText("VAL-127")).toBeTruthy();
    });

    it("renders each story chip as a link to its Jira issue", async () => {
      await renderComponent({ storyIds: ["VAL-125"] });

      expect(
        await screen.findByRole("link", { name: "VAL-125" })
      ).toHaveAttribute("href", "https://jira.example.com/browse/VAL-125");
    });

    it("adds spacing between the story chips and the Build title", async () => {
      await renderComponent({ storyIds: ["VAL-125"] });

      expect(await screen.findByRole("link", { name: "VAL-125" })).toHaveClass(
        "ml-4"
      );
    });

    it("shows a tooltip with the Jira issue on the story chip", async () => {
      await renderComponent({ storyIds: ["VAL-125"] });

      expect(
        await screen.findByRole("link", { name: "VAL-125" })
      ).toHaveAttribute("title", "View VAL-125 in Jira");
    });

    it("renders an empty link href when the jira base url is unavailable", async () => {
      await renderComponent({ storyIds: ["VAL-125"] }, "");

      await waitFor(() => expect(screen.getByText("VAL-125")).toBeTruthy());
      const link = document.querySelector("a");
      expect(link).toHaveAttribute("href", "");
    });

    it("does not render any story chips when there are no story ids", async () => {
      await renderComponent({ storyIds: [] });

      await waitFor(() => expect(screen.getByText("Build")).toBeTruthy());
      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  describe("environment bar", () => {
    it("does not render the environment status panel when no environment id is provided", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Build")).toBeTruthy());
      expect(
        document.querySelector("mxevolve-environment-status-panel")
      ).toBeNull();
    });

    it("shows the legacy waiting message while the environment id is unavailable", async () => {
      await renderComponent({ showEnvironmentWaitingMessage: true });

      await waitFor(() =>
        expect(
          screen.getByText(
            "Please wait, we will show you the environment buttons once the deployment starts!"
          )
        ).toBeTruthy()
      );
    });

    it("enables the status panel Open Config Editor action when an environment id is provided", async () => {
      const { fixture } = await renderComponent({ environmentId: "env-001" });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-status-panel")
        ).toBeTruthy()
      );

      const panel = ngMocks.find(fixture, EnvironmentStatusPanelComponent);
      expect(panel.componentInstance.showOpenConfigEditorAction).toBe(true);
    });

    it("disables the status panel Open Config Editor action in automerge mode", async () => {
      const { fixture } = await renderComponent({
        environmentId: "env-001",
        automerge: true,
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-status-panel")
        ).toBeTruthy()
      );

      const panel = ngMocks.find(fixture, EnvironmentStatusPanelComponent);
      expect(panel.componentInstance.showOpenConfigEditorAction).toBe(false);
    });

    it("hides the deployment details row in the build section panel", async () => {
      const { fixture } = await renderComponent({ environmentId: "env-001" });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-status-panel")
        ).toBeTruthy()
      );

      const panel = ngMocks.find(fixture, EnvironmentStatusPanelComponent);
      expect(panel.componentInstance.showDeploymentDetails).toBe(false);
    });
  });

  describe("scenario actions", () => {
    it("projects the build-environment scenario actions when an environment id is available", async () => {
      const { fixture } = await renderComponent({
        environmentId: "env-001",
        processId: "proc-123",
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-environment-scenario-actions")
        ).toBeTruthy()
      );

      const actions = ngMocks.find(
        fixture,
        BuildEnvironmentScenarioActionsComponent
      );
      expect(actions.componentInstance.projectId).toBe("proj-001");
      expect(actions.componentInstance.processId).toBe("proc-123");
    });

    it("forwards the scenario details disabled flag to the scenario actions", async () => {
      const { fixture } = await renderComponent({
        environmentId: "env-001",
        scenarioDetailsDisabled: true,
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-environment-scenario-actions")
        ).toBeTruthy()
      );

      const actions = ngMocks.find(
        fixture,
        BuildEnvironmentScenarioActionsComponent
      );
      expect(actions.componentInstance.scenarioDetailsDisabled).toBe(true);
    });

    it("re-emits the scenario rerun event from the projected actions", async () => {
      mockJiraDetailsService.getJiraDetails.mockReturnValue(
        of({
          projectId: "proj-001",
          jiraProjectId: "JP",
          jiraBaseUrl: "https://jira.example.com",
        })
      );
      const rerunSpy = jest.fn();
      const { fixture } = await render(BuildAndTestBuildSectionComponent, {
        imports: MOCK_IMPORTS,
        inputs: {
          projectId: "proj-001",
          processId: "proc-001",
          environmentId: "env-001",
        },
        on: { scenarioRerun: rerunSpy },
        providers: [
          { provide: JiraDetailsService, useValue: mockJiraDetailsService },
        ],
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-build-environment-scenario-actions")
        ).toBeTruthy()
      );

      const actions = ngMocks.find(
        fixture,
        BuildEnvironmentScenarioActionsComponent
      );
      actions.componentInstance.scenarioRerun.emit();
      expect(rerunSpy).toHaveBeenCalledTimes(1);
    });

    it("does not project the scenario actions without an environment id", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Build")).toBeTruthy());

      expect(
        document.querySelector("mxevolve-build-environment-scenario-actions")
      ).toBeNull();
    });
  });

  describe("commits", () => {
    it("renders the commits table when development details are available", async () => {
      await renderComponent({ development: DEVELOPMENT });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-merge-request-commits")
        ).toBeTruthy()
      );
    });

    it("passes the development details to the commits table", async () => {
      const { fixture } = await renderComponent({ development: DEVELOPMENT });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-merge-request-commits")
        ).toBeTruthy()
      );

      const commits = ngMocks.find(fixture, MergeRequestCommitsComponent);
      expect(commits.componentInstance.development).toEqual(DEVELOPMENT);
    });

    it("enables the commits-behind warning on the commits table", async () => {
      const { fixture } = await renderComponent({ development: DEVELOPMENT });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-merge-request-commits")
        ).toBeTruthy()
      );

      const commits = ngMocks.find(fixture, MergeRequestCommitsComponent);
      expect(commits.componentInstance.showCommitsBehindWarning).toBe(true);
    });

    it("passes the merge request to the commits table", async () => {
      const mergeRequest: MergeRequestOverview = {
        pullRequestId: "pr-1",
        mergeRequestState: MergeRequestState.MERGED,
      };
      const { fixture } = await renderComponent({
        development: DEVELOPMENT,
        mergeRequest,
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-merge-request-commits")
        ).toBeTruthy()
      );

      const commits = ngMocks.find(fixture, MergeRequestCommitsComponent);
      expect(commits.componentInstance.mergeRequest).toEqual(mergeRequest);
    });
  });
});
