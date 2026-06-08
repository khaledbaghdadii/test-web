import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { Divider } from "primeng/divider";
import { ActivityRunDetailsComponent } from "./activity-run-details.component";
import type { UpgradeProcessExecution } from "@mxevolve/domains/business-process/util";
import { RepositoryNameComponent } from "@mxevolve/domains/scm/widget";
import { InfraGroupNameComponent } from "@mxevolve/domains/infra/widget";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";

const MOCK_IMPORTS = [
  MockComponent(RepositoryNameComponent),
  MockComponent(InfraGroupNameComponent),
  ShowMoreLessTextComponent,
  Divider,
];

const MOCK_EXECUTION: UpgradeProcessExecution = {
  id: "execution-123",
  name: "upgrade-run-1",
  definitionName: "Upgrade Template A",
  familyName: "Upgrade Process",
  processName: "Continuous RTP Greening",
  description: "Short business process description",
  projectId: "project-123",
  input: {
    factoryProductId: "MX.3",
    mxVersion: "3.1.64",
    mxBuildId: "build-123",
    bipVersion: "2.0.1",
    bipBuildId: "bip-456",
    parentMxArchivalBranch: "archival/main",
    upgradeJump: "Continuous Greening",
    businessProcessQualityLevel: "MQG",
    repositoryId: "repo-1",
    configurationBranchName: "config/branch",
    createBranch: true,
    configurationParentBranch: "config/parent",
    binaryConversionInfraGroupId: "infra-group-1",
    qualityGateExecutionInfraGroupId: "infra-group-2",
    binaryConversionTestScenarioId: "scenario-3",
  },
};

const REQUIRED_INPUTS = {
  execution: MOCK_EXECUTION,
};

async function renderComponent(
  overrides: Partial<{
    projectId: string;
    execution: UpgradeProcessExecution;
  }> = {}
) {
  return render(ActivityRunDetailsComponent, {
    inputs: { ...REQUIRED_INPUTS, ...overrides },
    componentImports: MOCK_IMPORTS,
  });
}

describe("ActivityRunDetailsComponent", () => {
  describe("header and basic fields", () => {
    it("renders the section heading", async () => {
      await renderComponent();

      expect(screen.getByText("Activity Run Details")).toBeTruthy();
    });

    it("displays the template name", async () => {
      await renderComponent();

      expect(screen.getByText("Upgrade Template A")).toBeTruthy();
    });

    it("displays the activity type as familyName / processName", async () => {
      await renderComponent();

      expect(
        screen.getByText("Upgrade Process / Continuous RTP Greening")
      ).toBeTruthy();
    });

    it("displays the upgrade jump", async () => {
      await renderComponent();

      expect(screen.getByText("Continuous Greening")).toBeTruthy();
    });

    it("displays the quality level", async () => {
      await renderComponent();

      expect(screen.getByText("MQG")).toBeTruthy();
    });

    it("displays the description", async () => {
      await renderComponent();

      expect(
        screen.getByText("Short business process description")
      ).toBeTruthy();
    });

    it("shows a dash when description is blank", async () => {
      await renderComponent({
        execution: { ...MOCK_EXECUTION, description: "   " },
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("uses the show more and show less pattern for long descriptions", async () => {
      const user = userEvent.setup();
      const longDescription = "1234567890123456789012345678901234567890 extra";

      await renderComponent({
        execution: { ...MOCK_EXECUTION, description: longDescription },
      });

      expect(
        screen.getByText("1234567890123456789012345678901234567890...")
      ).toBeTruthy();
      await user.click(screen.getByText("See More"));
      expect(screen.getByText(longDescription)).toBeTruthy();
      await user.click(screen.getByText("See Less"));
      expect(screen.getByText("See More")).toBeTruthy();
    });

    it("shows a dash when name is empty", async () => {
      await renderComponent({
        execution: { ...MOCK_EXECUTION, definitionName: "" },
      });

      const nameFields = screen.getAllByText("-");
      expect(nameFields.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("MX Parameters", () => {
    it("shows the MX version", async () => {
      await renderComponent();

      expect(screen.getByText("3.1.64")).toBeTruthy();
    });

    it("shows the MX build ID", async () => {
      await renderComponent();

      expect(screen.getByText("build-123")).toBeTruthy();
    });

    it("shows the BIP version", async () => {
      await renderComponent();

      expect(screen.getByText("2.0.1")).toBeTruthy();
    });

    it("shows the BIP build ID", async () => {
      await renderComponent();

      expect(screen.getByText("bip-456")).toBeTruthy();
    });

    it("shows the parent MX archival branch", async () => {
      await renderComponent();

      expect(screen.getByText("archival/main")).toBeTruthy();
    });
  });

  describe("Configuration Parameters", () => {
    it("renders the repository name component when repository is provided", async () => {
      const { fixture } = await renderComponent();

      const repositoryName = ngMocks.find(fixture, RepositoryNameComponent);
      expect(ngMocks.input(repositoryName, "projectId")).toBe("project-123");
      expect(ngMocks.input(repositoryName, "repositoryId")).toBe("repo-1");
    });

    it("shows the configuration branch", async () => {
      await renderComponent();

      expect(screen.getByText("config/branch")).toBeTruthy();
    });

    it('shows "Yes" when createBranch is true', async () => {
      await renderComponent();

      expect(screen.getByText("Yes")).toBeTruthy();
    });

    it('shows "No" when createBranch is false', async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: { ...MOCK_EXECUTION.input, createBranch: false },
        },
      });

      expect(screen.getByText("No")).toBeTruthy();
    });

    it("shows the configuration parent branch", async () => {
      await renderComponent();

      expect(screen.getByText("config/parent")).toBeTruthy();
    });
  });

  describe("Infrastructure Parameters", () => {
    it("renders the binary conversion infra group component", async () => {
      const { fixture } = await renderComponent();

      const infraGroups = ngMocks.findAll(fixture, InfraGroupNameComponent);
      const binaryConversion = infraGroups.find(
        (infraGroup) =>
          ngMocks.input(infraGroup, "infraGroupId") === "infra-group-1"
      );
      expect(binaryConversion).toBeTruthy();
      expect(ngMocks.input(binaryConversion, "projectId")).toBe("project-123");
    });

    it("renders the quality gate infra group component", async () => {
      const { fixture } = await renderComponent();

      const infraGroups = ngMocks.findAll(fixture, InfraGroupNameComponent);
      const qualityGate = infraGroups.find(
        (infraGroup) =>
          ngMocks.input(infraGroup, "infraGroupId") === "infra-group-2"
      );
      expect(qualityGate).toBeTruthy();
      expect(ngMocks.input(qualityGate, "projectId")).toBe("project-123");
    });
  });
});
