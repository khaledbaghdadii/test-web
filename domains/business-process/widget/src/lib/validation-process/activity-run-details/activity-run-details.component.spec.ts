import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { Divider } from "primeng/divider";
import { ValidationProcessActivityRunDetailsComponent } from "./activity-run-details.component";
import type { ValidationProcessExecution } from "@mxevolve/domains/business-process/data-access";
import { RepositoryNameComponent } from "@mxevolve/domains/scm/widget";
import { InfraGroupNameComponent } from "@mxevolve/domains/infra/widget";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ShowMoreLessTextComponent } from "@mxflow/ui/utils";
import { CommitIdDisplayComponent } from "@mxevolve/shared/ui/primitive";

const mockFinalProductApiService = {
  getFinalProductById: jest.fn(),
};

const MOCK_IMPORTS = [
  MockComponent(RepositoryNameComponent),
  MockComponent(InfraGroupNameComponent),
  ShowMoreLessTextComponent,
  CommitIdDisplayComponent,
  Divider,
];

const MOCK_EXECUTION = {
  id: "execution-1",
  name: "mv-run-1",
  projectId: "project-1",
  projectName: "My Project",
  sourceDefinitionId: "def-1",
  owner: "user-1",
  familyId: "family-1",
  familyName: "Master Validation",
  definitionId: "def-1",
  definitionName: "MV Template A",
  processName: "Continuous MV",
  description: "Short description",
  hidden: false,
  errorMessage: "",
  startDate: "",
  endDate: "",
  expiryDate: "",
  businessProcessQualityLevel: "MQG",
  officiality: "OFFICIAL",
  daysExtended: 0,
  status: "RUNNING",
  input: {
    repositoryId: "repo-1",
    createBranch: true,
    archivalBranchName: "archival/main",
    parentBranch: "parent-main",
    scenarioDefinitionIds: [],
    businessProcessQualityLevel: "MQG",
    finalProductId: "final-product-123",
    qualityGateExecutionInfraGroupId: "infra-group-1",
    configCommitId: "config-commit-1",
    rtpCommitId: "rtp-commit-1",
    nightlyRepusherEnabled: true,
  },
} as unknown as ValidationProcessExecution;

const REQUIRED_INPUTS = {
  execution: MOCK_EXECUTION,
};

async function renderComponent(
  overrides: Partial<{ execution: ValidationProcessExecution }> = {}
) {
  return render(ValidationProcessActivityRunDetailsComponent, {
    inputs: { ...REQUIRED_INPUTS, ...overrides },
    componentImports: MOCK_IMPORTS,
    providers: [
      {
        provide: FinalProductApiService,
        useValue: mockFinalProductApiService,
      },
    ],
  });
}

describe("ValidationProcessActivityRunDetailsComponent", () => {
  beforeEach(() => {
    mockFinalProductApiService.getFinalProductById.mockReset();
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of({ configurationCommitId: "" })
    );
  });

  describe("General section", () => {
    it("renders the section heading", async () => {
      await renderComponent();

      expect(screen.getByText("Run Details")).toBeTruthy();
    });

    it("displays the template name", async () => {
      await renderComponent();

      expect(screen.getByText("MV Template A")).toBeTruthy();
    });

    it("displays the activity type as familyName / processName", async () => {
      await renderComponent();

      expect(
        screen.getByText("Master Validation / Continuous MV")
      ).toBeTruthy();
    });

    it("displays the process run owner", async () => {
      await renderComponent();

      expect(screen.getByText("Process Run owner")).toBeTruthy();
      expect(screen.getByText("user-1")).toBeTruthy();
    });

    it("shows a dash when the process run owner is empty", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          owner: "",
        } as unknown as ValidationProcessExecution,
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("displays the description", async () => {
      await renderComponent();

      expect(screen.getByText("Short description")).toBeTruthy();
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
        execution: {
          ...MOCK_EXECUTION,
          description: "   ",
        } as unknown as ValidationProcessExecution,
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    it("uses the show more and show less pattern for long descriptions", async () => {
      const user = userEvent.setup();
      const longDescription = "1234567890123456789012345678901234567890 extra";

      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          description: longDescription,
        } as unknown as ValidationProcessExecution,
      });

      expect(
        screen.getByText("1234567890123456789012345678901234567890...")
      ).toBeTruthy();
      await user.click(screen.getByText("See More"));
      expect(screen.getByText(longDescription)).toBeTruthy();
      await user.click(screen.getByText("See Less"));
      expect(screen.getByText("See More")).toBeTruthy();
    });
  });

  describe("Config Parameters — MQG + Create Branch Yes", () => {
    it("shows the Parent Branch Name field", async () => {
      await renderComponent();

      expect(screen.getByText("Parent Branch Name")).toBeTruthy();
    });

    it("shows the Archival Branch Name field", async () => {
      await renderComponent();

      expect(screen.getByText("Archival Branch Name")).toBeTruthy();
    });

    it("shows the Final Product label", async () => {
      await renderComponent();

      expect(screen.getByText("Final Product")).toBeTruthy();
    });

    it("shows the RTP Commit ID field", async () => {
      await renderComponent();

      expect(screen.getByText("RTP Commit ID")).toBeTruthy();
    });
  });

  describe("Config Parameters — MQG + Create Branch No", () => {
    const mqgNoBranch = {
      ...MOCK_EXECUTION,
      input: {
        ...MOCK_EXECUTION.input,
        businessProcessQualityLevel: "MQG",
        createBranch: false,
      },
    } as unknown as ValidationProcessExecution;

    it("hides the Parent Branch Name field", async () => {
      await renderComponent({ execution: mqgNoBranch });

      expect(screen.queryByText("Parent Branch Name")).toBeNull();
    });

    it("shows the Archival Branch Name field", async () => {
      await renderComponent({ execution: mqgNoBranch });

      expect(screen.getByText("Archival Branch Name")).toBeTruthy();
    });

    it("shows the Final Product label", async () => {
      await renderComponent({ execution: mqgNoBranch });

      expect(screen.getByText("Final Product")).toBeTruthy();
    });

    it("shows the RTP Commit ID field", async () => {
      await renderComponent({ execution: mqgNoBranch });

      expect(screen.getByText("RTP Commit ID")).toBeTruthy();
    });
  });

  describe("Config Parameters — DQG + Create Branch Yes", () => {
    const dqgYesBranch = {
      ...MOCK_EXECUTION,
      input: {
        ...MOCK_EXECUTION.input,
        businessProcessQualityLevel: "DQG",
        createBranch: true,
      },
    } as unknown as ValidationProcessExecution;

    it("hides the Parent Branch Name field", async () => {
      await renderComponent({ execution: dqgYesBranch });

      expect(screen.queryByText("Parent Branch Name")).toBeNull();
    });

    it("shows the Final Product label", async () => {
      await renderComponent({ execution: dqgYesBranch });

      expect(screen.getByText("Final Product")).toBeTruthy();
    });

    it("shows the Archival Branch Name field", async () => {
      await renderComponent({ execution: dqgYesBranch });

      expect(screen.getByText("Archival Branch Name")).toBeTruthy();
    });

    it("shows the RTP Commit ID field", async () => {
      await renderComponent({ execution: dqgYesBranch });

      expect(screen.getByText("RTP Commit ID")).toBeTruthy();
    });
  });

  describe("Config Parameters — DQG + Create Branch No", () => {
    const dqgNoBranch = {
      ...MOCK_EXECUTION,
      input: {
        ...MOCK_EXECUTION.input,
        businessProcessQualityLevel: "DQG",
        createBranch: false,
      },
    } as unknown as ValidationProcessExecution;

    it("hides the Parent Branch Name field", async () => {
      await renderComponent({ execution: dqgNoBranch });

      expect(screen.queryByText("Parent Branch Name")).toBeNull();
    });

    it("shows the Final Product label", async () => {
      await renderComponent({ execution: dqgNoBranch });

      expect(screen.getByText("Final Product")).toBeTruthy();
    });

    it("shows the Archival Branch Name field", async () => {
      await renderComponent({ execution: dqgNoBranch });

      expect(screen.getByText("Archival Branch Name")).toBeTruthy();
    });

    it("shows the RTP Commit ID field", async () => {
      await renderComponent({ execution: dqgNoBranch });

      expect(screen.getByText("RTP Commit ID")).toBeTruthy();
    });
  });

  describe("Commit ID field", () => {
    it("shows the Config Commit ID label", async () => {
      await renderComponent();

      expect(screen.getByText("Config Commit ID")).toBeTruthy();
    });

    it("displays the configCommitId as the commit id value", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            configCommitId: "abc1234567890",
          },
        } as unknown as ValidationProcessExecution,
      });

      // CommitIdDisplayComponent truncates to first 10 characters
      expect(screen.getByText("abc1234567")).toBeTruthy();
    });

    it("displays the rtpCommitId truncated via the commit-id component", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            rtpCommitId: "rtp1234567890",
          },
        } as unknown as ValidationProcessExecution,
      });

      // CommitIdDisplayComponent truncates to first 10 characters
      expect(screen.getByText("rtp1234567")).toBeTruthy();
    });

    it("shows a dash when rtpCommitId is empty", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            rtpCommitId: "",
          },
        } as unknown as ValidationProcessExecution,
      });

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Final Product commit", () => {
    it("fetches the final product by the input finalProductId", async () => {
      await renderComponent();

      expect(
        mockFinalProductApiService.getFinalProductById
      ).toHaveBeenCalledWith("project-1", "final-product-123");
    });

    it("displays the fetched final product's configuration commit id", async () => {
      mockFinalProductApiService.getFinalProductById.mockReturnValue(
        of({ configurationCommitId: "fpcommit1234567890" })
      );

      await renderComponent();

      // CommitIdDisplayComponent truncates to first 10 characters
      await waitFor(() => expect(screen.getByText("fpcommit12")).toBeTruthy());
    });

    it("shows a dash when the final product has no commit id", async () => {
      mockFinalProductApiService.getFinalProductById.mockReturnValue(
        of({ configurationCommitId: "" })
      );

      await renderComponent();

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Tests section", () => {
    it("shows Yes when nightly repush is enabled", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            createBranch: false,
            nightlyRepusherEnabled: true,
          },
        } as unknown as ValidationProcessExecution,
      });

      expect(screen.getByText("Yes")).toBeTruthy();
    });

    it("shows No when nightly repush is disabled", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            nightlyRepusherEnabled: false,
          },
        } as unknown as ValidationProcessExecution,
      });

      expect(screen.getByText("No")).toBeTruthy();
    });
  });

  describe("User Story Archival section", () => {
    it("renders the section heading", async () => {
      await renderComponent();

      expect(screen.getByText("User Story Archival")).toBeTruthy();
    });

    it("shows the Start of Validation Scope Commit label", async () => {
      await renderComponent();

      expect(screen.getByText("Start of Validation Scope Commit")).toBeTruthy();
    });

    it("displays the validationScopeStartCommitId truncated via the commit-id component", async () => {
      await renderComponent({
        execution: {
          ...MOCK_EXECUTION,
          input: {
            ...MOCK_EXECUTION.input,
            validationScopeStartCommitId: "scope1234567890",
          },
        } as unknown as ValidationProcessExecution,
      });

      // CommitIdDisplayComponent truncates to first 10 characters
      expect(screen.getByText("scope12345")).toBeTruthy();
    });

    it("shows a dash when validationScopeStartCommitId is not set", async () => {
      await renderComponent();

      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Infrastructure Parameters", () => {
    it("renders the infra group name component with the correct project and infra group IDs", async () => {
      const { fixture } = await renderComponent();

      const infraGroup = ngMocks.find(fixture, InfraGroupNameComponent);
      expect(ngMocks.input(infraGroup, "projectId")).toBe("project-1");
      expect(ngMocks.input(infraGroup, "infraGroupId")).toBe("infra-group-1");
    });

    it("renders the repository name component with the correct project and repository IDs", async () => {
      const { fixture } = await renderComponent();

      const repositoryName = ngMocks.find(fixture, RepositoryNameComponent);
      expect(ngMocks.input(repositoryName, "projectId")).toBe("project-1");
      expect(ngMocks.input(repositoryName, "repositoryId")).toBe("repo-1");
    });
  });
});
