import type { DebugElement, Provider } from "@angular/core";
import { signal } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { RouterLink, RouterModule } from "@angular/router";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, MockDirective, ngMocks } from "ng-mocks";
import { TooltipModule } from "primeng/tooltip";
import { PopoverModule } from "primeng/popover";
import { Button } from "primeng/button";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Select } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { of, throwError } from "rxjs";
import { ScenarioRunsComponent } from "./scenario-runs.component";
import type { HeadScenarioRunViewModel } from "./head-scenario-run-view-model";
import {
  ScenarioRunsPanelFacadeService,
  type ScenarioRunsPanelViewModel,
} from "./scenario-runs-panel-facade.service";
import {
  AnalysisStatusDisplayComponent,
  AssigneeDisplayComponent,
  ScenarioRunNameDisplayComponent,
  ScenarioRunStatusDisplayComponent,
  ScenarioRunTableComponent,
  type ScenarioRunTableViewModel,
} from "@mxevolve/domains/test/ui";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatusDisplayComponent } from "@mxevolve/domains/environment/ui";
import { EnvironmentStatusPanelComponent } from "@mxevolve/domains/environment/widget";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import {
  CommitIdDisplayComponent,
  DurationDisplayComponent,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  AuthenticationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { StreamsService } from "@mxflow/features/streams";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { GroupService } from "@mxevolve/domains/user/data-access";
import { AbortScenarioRunButtonComponent } from "../abort-scenario-run-button/abort-scenario-run-button.component";
import { EnvironmentLinkButtonComponent } from "../environment-link-button/environment-link-button.component";
import { RerunScenarioButtonComponent } from "../rerun-scenario-button/rerun-scenario-button.component";
import { ScenarioRunAssigneeDropdownComponent } from "../assignee-dropdown/scenario-run-assignee-dropdown.component";
import type { PanelFilterData } from "./panel-filter-data";
import { BulkRerunScenariosComponent } from "../bulk-rerun-scenarios/bulk-rerun-scenarios.component";
import type { SummaryFilterEvent } from "../scenario-runs-summary/summary-filter-event";

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const MOCK_IMPORTS = [
  MockComponent(ScenarioRunStatusDisplayComponent),
  MockComponent(ScenarioRunNameDisplayComponent),
  MockComponent(AnalysisStatusDisplayComponent),
  MockComponent(AssigneeDisplayComponent),
  MockComponent(ScenarioRunTableComponent),
  MockComponent(EnvironmentStatusDisplayComponent),
  MockComponent(EnvironmentStatusPanelComponent),
  MockComponent(CommitIdDisplayComponent),
  MockComponent(DurationDisplayComponent),
  MockComponent(MxevolveIconComponent),
  MockComponent(AbortScenarioRunButtonComponent),
  MockComponent(EnvironmentLinkButtonComponent),
  MockComponent(RerunScenarioButtonComponent),
  MockComponent(ScenarioRunAssigneeDropdownComponent),
  MockComponent(BulkRerunScenariosComponent),
  MockDirective(ShowElementIfAuthorizedDirective),
  NgTemplateOutlet,
  RouterLink,
  Button,
  ToggleSwitch,
  Select,
  FormsModule,
  TooltipModule,
  PopoverModule,
  InputTextModule,
  IconField,
  InputIcon,
];

const HEAD_DATA: HeadScenarioRunViewModel = {
  impactIds: [],
  incidentIds: [],
  regressionIds: [],
  id: "run-head-001",
  name: "pricing-regression-test",
  status: ScenarioRunStatus.PASSED,
  environmentId: "env-001",
  environmentStatus: EnvironmentStatus.READY,
  analysisStatus: "PASSED",
  numberOfImpacts: 3,
  numberOfRegressions: 1,
  numberOfIncidents: 2,
  startDate: "2025-06-01T10:00:00Z",
  endDate: "2025-06-01T11:30:00Z",
  commitId: "abc123def",
  assigneeId: "user-001",
  assigneeDisplayName: "John Doe",
  assigneeEmail: "john.doe@example.com",
  mxVersion: "3.1.64",
  mxBuildId: "build-789",
  scenarioDefinitionId: "sd-001",
  contextId: "ctx-001",
  subContextId: "sub-ctx-001",
  factoryProductId: "fp-001",
  executionGroupId: "eg-001",
  repushable: true,
};

const PREVIOUS_RUNS: ScenarioRunTableViewModel[] = [
  {
    id: "run-1",
    name: "pricing-regression-test",
    status: ScenarioRunStatus.FAILED,
    environmentStatus: EnvironmentStatus.READY,
    startDate: "2025-05-31T10:00:00Z",
    endDate: "2025-05-31T11:00:00Z",
    commitId: "prev-commit-1",
    mxVersion: "3.1.63",
    mxBuildId: "build-788",
    assigneeId: "user-002",
    assigneeDisplayName: "Jane Doe",
    assigneeEmail: "jane.doe@example.com",
  },
  {
    id: "run-2",
    name: "pricing-regression-test",
    status: ScenarioRunStatus.PASSED,
    environmentStatus: EnvironmentStatus.READY,
    startDate: "2025-05-30T10:00:00Z",
    endDate: "2025-05-30T11:00:00Z",
    commitId: "prev-commit-2",
    mxVersion: "3.1.62",
    mxBuildId: "build-787",
    assigneeId: "user-002",
    assigneeDisplayName: "Jane Doe",
    assigneeEmail: "jane.doe@example.com",
  },
  {
    id: "run-3",
    name: "pricing-regression-test",
    status: ScenarioRunStatus.UNDERWAY,
    environmentStatus: EnvironmentStatus.EXECUTING,
    startDate: "2025-05-29T10:00:00Z",
    endDate: "2025-05-29T11:00:00Z",
    commitId: "prev-commit-3",
    mxVersion: "3.1.61",
    mxBuildId: "build-786",
    assigneeId: "user-002",
    assigneeDisplayName: "Jane Doe",
    assigneeEmail: "jane.doe@example.com",
  },
];

const DEFAULT_FILTER_DATA: PanelFilterData = {
  hasWasteReasons: false,
  hasRegressions: false,
  hasImpacts: false,
  hasIncidents: false,
  incidentStatuses: [],
  businessProcessChainIds: [],
};

const MOCK_FETCH_RESULT: ScenarioRunsPanelViewModel = {
  totalNumberOfImpacts: 3,
  totalNumberOfIncidents: 2,
  totalNumberOfRegressions: 1,
  head: HEAD_DATA,
  previousRuns: PREVIOUS_RUNS,
  filterData: DEFAULT_FILTER_DATA,
};

function createMockService(
  result: ScenarioRunsPanelViewModel = MOCK_FETCH_RESULT
) {
  return {
    fetch: jest.fn().mockReturnValue(of([result])),
  };
}

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    contextId: string;
    subContextId: string;
    scenarioRunIds: string[];
    showEnvironmentDetails: boolean;
    showEnvironmentLink: boolean;
    showHistory: boolean;
    detailsExpandedByDefault: boolean;
    showBulkRerun: boolean;
    showTopBarActions: boolean;
    showActionButtons: boolean;
    filter: SummaryFilterEvent;
  }> = {},
  serviceOverride?: Partial<ScenarioRunsPanelFacadeService>,
  additionalProviders: Provider[] = []
) {
  const mockService = serviceOverride ?? createMockService();
  const result = await render(ScenarioRunsComponent, {
    inputs: {
      projectId: "project-123",
      contextId: "context-1",
      subContextId: "sub-context-1",
      detailsExpandedByDefault: true,
      ...inputs,
    },
    imports: [RouterModule.forRoot([])],
    providers: [
      {
        provide: AuthenticationService,
        useValue: { currentUserInfo: signal(null) },
      },
      ...additionalProviders,
    ],
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunsPanelFacadeService, useValue: mockService },
      { provide: ScenarioRunService, useValue: {} },
      { provide: ScenarioDefinitionService, useValue: {} },
      { provide: TestDefinitionService, useValue: {} },
      { provide: ToastMessageService, useValue: mockToastService },
      {
        provide: GroupService,
        useValue: {
          getAllTransitiveGroups: () => of([]),
        },
      },
      {
        provide: StreamsService,
        useValue: { getStreams: () => of([]) },
      },
    ],
  });
  ngMocks
    .findInstances(ShowElementIfAuthorizedDirective)
    .forEach((d) => ngMocks.render(d, d));
  result.fixture.detectChanges();
  return result;
}

describe("ScenarioRunsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body
      .querySelectorAll(".p-dialog-mask")
      .forEach((el) => el.remove());
  });

  describe("data fetching", () => {
    it("fetches data by context when contextId and subContextId are provided", async () => {
      const service = createMockService();
      await renderComponent(
        { contextId: "ctx-1", subContextId: "sub-1" },
        service
      );

      expect(service.fetch).toHaveBeenCalledWith({
        projectId: "project-123",
        contextId: "ctx-1",
        subContextId: "sub-1",
        scenarioRunIds: undefined,
      });
    });

    it("fetches data by IDs when scenarioRunIds are provided", async () => {
      const service = createMockService();
      await renderComponent({ scenarioRunIds: ["run-1", "run-2"] }, service);

      expect(service.fetch).toHaveBeenCalledWith({
        projectId: "project-123",
        contextId: "context-1",
        subContextId: "sub-context-1",
        scenarioRunIds: ["run-1", "run-2"],
      });
    });

    it("renders details after data loads", async () => {
      await renderComponent();

      expect(screen.queryByTestId("details-row-1")).toBeTruthy();
    });
  });

  describe("scenario run details - row 1", () => {
    it("shows the scenario name using the clickable name component", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const nameDisplay = ngMocks.find(
          fixture,
          ScenarioRunNameDisplayComponent
        );
        expect(ngMocks.input(nameDisplay, "name")).toBe(
          "pricing-regression-test"
        );
        expect(ngMocks.input(nameDisplay, "scenarioRunId")).toBe(
          "run-head-001"
        );
        expect(ngMocks.input(nameDisplay, "projectId")).toBe("project-123");
      });
    });

    it("renders the scenario run status display", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const statusDisplay = ngMocks.find(
          fixture,
          ScenarioRunStatusDisplayComponent
        );
        expect(ngMocks.input(statusDisplay, "status")).toBe(
          ScenarioRunStatus.PASSED
        );
      });
    });

    it("shows the analysis status using the display component", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const analysisStatus = ngMocks.find(
          fixture,
          AnalysisStatusDisplayComponent
        );
        expect(ngMocks.input(analysisStatus, "status")).toBe("PASSED");
      });
    });

    it("shows the test unit findings with icons and linked numbers", async () => {
      const { fixture } = await renderComponent();
      const getIconName = (icon: DebugElement) => ngMocks.input(icon, "name");

      await waitFor(() => {
        const icons = ngMocks.findAll(fixture, MxevolveIconComponent);
        const iconNames = icons.map(getIconName);
        expect(iconNames).toContain("radar");
        expect(iconNames).toContain("bug_report");
        expect(iconNames).toContain("healing");

        const impactsSection = screen.getByTestId("impacts-count");
        expect(impactsSection.tagName).toBe("SPAN");
        const impactsLink = impactsSection.querySelector("a");
        expect(impactsLink?.textContent?.trim()).toBe("3");
        expect(impactsLink?.classList.contains("text-blue-500")).toBe(true);

        const regressionsSection = screen.getByTestId("regressions-count");
        expect(regressionsSection.tagName).toBe("SPAN");
        const regressionsLink = regressionsSection.querySelector("a");
        expect(regressionsLink?.textContent?.trim()).toBe("1");

        const incidentsSection = screen.getByTestId("incidents-count");
        expect(incidentsSection.tagName).toBe("SPAN");
        const incidentsLink = incidentsSection.querySelector("a");
        expect(incidentsLink?.textContent?.trim()).toBe("2");
      });
    });

    it("renders the duration display", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const durationDisplay = ngMocks.find(fixture, DurationDisplayComponent);
        expect(ngMocks.input(durationDisplay, "startDate")).toBe(
          "2025-06-01T10:00:00Z"
        );
        expect(ngMocks.input(durationDisplay, "endDate")).toBe(
          "2025-06-01T11:30:00Z"
        );
      });
    });

    it("shows the commit ID", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const commitDisplay = ngMocks.find(fixture, CommitIdDisplayComponent);
        expect(ngMocks.input(commitDisplay, "commitId")).toBe("abc123def");
      });
    });

    it("renders the assignee dropdown when context fields are available", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const dropdown = ngMocks.find(
          fixture,
          ScenarioRunAssigneeDropdownComponent
        );
        expect(ngMocks.input(dropdown, "projectId")).toBe("project-123");
        expect(ngMocks.input(dropdown, "scenarioDefinitionId")).toBe("sd-001");
        expect(ngMocks.input(dropdown, "contextId")).toBe("ctx-001");
        expect(ngMocks.input(dropdown, "subContextId")).toBe("sub-ctx-001");
        expect(ngMocks.input(dropdown, "selectedAssigneeId")).toBe("user-001");
      });
    });

    it("renders the static assignee display when context fields are missing", async () => {
      const noContextData: ScenarioRunsPanelViewModel = {
        head: {
          ...HEAD_DATA,
          scenarioDefinitionId: undefined,
          contextId: undefined,
        },
        previousRuns: PREVIOUS_RUNS,
      } as unknown as ScenarioRunsPanelViewModel;
      const { fixture } = await renderComponent(
        {},
        createMockService(noContextData)
      );

      await waitFor(() => {
        const assigneeDisplay = ngMocks.find(fixture, AssigneeDisplayComponent);
        expect(ngMocks.input(assigneeDisplay, "assigneeDisplayName")).toBe(
          "John Doe"
        );
        expect(ngMocks.input(assigneeDisplay, "assigneeEmail")).toBe(
          "john.doe@example.com"
        );
      });
    });
  });

  describe("scenario run details - row 2", () => {
    it("shows the MX version", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("3.1.64")).toBeTruthy());
    });

    it("shows the MX build ID", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("build-789")).toBeTruthy());
    });

    it("shows history with colored circles and counts by status", async () => {
      await renderComponent();

      await waitFor(() => {
        const failedSection = screen.getByTestId("history-failed");
        expect(failedSection.querySelector(".bg-red-500")).toBeTruthy();
        expect(
          failedSection.querySelector("span:last-child")?.textContent?.trim()
        ).toBe("1");

        const underwaySection = screen.getByTestId("history-underway");
        expect(underwaySection.querySelector(".bg-yellow-500")).toBeTruthy();
        expect(
          underwaySection.querySelector("span:last-child")?.textContent?.trim()
        ).toBe("1");

        const passedSection = screen.getByTestId("history-passed");
        expect(passedSection.querySelector(".bg-green-500")).toBeTruthy();
        expect(
          passedSection.querySelector("span:last-child")?.textContent?.trim()
        ).toBe("1");
      });
    });
  });

  describe("collapsible details", () => {
    it("shows expanded details by default after data loads", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId("details-row-1")).toBeTruthy();
        expect(screen.queryByTestId("mx-version")).toBeTruthy();
      });
    });

    it("hides expanded details when the collapse button is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() =>
        expect(screen.queryByTestId("mx-version")).toBeTruthy()
      );

      const collapseButton = screen.getByRole("button", {
        name: "Toggle scenario run details",
      });
      await user.click(collapseButton);

      expect(screen.queryByTestId("details-row-1")).toBeTruthy();
      expect(screen.queryByTestId("mx-version")).toBeNull();
    });

    it("shows expanded details again when the collapse button is clicked twice", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() =>
        expect(screen.queryByTestId("mx-version")).toBeTruthy()
      );

      const collapseButton = screen.getByRole("button", {
        name: "Toggle scenario run details",
      });
      await user.click(collapseButton);
      await user.click(collapseButton);

      expect(screen.queryByTestId("details-row-1")).toBeTruthy();
      expect(screen.queryByTestId("mx-version")).toBeTruthy();
    });
  });

  describe("showEnvironmentDetails", () => {
    it("shows the environment panel when showEnvironmentDetails is true", async () => {
      const { fixture } = await renderComponent({
        showEnvironmentDetails: true,
      });

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-environment-status-panel")
        ).toBeTruthy();
        const environmentPanel = ngMocks.find(
          fixture,
          EnvironmentStatusPanelComponent
        );
        expect(ngMocks.input(environmentPanel, "projectId")).toBe(
          "project-123"
        );
        expect(ngMocks.input(environmentPanel, "environmentId")).toBe(
          "env-001"
        );
      });
    });

    it("hides the environment status field in scenario header when showEnvironmentDetails is true", async () => {
      await renderComponent({
        showEnvironmentDetails: true,
      });

      await waitFor(() =>
        expect(screen.queryByTestId("details-row-1")).toBeTruthy()
      );
      expect(screen.queryByTestId("environment-status")).toBeNull();
    });

    it("hides the environment panel when showEnvironmentDetails is false", async () => {
      await renderComponent({ showEnvironmentDetails: false });

      await waitFor(() =>
        expect(screen.queryByTestId("details-row-1")).toBeTruthy()
      );
      expect(
        document.querySelector("mxevolve-environment-status-panel")
      ).toBeNull();
    });

    it("shows the environment status field in scenario header when showEnvironmentDetails is false", async () => {
      const { fixture } = await renderComponent({
        showEnvironmentDetails: false,
      });

      await waitFor(() => {
        expect(screen.queryByTestId("environment-status")).toBeTruthy();
        const environmentStatus = ngMocks.find(
          fixture,
          EnvironmentStatusDisplayComponent
        );
        expect(ngMocks.input(environmentStatus, "status")).toBe(
          EnvironmentStatus.READY
        );
      });
    });

    it("does not show the environment panel when environmentId is empty", async () => {
      const dataWithNoEnvironment: ScenarioRunsPanelViewModel = {
        head: { ...HEAD_DATA, environmentId: "" },
        previousRuns: PREVIOUS_RUNS,
      } as unknown as ScenarioRunsPanelViewModel;
      await renderComponent(
        { showEnvironmentDetails: true },
        createMockService(dataWithNoEnvironment)
      );

      await waitFor(() =>
        expect(screen.queryByTestId("details-row-1")).toBeTruthy()
      );
      expect(
        document.querySelector("mxevolve-environment-status-panel")
      ).toBeNull();
    });
  });

  describe("showHistory", () => {
    it("does not show the history section when showHistory is false", async () => {
      await renderComponent({ showHistory: false });

      expect(screen.queryByTestId("history-section")).toBeNull();
    });

    it("does not show the history section when there are no previous runs", async () => {
      const noPreviousRuns: ScenarioRunsPanelViewModel = {
        head: HEAD_DATA,
        previousRuns: [],
      } as unknown as ScenarioRunsPanelViewModel;
      await renderComponent(
        { showHistory: true },
        createMockService(noPreviousRuns)
      );

      expect(screen.queryByTestId("history-section")).toBeNull();
    });

    it("shows the Show Previous Runs button when showHistory is true", async () => {
      await renderComponent({ showHistory: true });

      expect(screen.getByText("Show Previous Runs")).toBeTruthy();
    });

    it("does not show the previous runs table by default", async () => {
      await renderComponent({ showHistory: true });

      expect(screen.queryByTestId("previous-runs-table")).toBeNull();
    });

    it("shows the previous runs table when Show Previous Runs is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({ showHistory: true });

      await user.click(screen.getByText("Show Previous Runs"));

      await waitFor(() => {
        expect(screen.queryByTestId("previous-runs-table")).toBeTruthy();
        const table = ngMocks.find(fixture, ScenarioRunTableComponent);
        expect(ngMocks.input(table, "scenarioRuns")).toEqual(PREVIOUS_RUNS);
        expect(ngMocks.input(table, "projectId")).toBe("project-123");
      });
    });

    it("changes button label to Hide Previous Runs when expanded", async () => {
      const user = userEvent.setup();
      await renderComponent({ showHistory: true });

      await user.click(screen.getByText("Show Previous Runs"));

      expect(screen.getByText("Hide Previous Runs")).toBeTruthy();
    });

    it("hides the previous runs table when Hide Previous Runs is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent({ showHistory: true });

      await user.click(screen.getByText("Show Previous Runs"));
      await user.click(screen.getByText("Hide Previous Runs"));

      expect(screen.queryByTestId("previous-runs-table")).toBeNull();
    });
  });

  describe("error handling", () => {
    it("shows error toast when the service returns an error", async () => {
      const error = new Error("fetch failed");
      const service = {
        fetch: jest.fn().mockReturnValue(throwError(() => error)),
      };

      await render(ScenarioRunsComponent, {
        inputs: {
          projectId: "project-123",
          contextId: "ctx-1",
          subContextId: "sub-1",
        },
        imports: [RouterModule.forRoot([])],
        providers: [
          {
            provide: AuthenticationService,
            useValue: { currentUserInfo: signal(null) },
          },
        ],
        componentImports: MOCK_IMPORTS,
        componentProviders: [
          { provide: ScenarioRunsPanelFacadeService, useValue: service },
          { provide: ScenarioRunService, useValue: {} },
          { provide: ScenarioDefinitionService, useValue: {} },
          { provide: TestDefinitionService, useValue: {} },
          { provide: ToastMessageService, useValue: mockToastService },
          {
            provide: GroupService,
            useValue: {
              getAllTransitiveGroups: () => of([]),
            },
          },
          {
            provide: StreamsService,
            useValue: { getStreams: () => of([]) },
          },
        ],
      });

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "Failed to load scenario runs."
      );
    });
  });

  describe("abort button", () => {
    it("renders the abort button with correct inputs", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const abortButton = ngMocks.find(
          fixture,
          AbortScenarioRunButtonComponent
        );
        expect(ngMocks.input(abortButton, "projectId")).toBe("project-123");
        expect(ngMocks.input(abortButton, "scenarioRunId")).toBe(
          "run-head-001"
        );
        expect(ngMocks.input(abortButton, "scenarioRunName")).toBe(
          "pricing-regression-test"
        );
        expect(ngMocks.input(abortButton, "scenarioRunStatus")).toBe(
          ScenarioRunStatus.PASSED
        );
      });
    });

    it("positions the abort button on the far right of row 1", async () => {
      await renderComponent();

      await waitFor(() => {
        const row = screen.getByTestId("details-row-1");
        const abortWrapper = within(row).queryByTestId("abort-button");
        expect(abortWrapper).toBeTruthy();
      });
    });
  });

  describe("rerun button", () => {
    it("renders the rerun button with correct inputs", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const rerunButton = ngMocks.find(fixture, RerunScenarioButtonComponent);
        expect(ngMocks.input(rerunButton, "projectId")).toBe("project-123");
        expect(ngMocks.input(rerunButton, "scenarioRunId")).toBe(
          "run-head-001"
        );
        expect(ngMocks.input(rerunButton, "factoryProductId")).toBe("fp-001");
        expect(ngMocks.input(rerunButton, "executionGroupId")).toBe("eg-001");
        expect(ngMocks.input(rerunButton, "repushable")).toBe(true);
      });
    });

    it("positions the rerun button next to the abort button", async () => {
      await renderComponent();

      await waitFor(() => {
        const row = screen.getByTestId("details-row-1");
        const rerunWrapper = within(row).queryByTestId("rerun-button");
        expect(rerunWrapper).toBeTruthy();
      });
    });
  });

  describe("environment link", () => {
    it("shows the environment link button when showEnvironmentLink is true and environmentId exists", async () => {
      await renderComponent({ showEnvironmentLink: true });

      await waitFor(() => {
        expect(
          document.querySelector("mxevolve-environment-link-button")
        ).toBeInTheDocument();
      });
    });

    it("passes correct projectId and environmentId to the environment link button", async () => {
      const { fixture } = await renderComponent({
        showEnvironmentLink: true,
      });

      await waitFor(() => {
        const envButton = ngMocks.find(fixture, EnvironmentLinkButtonComponent);
        expect(ngMocks.input(envButton, "projectId")).toBe("project-123");
        expect(ngMocks.input(envButton, "environmentId")).toBe("env-001");
      });
    });

    it("does not show the environment link button when showEnvironmentLink is false", async () => {
      await renderComponent({ showEnvironmentLink: false });

      await waitFor(() => {
        expect(screen.queryByTestId("details-row-1")).toBeTruthy();
      });
      expect(
        document.querySelector("mxevolve-environment-link-button")
      ).not.toBeInTheDocument();
    });

    it("does not show the environment link button when environmentId is empty", async () => {
      const noEnvData: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, environmentId: "" },
        previousRuns: PREVIOUS_RUNS,
        filterData: {
          hasWasteReasons: false,
          hasRegressions: false,
          hasImpacts: true,
          hasIncidents: false,
          incidentStatuses: [],
          businessProcessChainIds: [],
        },
      };
      await renderComponent(
        { showEnvironmentLink: true },
        createMockService(noEnvData)
      );

      await waitFor(() => {
        expect(screen.queryByTestId("details-row-1")).toBeTruthy();
      });
      expect(
        document.querySelector("mxevolve-environment-link-button")
      ).not.toBeInTheDocument();
    });
  });

  describe("head exclusion from previous runs table", () => {
    it("does not include the head scenario run in the previous runs table", async () => {
      const { fixture } = await renderComponent({ showHistory: true });
      const user = userEvent.setup();

      await user.click(screen.getByText("Show Previous Runs"));

      const isHeadRun = (run: ScenarioRunTableViewModel) =>
        run.id === HEAD_DATA.id;

      await waitFor(() => {
        const table = ngMocks.find(fixture, ScenarioRunTableComponent);
        const tableRuns = ngMocks.input(table, "scenarioRuns");
        const headInTable = tableRuns.find(isHeadRun);
        expect(headInTable).toBeUndefined();
        expect(tableRuns.length).toBe(PREVIOUS_RUNS.length);
      });
    });
  });

  describe("authorization checks", () => {
    it("gates analysis status behind read_analysis_status permission on scenario_execution", async () => {
      await renderComponent();
      const isAnalysisStatusDirective = (d: ShowElementIfAuthorizedDirective) =>
        d.showElementIfAuthorized.action === "read_analysis_status";

      await waitFor(() => {
        const directives = ngMocks.findInstances(
          ShowElementIfAuthorizedDirective
        );
        const analysisAuth = directives.find(isAnalysisStatusDirective);
        expect(analysisAuth).toBeTruthy();
        expect(analysisAuth!.showElementIfAuthorized).toEqual({
          action: "read_analysis_status",
          resource: "scenario_execution",
          package: "test",
          attributes: {},
        });
      });
    });

    it("gates test unit findings behind view permission on analysis_object", async () => {
      await renderComponent();
      const isFindingsDirective = (d: ShowElementIfAuthorizedDirective) =>
        d.showElementIfAuthorized.action === "view" &&
        d.showElementIfAuthorized.resource === "analysis_object";

      await waitFor(() => {
        const directives = ngMocks.findInstances(
          ShowElementIfAuthorizedDirective
        );
        const findingsAuth = directives.find(isFindingsDirective);
        expect(findingsAuth).toBeTruthy();
        expect(findingsAuth!.showElementIfAuthorized).toEqual({
          action: "view",
          resource: "analysis_object",
          package: "web",
          attributes: {},
        });
      });
    });
  });

  describe("test unit findings tooltips", () => {
    it("shows Impacts tooltip on impacts count", async () => {
      await renderComponent();

      await waitFor(() => {
        const el = screen.getByTestId("impacts-count");
        expect(el.getAttribute("ptooltip")).toBe("Impacts");
      });
    });

    it("shows Regressions tooltip on regressions count", async () => {
      await renderComponent();

      await waitFor(() => {
        const el = screen.getByTestId("regressions-count");
        expect(el.getAttribute("ptooltip")).toBe("Regressions");
      });
    });

    it("shows Incidents tooltip on incidents count", async () => {
      await renderComponent();

      await waitFor(() => {
        const el = screen.getByTestId("incidents-count");
        expect(el.getAttribute("ptooltip")).toBe("Incidents");
      });
    });
  });

  describe("duration breakdown popover", () => {
    it("returns null breakdown when head has no endDate", async () => {
      const panelNoEnd: ScenarioRunsPanelViewModel = {
        ...MOCK_FETCH_RESULT,
        head: { ...HEAD_DATA, endDate: undefined },
        durationBreakdown: {
          testExecutionTimings: [],
        },
      };
      const service = createMockService(panelNoEnd);
      const { fixture } = await renderComponent({}, service);

      const component = fixture.componentInstance;
      expect(component.getDurationBreakdown(panelNoEnd)).toBeNull();
    });

    it("returns structured breakdown when data is available", async () => {
      const panelWithBreakdown: ScenarioRunsPanelViewModel = {
        ...MOCK_FETCH_RESULT,
        head: {
          ...HEAD_DATA,
          startDate: "2025-06-01T10:00:00.000Z",
          endDate: "2025-06-01T11:00:00.000Z",
        },
        durationBreakdown: {
          testExecutionTimings: [
            {
              startDate: "2025-06-01T10:00:00.000Z",
              endDate: "2025-06-01T10:30:00.000Z",
            },
          ],
          deploymentStartedOn: "2025-06-01T09:00:00.000Z",
          deploymentEndedOn: "2025-06-01T09:15:00.000Z",
        },
      };
      const service = createMockService(panelWithBreakdown);
      const { fixture } = await renderComponent({}, service);

      const component = fixture.componentInstance;
      const result = component.getDurationBreakdown(panelWithBreakdown);
      expect(result).toEqual({
        totalDuration: "1h 0m 0s",
        testTime: "0h 30m 0s",
        deploymentTime: "0h 15m 0s",
        other: "0h 15m 0s",
      });
    });

    it("shows N/A for deployment time when no deployment data", async () => {
      const panelNoDeployment: ScenarioRunsPanelViewModel = {
        ...MOCK_FETCH_RESULT,
        head: {
          ...HEAD_DATA,
          startDate: "2025-06-01T10:00:00.000Z",
          endDate: "2025-06-01T11:00:00.000Z",
        },
        durationBreakdown: {
          testExecutionTimings: [],
        },
      };
      const service = createMockService(panelNoDeployment);
      const { fixture } = await renderComponent({}, service);

      const component = fixture.componentInstance;
      expect(
        component.getDurationBreakdown(panelNoDeployment)?.deploymentTime
      ).toBe("N/A");
    });
  });

  describe("bulk rerun", () => {
    it("hides the Bulk Rerun section when showBulkRerun is false", async () => {
      await renderComponent({ showTopBarActions: true, showBulkRerun: false });

      expect(
        document.querySelector("mxevolve-bulk-rerun-scenarios")
      ).toBeNull();
    });

    it("hides the Bulk Rerun section when showBulkRerun is not provided", async () => {
      await renderComponent();

      expect(
        document.querySelector("mxevolve-bulk-rerun-scenarios")
      ).toBeNull();
    });

    it("shows the Bulk Rerun section when showBulkRerun is true", async () => {
      const { fixture } = await renderComponent({
        showTopBarActions: true,
        showBulkRerun: true,
      });

      const bulkRerun = ngMocks.find(fixture, BulkRerunScenariosComponent);
      expect(bulkRerun).toBeTruthy();
      expect(ngMocks.input(bulkRerun, "projectId")).toBe("project-123");
      expect(ngMocks.input(bulkRerun, "panels")).toEqual([MOCK_FETCH_RESULT]);
    });

    it("emits scenarioChanged when rerunCompleted is emitted", async () => {
      const { fixture } = await renderComponent({
        showTopBarActions: true,
        showBulkRerun: true,
      });

      const scenarioChangedSpy = jest.fn();
      fixture.componentInstance.scenarioChanged.subscribe(scenarioChangedSpy);

      const bulkRerun = ngMocks.find(fixture, BulkRerunScenariosComponent);
      ngMocks.output(bulkRerun, "rerunCompleted").emit();

      expect(scenarioChangedSpy).toHaveBeenCalledTimes(1);
    });

    it("refreshes the panels when rerunCompleted is emitted", async () => {
      const service = createMockService();
      const { fixture } = await renderComponent(
        { showTopBarActions: true, showBulkRerun: true },
        service
      );

      service.fetch.mockClear();

      const bulkRerun = ngMocks.find(fixture, BulkRerunScenariosComponent);
      ngMocks.output(bulkRerun, "rerunCompleted").emit();

      expect(service.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("filtering", () => {
    const PANEL_WITH_IMPACTS: ScenarioRunsPanelViewModel = {
      totalNumberOfImpacts: 0,
      totalNumberOfIncidents: 0,
      totalNumberOfRegressions: 0,
      head: {
        ...HEAD_DATA,
        id: "run-impacts",
        name: "impacts-scenario",
        analysisStatus: "Under Analysis",
      },
      previousRuns: [],
      filterData: {
        hasWasteReasons: false,
        hasRegressions: false,
        hasImpacts: true,
        hasIncidents: false,
        incidentStatuses: [],
        businessProcessChainIds: [],
      },
    };

    const PANEL_WITH_REGRESSIONS: ScenarioRunsPanelViewModel = {
      totalNumberOfImpacts: 0,
      totalNumberOfIncidents: 0,
      totalNumberOfRegressions: 0,
      head: {
        ...HEAD_DATA,
        id: "run-regressions",
        name: "regressions-scenario",
        analysisStatus: "Incident Sent",
      },
      previousRuns: [],
      filterData: {
        hasWasteReasons: false,
        hasRegressions: true,
        hasImpacts: false,
        hasIncidents: false,
        incidentStatuses: [],
        businessProcessChainIds: [],
      },
    };

    const PANEL_WITH_WASTE: ScenarioRunsPanelViewModel = {
      totalNumberOfImpacts: 0,
      totalNumberOfIncidents: 0,
      totalNumberOfRegressions: 0,
      head: {
        ...HEAD_DATA,
        id: "run-waste",
        name: "waste-scenario",
        analysisStatus: "PASSED",
      },
      previousRuns: [],
      filterData: {
        hasWasteReasons: true,
        hasRegressions: false,
        hasImpacts: false,
        hasIncidents: false,
        incidentStatuses: [],
        businessProcessChainIds: [],
      },
    };

    const PANEL_WITH_INCIDENTS: ScenarioRunsPanelViewModel = {
      totalNumberOfImpacts: 0,
      totalNumberOfIncidents: 0,
      totalNumberOfRegressions: 0,
      head: {
        ...HEAD_DATA,
        id: "run-incidents",
        name: "incidents-scenario",
        analysisStatus: "Incident Sent",
      },
      previousRuns: [],
      filterData: {
        hasWasteReasons: false,
        hasRegressions: false,
        hasImpacts: false,
        hasIncidents: true,
        incidentStatuses: ["OPEN", "In Progress"],
        businessProcessChainIds: [],
      },
    };

    function createMultiPanelService() {
      return {
        fetch: jest
          .fn()
          .mockReturnValue(
            of([
              PANEL_WITH_IMPACTS,
              PANEL_WITH_REGRESSIONS,
              PANEL_WITH_WASTE,
              PANEL_WITH_INCIDENTS,
            ])
          ),
      };
    }

    it("filters panels by analysisStatus when filter is set", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "analysisStatus", value: "Under Analysis" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("filters panels by detection wasteReasons when filter is set", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "detection", value: "wasteReasons" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("filters panels by detection regressions when filter is set", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "detection", value: "regressions" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("filters panels by detection impacts when filter is set", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "detection", value: "impacts" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("filters panels by incidents when filter is set", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "incident", value: "total" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("filters panels by closed incident status", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "incident", value: "closed" } },
        service
      );

      await waitFor(() => {
        expect(
          screen.getByText("No scenario runs match the current filters")
        ).toBeTruthy();
      });
    });

    it("filters panels by closed incident status when panel has closed incidents", async () => {
      const panelWithClosedIncident: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "run-closed", name: "closed-scenario" },
        previousRuns: [],
        filterData: {
          hasWasteReasons: false,
          hasRegressions: false,
          hasImpacts: false,
          hasIncidents: true,
          incidentStatuses: ["CLOSED"],
          businessProcessChainIds: [],
        },
      };
      const service = {
        fetch: jest
          .fn()
          .mockReturnValue(of([PANEL_WITH_IMPACTS, panelWithClosedIncident])),
      };
      await renderComponent(
        { filter: { type: "incident", value: "closed" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("filters panels by specific incident status", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "incident", value: "In Progress" } },
        service
      );

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(1);
      });
    });

    it("shows no panels when filtering by a status not present in any panel", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "incident", value: "Draft" } },
        service
      );

      await waitFor(() => {
        expect(
          screen.getByText("No scenario runs match the current filters")
        ).toBeTruthy();
      });
    });

    it("shows all panels when filter is not set", async () => {
      const service = createMultiPanelService();
      await renderComponent({}, service);

      await waitFor(() => {
        const panels = screen.getAllByTestId("scenario-runs-panel");
        expect(panels).toHaveLength(4);
      });
    });

    it("shows no-match message when filter matches no panels", async () => {
      const service = createMultiPanelService();
      await renderComponent(
        { filter: { type: "analysisStatus", value: "NonExistent" } },
        service
      );

      await waitFor(() => {
        expect(
          screen.getByText("No scenario runs match the current filters")
        ).toBeTruthy();
      });
    });
  });

  describe("search", () => {
    it("filters panels by name search term (case-insensitive)", async () => {
      const panelA: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "a", name: "Alpha Test" },
        previousRuns: [],
        filterData: DEFAULT_FILTER_DATA,
      };
      const panelB: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "b", name: "Beta Test" },
        previousRuns: [],
        filterData: DEFAULT_FILTER_DATA,
      };
      const service = {
        fetch: jest.fn().mockReturnValue(of([panelA, panelB])),
      };

      const user = userEvent.setup();
      await renderComponent(
        { showTopBarActions: true, detailsExpandedByDefault: false },
        service
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });

      const searchInput = screen.getByTestId("search-input");
      await user.type(searchInput, "alpha");

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(1);
      });
    });

    it("shows all panels when search is empty", async () => {
      const panelA: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "a", name: "Alpha Test" },
        previousRuns: [],
        filterData: DEFAULT_FILTER_DATA,
      };
      const panelB: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "b", name: "Beta Test" },
        previousRuns: [],
        filterData: DEFAULT_FILTER_DATA,
      };
      const service = {
        fetch: jest.fn().mockReturnValue(of([panelA, panelB])),
      };

      await renderComponent({}, service);

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });
    });

    it("handles special characters in search safely", async () => {
      await renderComponent({ showTopBarActions: true });

      const searchInput = screen.getByTestId("search-input");
      fireEvent.input(searchInput, { target: { value: "[test.*+?" } });

      await waitFor(() => {
        expect(screen.queryByTestId("scenario-runs-panel")).toBeTruthy();
      });
    });
  });

  describe("expand all toggle", () => {
    it("renders the Expand All toggle", async () => {
      await renderComponent({
        showTopBarActions: true,
        detailsExpandedByDefault: false,
      });

      await waitFor(() => {
        expect(screen.getByTestId("expand-all-toggle")).toBeTruthy();
        expect(screen.getByText("Expand All")).toBeTruthy();
      });
    });

    it("expands all detail rows when toggle is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent({
        showTopBarActions: true,
        detailsExpandedByDefault: false,
      });

      await waitFor(() =>
        expect(screen.queryByTestId("mx-version")).toBeNull()
      );

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(screen.queryByTestId("mx-version")).toBeTruthy();
      });
    });

    it("collapses all detail rows when toggle is clicked again", async () => {
      const user = userEvent.setup();
      await renderComponent({
        showTopBarActions: true,
        detailsExpandedByDefault: false,
      });

      await user.click(screen.getByRole("switch"));

      await waitFor(() =>
        expect(screen.queryByTestId("mx-version")).toBeTruthy()
      );

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(screen.queryByTestId("mx-version")).toBeNull();
      });
    });
  });

  describe("environment link position", () => {
    it("positions environment link between rerun and abort buttons", async () => {
      await renderComponent({ showEnvironmentLink: true });

      await waitFor(() => {
        const rerunButton = document.querySelector(
          "mxevolve-rerun-scenario-button"
        );
        const envLink = document.querySelector(
          "mxevolve-environment-link-button"
        );
        const abortButton = document.querySelector(
          "mxevolve-abort-scenario-run-button"
        );

        expect(rerunButton).toBeInTheDocument();
        expect(envLink).toBeInTheDocument();
        expect(abortButton).toBeInTheDocument();

        const parent = envLink!.parentElement!;
        const children = Array.from(parent.children);
        const rerunIndex = children.indexOf(
          rerunButton!.closest(parent.tagName === "DIV" ? "div" : "*")!
        );
        const envIndex = children.indexOf(envLink!);
        const abortIndex = children.indexOf(
          abortButton!.closest(parent.tagName === "DIV" ? "div" : "*")!
        );

        expect(envIndex).toBeGreaterThan(rerunIndex);
        expect(envIndex).toBeLessThan(abortIndex);
      });
    });
  });

  describe("top bar template", () => {
    function overrideWithMockProviders(
      testBed: {
        overrideComponent: (component: unknown, override: unknown) => void;
      },
      mockService: unknown
    ): void {
      testBed.overrideComponent(ScenarioRunsComponent, {
        set: {
          imports: [...MOCK_IMPORTS, NgTemplateOutlet],
          providers: [
            {
              provide: ScenarioRunsPanelFacadeService,
              useValue: mockService,
            },
            { provide: ScenarioRunService, useValue: {} },
            { provide: ScenarioDefinitionService, useValue: {} },
            { provide: TestDefinitionService, useValue: {} },
            { provide: ToastMessageService, useValue: mockToastService },
            {
              provide: GroupService,
              useValue: {
                getAllTransitiveGroups: () => of([]),
              },
            },
            {
              provide: StreamsService,
              useValue: { getStreams: () => of([]) },
            },
          ],
        },
      });
    }

    it("renders the projected top bar template", async () => {
      const mockService = createMockService();
      await render(
        `<mxevolve-scenario-runs
          [projectId]="'project-123'"
          [contextId]="'context-1'"
          [subContextId]="'sub-context-1'"
          [detailsExpandedByDefault]="true"
        >
          <ng-template #topBar><span>Custom Top Bar</span></ng-template>
        </mxevolve-scenario-runs>`,
        {
          imports: [ScenarioRunsComponent, RouterModule.forRoot([])],
          providers: [
            {
              provide: AuthenticationService,
              useValue: { currentUserInfo: signal(null) },
            },
          ],
          configureTestBed: (testBed) =>
            overrideWithMockProviders(testBed, mockService),
        }
      );

      await waitFor(() => {
        expect(screen.getByText("Custom Top Bar")).toBeTruthy();
      });
    });

    it("does not render top bar section when no template is provided", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.queryByText("Custom Top Bar")).toBeNull();
      });
    });
  });

  describe("showActionButtons", () => {
    it("shows action buttons by default (showActionButtons=true)", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId("rerun-button")).toBeTruthy();
        expect(screen.queryByTestId("abort-button")).toBeTruthy();
      });
    });

    it("hides action buttons when showActionButtons=false", async () => {
      await renderComponent({ showActionButtons: false });

      await waitFor(() =>
        expect(screen.queryByTestId("details-row-1")).toBeTruthy()
      );
      expect(screen.queryByTestId("rerun-button")).toBeNull();
      expect(screen.queryByTestId("abort-button")).toBeNull();
    });
  });

  describe("assignee filter select", () => {
    it("renders the assignee filter select when showTopBarActions is true", async () => {
      await renderComponent({ showTopBarActions: true });

      await waitFor(() => {
        expect(screen.getByTestId("assignee-filter-select")).toBeTruthy();
      });
    });

    it("hides the assignee filter select when showTopBarActions is false", async () => {
      await renderComponent({ showTopBarActions: false });

      await waitFor(() =>
        expect(screen.queryByTestId("scenario-runs-panel")).toBeTruthy()
      );

      expect(screen.queryByTestId("assignee-filter-select")).toBeNull();
    });

    it("has three filter options", async () => {
      const { fixture } = await renderComponent({ showTopBarActions: true });

      const component = fixture.componentInstance;
      expect(component.assigneeFilterOptions).toHaveLength(3);
      expect(component.assigneeFilterOptions.map((o) => o.value)).toEqual([
        "not-assigned",
        "assigned-to-me",
        "assigned-to-my-stream",
      ]);
    });

    it("assigneeFilter signal defaults to null", async () => {
      const { fixture } = await renderComponent({ showTopBarActions: true });

      expect(fixture.componentInstance.assigneeFilter()).toBeNull();
    });
  });

  describe("assignee filter logic", () => {
    function createPanel(
      id: string,
      assigneeId: string,
      businessProcessChainIds: string[] = []
    ): ScenarioRunsPanelViewModel {
      return {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id, assigneeId },
        previousRuns: [],
        filterData: { ...DEFAULT_FILTER_DATA, businessProcessChainIds },
      };
    }

    it("shows all panels when assignee filter is not set", async () => {
      const panelA = createPanel("a", "user-001");
      const panelB = createPanel("b", "");
      const service = {
        fetch: jest.fn().mockReturnValue(of([panelA, panelB])),
      };

      await renderComponent({}, service);

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });
    });

    it("shows only unassigned panels when filter is 'not-assigned'", async () => {
      const assigned = createPanel("a", "user-001");
      const unassigned = createPanel("b", "");
      const service = {
        fetch: jest.fn().mockReturnValue(of([assigned, unassigned])),
      };

      const { fixture } = await renderComponent({}, service);

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });

      fixture.componentInstance.assigneeFilter.set("not-assigned");
      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(1);
      });
    });

    it("shows only panels assigned to current user when filter is 'assigned-to-me'", async () => {
      const mine = createPanel("a", "current-user-id");
      const others = createPanel("b", "other-user");
      const service = {
        fetch: jest.fn().mockReturnValue(of([mine, others])),
      };

      const { fixture } = await renderComponent({}, service, [
        {
          provide: AuthenticationService,
          useValue: { currentUserInfo: signal({ userId: "current-user-id" }) },
        },
      ]);

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });

      fixture.componentInstance.assigneeFilter.set("assigned-to-me");
      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(1);
      });
    });

    it("shows only panels belonging to my stream's BPCs when filter is 'assigned-to-my-stream'", async () => {
      const inStream = createPanel("a", "other-user", ["bpc-1"]);
      const outOfStream = createPanel("b", "other-user", ["bpc-999"]);
      const service = {
        fetch: jest.fn().mockReturnValue(of([inStream, outOfStream])),
      };

      const { fixture } = await renderComponent({}, service, [
        {
          provide: GroupService,
          useValue: {
            getAllTransitiveGroups: () =>
              of([{ id: "group-1", name: "My Team" }]),
          },
        },
        {
          provide: StreamsService,
          useValue: {
            getStreams: () =>
              of([
                {
                  id: "stream-1",
                  name: "My Stream",
                  owners: [{ id: "group-1", displayName: "My Team" }],
                  businessProcessChains: [{ id: "bpc-1", name: "BPC One" }],
                },
              ]),
          },
        },
      ]);

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });

      fixture.componentInstance.assigneeFilter.set("assigned-to-my-stream");
      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(1);
      });
    });

    it("updates filter when p-select emits ngModelChange", async () => {
      const assigned = createPanel("a", "user-001");
      const unassigned = createPanel("b", "");
      const service = {
        fetch: jest.fn().mockReturnValue(of([assigned, unassigned])),
      };

      const { fixture } = await renderComponent(
        { showTopBarActions: true },
        service
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(2);
      });

      const selectDebugEl = ngMocks.find(fixture, Select);
      ngMocks.change(selectDebugEl, "not-assigned");
      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(1);
      });
    });

    it("composes assignee filter with search term and summary filter simultaneously", async () => {
      // Panel A: unassigned, name matches search, has regressions → passes all 3 filters
      const panelA: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "a", assigneeId: "", name: "pricing-test" },
        previousRuns: [],
        filterData: {
          ...DEFAULT_FILTER_DATA,
          hasRegressions: true,
          businessProcessChainIds: ["bpc-1"],
        },
      };

      // Panel B: unassigned, name matches search, but no regressions → fails summary filter
      const panelB: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "b", assigneeId: "", name: "pricing-other" },
        previousRuns: [],
        filterData: {
          ...DEFAULT_FILTER_DATA,
          hasRegressions: false,
          businessProcessChainIds: ["bpc-1"],
        },
      };

      // Panel C: unassigned, has regressions, but name doesn't match → fails search
      const panelC: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: { ...HEAD_DATA, id: "c", assigneeId: "", name: "unrelated-test" },
        previousRuns: [],
        filterData: {
          ...DEFAULT_FILTER_DATA,
          hasRegressions: true,
          businessProcessChainIds: ["bpc-1"],
        },
      };

      // Panel D: assigned to someone, name matches, has regressions → fails assignee filter
      const panelD: ScenarioRunsPanelViewModel = {
        totalNumberOfImpacts: 0,
        totalNumberOfIncidents: 0,
        totalNumberOfRegressions: 0,
        head: {
          ...HEAD_DATA,
          id: "d",
          assigneeId: "user-001",
          name: "pricing-regression",
        },
        previousRuns: [],
        filterData: {
          ...DEFAULT_FILTER_DATA,
          hasRegressions: true,
          businessProcessChainIds: ["bpc-1"],
        },
      };

      const service = {
        fetch: jest.fn().mockReturnValue(of([panelA, panelB, panelC, panelD])),
      };

      const { fixture } = await renderComponent(
        {
          showTopBarActions: true,
          filter: {
            type: "detection",
            value: "regressions",
          } as SummaryFilterEvent,
        },
        service
      );

      await waitFor(() => {
        expect(
          screen.getAllByTestId("scenario-runs-panel").length
        ).toBeGreaterThan(0);
      });

      // Set search term
      fixture.componentInstance.searchTerm.set("pricing");
      // Set assignee filter
      fixture.componentInstance.assigneeFilter.set("not-assigned");
      fixture.detectChanges();

      await waitFor(() => {
        expect(screen.getAllByTestId("scenario-runs-panel")).toHaveLength(1);
      });
    });
  });
});
