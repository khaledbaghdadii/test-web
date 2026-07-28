import { render, screen, waitFor } from "@testing-library/angular";
import { ngMocks, MockComponent } from "ng-mocks";
import { of } from "rxjs";
import { Chip } from "primeng/chip";
import { Divider } from "primeng/divider";
import { BuildAndTestActivityRunDetailsComponent } from "./activity-run-details.component";
import {
  BuildAndTestProcessExecution,
  BuildAndTestSourceType,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { JiraDetailsService } from "@mxevolve/domains/business-process/data-access";
import { JiraIssueUrlResolverPipe } from "@mxflow/features/business-process";
import { RepositoryNameComponent } from "@mxevolve/domains/scm/widget";
import { InfraGroupNameComponent } from "@mxevolve/domains/infra/widget";
import { ScenarioNameComponent } from "@mxevolve/domains/test/widget";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";

const mockJiraDetailsService = {
  getJiraDetails: jest.fn(),
};

const MOCK_IMPORTS = [
  MockComponent(RepositoryNameComponent),
  MockComponent(InfraGroupNameComponent),
  MockComponent(ScenarioNameComponent),
  ShowMoreLessTextComponent,
  Chip,
  Divider,
  JiraIssueUrlResolverPipe,
];

function buildStage(
  name: string,
  route: string
): {
  name: string;
  status: StageStatus;
  route: string;
} {
  return { name, status: StageStatus.NOT_STARTED, route };
}

const MOCK_EXECUTION: BuildAndTestProcessExecution = {
  id: "execution-123",
  name: "ci-run-1",
  projectId: "project-123",
  definitionId: "definition-1",
  definitionName: "CI Template A",
  familyName: "Build & Test Process",
  processName: "Configuration Build & Test",
  description: "Short business process description",
  owner: "owner",
  notificationsRecipients: [],
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-02T00:00:00Z",
  expiryDate: "2026-01-10T00:00:00Z",
  supportsResourceManagement: false,
  hasPredefinedMergeRequestInputs: false,
  ciVersion: 2,
  source: { id: "source-1", type: BuildAndTestSourceType.USER },
  status: ExecutionStatus.RUNNING,
  input: {
    repositoryId: "repo-1",
    configurationBranchName: "test-objects-0002",
    configurationParentBranch: "main",
    userStoryIds: ["US-1"],
    buildAndTestInfraGroup: "test-env-infra",
    buildEnvironmentInfraGroup: "build-env-infra",
    buildEnvironment: {
      skipEnvironmentDeployment: false,
      scenarioDefinitionId: "scenario-def-1",
    },
  },
  createBranchStage: buildStage("Create Branch", "create-branch"),
  prepareBuildStage: buildStage("Prepare Setup", "prepare-build"),
  buildAndTestStage: buildStage("Build & Test", "build-and-test"),
  integrateChangesStage: buildStage("Merge", "integrate-changes"),
};

async function renderComponent(
  overrides: Partial<{ execution: BuildAndTestProcessExecution }> = {},
  jiraBaseUrl = "https://jira.example.com"
) {
  mockJiraDetailsService.getJiraDetails.mockReturnValue(
    of({ projectId: "project-123", jiraProjectId: "JP", jiraBaseUrl })
  );
  return render(BuildAndTestActivityRunDetailsComponent, {
    inputs: { execution: overrides.execution ?? MOCK_EXECUTION },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: JiraDetailsService, useValue: mockJiraDetailsService },
    ],
  });
}

describe("BuildAndTestActivityRunDetailsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("general fields", () => {
    it("renders the section heading", async () => {
      await renderComponent();

      expect(screen.getByText("Run Details")).toBeTruthy();
    });

    it("displays the template name", async () => {
      await renderComponent();

      expect(screen.getByText("CI Template A")).toBeTruthy();
    });

    it("displays the owner", async () => {
      await renderComponent();

      expect(screen.getByText("Process Run owner")).toBeTruthy();
      expect(screen.getByText("owner")).toBeTruthy();
    });

    it("shows a dash when the owner is empty", async () => {
      await renderComponent({
        execution: { ...MOCK_EXECUTION, owner: "" },
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("shows a dash when the template name is empty", async () => {
      await renderComponent({
        execution: { ...MOCK_EXECUTION, definitionName: "" },
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("displays the activity type as familyName / processName", async () => {
      await renderComponent();

      expect(
        screen.getByText("Build & Test Process / Configuration Build & Test")
      ).toBeTruthy();
    });

    it("displays the description", async () => {
      await renderComponent();

      expect(
        screen.getByText("Short business process description")
      ).toBeTruthy();
    });

    it("renders the process run owner as the last general detail", async () => {
      await renderComponent();

      const generalDetails = screen.getByText("Run Details").nextElementSibling;
      expect(generalDetails?.lastElementChild).toBe(
        screen.getByText("Process Run owner").parentElement
      );
    });

    it("shows a dash when description is blank", async () => {
      await renderComponent({
        execution: { ...MOCK_EXECUTION, description: "   " },
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("configuration parameters", () => {
    it("renders the repository name component when repository is provided", async () => {
      const { fixture } = await renderComponent();

      const repositoryName = ngMocks.find(fixture, RepositoryNameComponent);
      expect(ngMocks.input(repositoryName, "projectId")).toBe("project-123");
      expect(ngMocks.input(repositoryName, "repositoryId")).toBe("repo-1");
    });

    it("shows the configuration branch", async () => {
      await renderComponent();

      expect(screen.getByText("test-objects-0002")).toBeTruthy();
    });

    it("shows the configuration parent branch", async () => {
      await renderComponent();

      expect(screen.getByText("main")).toBeTruthy();
    });
  });

  describe("build scenario", () => {
    it("resolves the build scenario definition name when the environment is not skipped", async () => {
      const { fixture } = await renderComponent();

      const scenarioName = ngMocks.find(fixture, ScenarioNameComponent);
      expect(ngMocks.input(scenarioName, "projectId")).toBe("project-123");
      expect(ngMocks.input(scenarioName, "scenarioDefinitionId")).toBe(
        "scenario-def-1"
      );
    });

    it("shows a dash when the build scenario definition is empty", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            buildEnvironment: {
              ...MOCK_EXECUTION.input.buildEnvironment,
              scenarioDefinitionId: "",
            },
          },
        },
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("shows a dash for the build scenario definition when the environment deployment is skipped, even with an id", async () => {
      const { fixture } = await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            buildEnvironment: {
              ...MOCK_EXECUTION.input.buildEnvironment,
              skipEnvironmentDeployment: true,
            },
          },
        },
      });

      expect(ngMocks.findAll(fixture, ScenarioNameComponent)).toHaveLength(0);
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it('shows Skip "Prepare Build Environment" as False by default', async () => {
      await renderComponent();

      expect(screen.getByText('Skip "Prepare Build Environment"')).toBeTruthy();
      expect(screen.getByText("False")).toBeTruthy();
    });

    it('shows Skip "Prepare Build Environment" as True when the environment deployment is skipped', async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            buildEnvironment: {
              ...MOCK_EXECUTION.input.buildEnvironment,
              skipEnvironmentDeployment: true,
            },
          },
        },
      });

      expect(screen.getByText("True")).toBeTruthy();
    });
  });

  describe("user stories", () => {
    it("renders a link per linked user story", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            userStoryIds: ["VAL-125", "VAL-127"],
          },
        },
      });

      expect(
        await screen.findByRole("link", { name: "VAL-125" })
      ).toHaveAttribute("href", "https://jira.example.com/browse/VAL-125");
      expect(screen.getByRole("link", { name: "VAL-127" })).toBeTruthy();
    });

    it("renders a User story ID label and a chip for each linked story", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: { ...MOCK_EXECUTION.input, userStoryIds: ["VAL-125"] },
        },
      });

      expect(screen.getByText("User story ID")).toBeTruthy();
      expect(
        (await screen.findByRole("link", { name: "VAL-125" })).querySelector(
          "p-chip"
        )
      ).toBeTruthy();
    });

    it("shows a dash when there are no linked user stories", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: { ...MOCK_EXECUTION.input, userStoryIds: [] },
        },
      });

      await waitFor(() =>
        expect(screen.getByText("User Stories")).toBeTruthy()
      );
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("opens story links in a new tab with a safe rel attribute", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: { ...MOCK_EXECUTION.input, userStoryIds: ["VAL-125"] },
        },
      });

      const link = await screen.findByRole("link", { name: "VAL-125" });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("infrastructure parameters", () => {
    it("renders the build environment infra group with its label", async () => {
      const { fixture } = await renderComponent();

      expect(screen.getByText("Build Environment Infra Group")).toBeTruthy();

      const infraGroups = ngMocks.findAll(fixture, InfraGroupNameComponent);
      const buildEnv = infraGroups.find(
        (infraGroup) =>
          ngMocks.input(infraGroup, "infraGroupId") === "build-env-infra"
      );
      expect(buildEnv).toBeTruthy();
      expect(ngMocks.input(buildEnv, "projectId")).toBe("project-123");
    });

    it("renders the test environment infra group bound to buildAndTestInfraGroup", async () => {
      const { fixture } = await renderComponent();

      expect(screen.getByText("Test Environment Infra Group")).toBeTruthy();

      const infraGroups = ngMocks.findAll(fixture, InfraGroupNameComponent);
      const testEnv = infraGroups.find(
        (infraGroup) =>
          ngMocks.input(infraGroup, "infraGroupId") === "test-env-infra"
      );
      expect(testEnv).toBeTruthy();
      expect(ngMocks.input(testEnv, "projectId")).toBe("project-123");
    });
  });
});
