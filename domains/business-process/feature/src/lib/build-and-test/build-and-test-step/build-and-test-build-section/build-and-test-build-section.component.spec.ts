import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { BuildAndTestBuildSectionComponent } from "./build-and-test-build-section.component";
import { EnvironmentStatusPanelComponent } from "@mxevolve/domains/environment/widget";
import { Development } from "@mxevolve/domains/scm/data-access";
import { MergeRequestCommitsComponent } from "@mxevolve/domains/scm/widget";

const MOCK_IMPORTS = [
  MockComponent(EnvironmentStatusPanelComponent),
  MockComponent(MergeRequestCommitsComponent),
];

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
    storyIds: string[];
    environmentId: string;
    automerge: boolean;
    development: Development;
    latestScenarioExecutionId: string;
    showEnvironmentWaitingMessage: boolean;
    scenarioDetailsDisabled: boolean;
  }> = {}
) {
  return render(BuildAndTestBuildSectionComponent, {
    imports: MOCK_IMPORTS,
    inputs: { projectId: "proj-001", ...inputs },
  });
}

describe("BuildAndTestBuildSectionComponent", () => {
  it("renders the Build panel header", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Build")).toBeTruthy());
  });

  describe("story chips", () => {
    it("renders a chip per story id", async () => {
      await renderComponent({ storyIds: ["VAL-125", "VAL-127"] });

      await waitFor(() =>
        expect(
          screen.getByText("You are working on the following story")
        ).toBeTruthy()
      );
      expect(screen.getByText("VAL-125")).toBeTruthy();
      expect(screen.getByText("VAL-127")).toBeTruthy();
    });

    it("does not render the story section when there are no story ids", async () => {
      await renderComponent({ storyIds: [] });

      await waitFor(() => expect(screen.getByText("Build")).toBeTruthy());
      expect(
        screen.queryByText("You are working on the following story")
      ).toBeNull();
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
  });

  describe("scenario details action", () => {
    it("renders the scenario details icon link when the latest scenario execution id is available", async () => {
      await renderComponent({
        environmentId: "env-001",
        latestScenarioExecutionId: "scenario-exec-001",
      });

      await waitFor(() =>
        expect(
          document.querySelector('a[aria-label="Open scenario details"]')
        ).toBeTruthy()
      );

      expect(
        document
          .querySelector('a[aria-label="Open scenario details"]')
          ?.getAttribute("href")
      ).toBe("/app/proj-001/test/execution/details/scenario-exec-001");
      expect(
        document.querySelector('mxevolve-icon[name="visibility"]')
      ).toBeTruthy();
      expect(
        document.querySelector('mxevolve-icon[name="description"]')
      ).toBeNull();
    });

    it("disables the scenario details link when user intervention is disabled", async () => {
      await renderComponent({
        environmentId: "env-001",
        latestScenarioExecutionId: "scenario-exec-001",
        scenarioDetailsDisabled: true,
      });

      await waitFor(() =>
        expect(
          document.querySelector('a[aria-label="Open scenario details"]')
        ).toBeTruthy()
      );

      const detailsLink = document.querySelector(
        'a[aria-label="Open scenario details"]'
      );
      expect(detailsLink?.getAttribute("href")).toBeNull();
      expect(detailsLink?.getAttribute("aria-disabled")).toBe("true");
    });

    it("does not render the scenario details icon link without a latest scenario execution id", async () => {
      await renderComponent({ environmentId: "env-001" });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-status-panel")
        ).toBeTruthy()
      );

      expect(
        document.querySelector('a[aria-label="Open scenario details"]')
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
  });
});
