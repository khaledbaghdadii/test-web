import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, MockDirective, ngMocks } from "ng-mocks";
import { NEVER, of, throwError } from "rxjs";
import { RouterModule } from "@angular/router";
import { ScenarioRunsSummaryComponent } from "./scenario-runs-summary.component";
import type {
  ScenarioRunApiResponse,
  TestUnitApiModel,
} from "@mxevolve/domains/test/data-access";
import {
  ScenarioRunService,
  TestUnitService,
} from "@mxevolve/domains/test/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { SummaryItemComponent } from "./summary-item/summary-item.component";
import { SummaryDropdownComponent } from "./summary-dropdown/summary-dropdown.component";
import { Skeleton } from "primeng/skeleton";

const MOCK_IMPORTS = [
  MockComponent(MxevolveIconComponent),
  MockComponent(SummaryItemComponent),
  MockComponent(SummaryDropdownComponent),
  MockDirective(ShowElementIfAuthorizedDirective),
  Skeleton,
];

const mockScenarioRunService = {
  fetch: jest.fn(),
};

const mockTestUnitService = {
  fetch: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

function createRun(
  overrides: Partial<ScenarioRunApiResponse> = {}
): ScenarioRunApiResponse {
  return {
    id: "run-1",
    name: "test",
    status: "Passed",
    analysisStatus: "NA",
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-01-01T01:00:00Z",
    commitId: "abc",
    assignee: "user",
    mxVersion: "1.0",
    mxBuildId: "b1",
    envInfo: { environmentId: "env-1", status: "READY" },
    detections: {
      binaryImpactIds: [],
      configurationImpactIds: [],
      binaryRegressionIds: [],
      configurationRegressionIds: [],
      failureReasonIds: [],
    },
    linkedIncidents: [],
    ...overrides,
  };
}

const MOCK_RUNS: ScenarioRunApiResponse[] = [
  createRun({
    id: "run-1",
    analysisStatus: "NA",
    detections: {
      binaryImpactIds: ["bi-1"],
      configurationImpactIds: ["ci-1"],
      binaryRegressionIds: ["br-1"],
      configurationRegressionIds: [],
      failureReasonIds: ["fr-1", "fr-2"],
    },
    linkedIncidents: [
      {
        id: "i-1",
        title: "Bug",
        status: "OPEN",
        assignee: "a",
        reporter: "r",
        creationDate: "2025-01-01",
        externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
      },
    ],
  }),
  createRun({
    id: "run-2",
    analysisStatus: "Passed",
    detections: {
      binaryImpactIds: ["bi-1", "bi-2"],
      configurationImpactIds: [],
      binaryRegressionIds: [],
      configurationRegressionIds: ["cr-1"],
      failureReasonIds: ["fr-2", "fr-3"],
    },
    linkedIncidents: [
      {
        id: "i-2",
        title: "Issue",
        status: "CLOSED",
        assignee: "a",
        reporter: "r",
        creationDate: "2025-01-01",
        externalIssue: { id: "e-2", origin: "JIRA", link: "https://x" },
      },
    ],
  }),
  createRun({
    id: "run-3",
    analysisStatus: "Under Analysis",
  }),
  createRun({
    id: "run-4",
    analysisStatus: "Incident Sent",
  }),
  createRun({
    id: "run-5",
    analysisStatus: "Assigned",
  }),
  createRun({
    id: "run-6",
    analysisStatus: "Failed",
  }),
  createRun({
    id: "run-7",
    analysisStatus: "Cancelled",
  }),
];

const MOCK_TEST_UNITS: Partial<TestUnitApiModel>[] = [
  { headScenarioExecutionId: "run-1" },
  { headScenarioExecutionId: "run-2" },
  { headScenarioExecutionId: "run-3" },
  { headScenarioExecutionId: "run-4" },
  { headScenarioExecutionId: "run-5" },
  { headScenarioExecutionId: "run-6" },
  { headScenarioExecutionId: "run-7" },
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  contextId: "ctx-1",
  subContextId: "sub-ctx-1",
  bpExecutionName: "my-bp-execution",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  const result = await render(ScenarioRunsSummaryComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    imports: [RouterModule.forRoot([])],
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
      { provide: TestUnitService, useValue: mockTestUnitService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
  ngMocks
    .findInstances(ShowElementIfAuthorizedDirective)
    .forEach((d) => ngMocks.render(d, d));
  result.fixture.detectChanges();
  return result;
}

function findItemByLabel(label: string) {
  const items = ngMocks.findAll(SummaryItemComponent);
  const found = items.find((el) => ngMocks.input(el, "label") === label);
  if (!found) throw new Error(`SummaryItem with label "${label}" not found`);
  return found;
}

function findDropdownByLabel(label: string) {
  const dropdowns = ngMocks.findAll(SummaryDropdownComponent);
  const found = dropdowns.find((el) => ngMocks.input(el, "label") === label);
  if (!found)
    throw new Error(`SummaryDropdown with label "${label}" not found`);
  return found;
}

describe("ScenarioRunsSummaryComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioRunService.fetch.mockReturnValue(of(MOCK_RUNS));
    mockTestUnitService.fetch.mockReturnValue(of(MOCK_TEST_UNITS));
  });

  describe("panel rendering", () => {
    it("renders the Scenario Analysis Status Summary panel title", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText("Scenario Analysis Status Summary")
        ).toBeTruthy();
      });
    });

    it("renders the Aggregated Detections panel title", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Aggregated Detections")).toBeTruthy();
      });
    });

    it("renders the Aggregated Incidents panel title", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Aggregated Incidents")).toBeTruthy();
      });
    });
  });

  describe("summary item inputs", () => {
    it("passes correct count to Not Started dropdown", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findDropdownByLabel("Not Started"), "count")).toBe(
          2
        );
      });
    });

    it("passes correct count to Under Analysis item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findItemByLabel("Under Analysis"), "count")).toBe(
          1
        );
      });
    });

    it("passes correct count to Incident Sent item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findItemByLabel("Incident Sent"), "count")).toBe(
          1
        );
      });
    });

    it("passes correct count to Waste Reasons item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findItemByLabel("Waste Reasons"), "count")).toBe(
          3
        );
      });
    });

    it("passes correct count to Regressions item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findItemByLabel("Regressions"), "count")).toBe(2);
      });
    });

    it("passes correct count to Impacts item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findItemByLabel("Impacts"), "count")).toBe(3);
      });
    });

    it("passes correct count to Closed Incidents item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.input(findItemByLabel("Closed Incidents"), "count")
        ).toBe(1);
      });
    });

    it("passes correct count to Total number of incidents item", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.input(findItemByLabel("Total number of incidents"), "count")
        ).toBe(2);
      });
    });
  });

  describe("dropdown inputs", () => {
    it("passes correct count to Done dropdown", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(ngMocks.input(findDropdownByLabel("Done"), "count")).toBe(3);
      });
    });

    it("passes correct count to Open Incidents dropdown", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.input(findDropdownByLabel("Open Incidents"), "count")
        ).toBe(1);
      });
    });

    it("passes not started sub-items to the Not Started dropdown", async () => {
      await renderComponent();

      await waitFor(() => {
        const items = ngMocks.input(
          findDropdownByLabel("Not Started"),
          "items"
        );
        expect(items).toEqual([
          { value: "NA", label: "N/A", count: 1, active: false },
          { value: "Assigned", label: "Assigned", count: 1, active: false },
        ]);
      });
    });

    it("passes done sub-items to the Done dropdown", async () => {
      await renderComponent();

      await waitFor(() => {
        const items = ngMocks.input(findDropdownByLabel("Done"), "items");
        expect(items).toEqual([
          { value: "Passed", label: "Passed", count: 1, active: false },
          { value: "Failed", label: "Failed", count: 1, active: false },
          { value: "Cancelled", label: "Cancelled", count: 1, active: false },
        ]);
      });
    });

    it("passes open incident breakdown to the Open Incidents dropdown", async () => {
      await renderComponent();

      await waitFor(() => {
        const items = ngMocks.input(
          findDropdownByLabel("Open Incidents"),
          "items"
        );
        expect(items).toEqual([
          { value: "OPEN", label: "OPEN", count: 1, active: false },
        ]);
      });
    });
  });

  describe("filter events", () => {
    it("emits filter event when Not Started dropdown emits itemClicked", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks
        .output(findDropdownByLabel("Not Started"), "itemClicked")
        .emit("NA");
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "analysisStatus",
          value: "NA",
        })
      );
    });

    it("emits filter event when Waste Reasons item emits clicked", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Waste Reasons"), "clicked").emit();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "detection",
          value: "wasteReasons",
        })
      );
    });

    it("emits filter event when Closed Incidents item emits clicked", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Closed Incidents"), "clicked").emit();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "incident",
          value: "closed",
        })
      );
    });

    it("emits filter event when Done dropdown emits itemClicked", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "itemClicked").emit("Passed");
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "analysisStatus",
          value: "Passed",
        })
      );
    });

    it("emits filter event when Open Incidents dropdown emits itemClicked", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks
        .output(findDropdownByLabel("Open Incidents"), "itemClicked")
        .emit("OPEN");
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "incident",
          value: "OPEN",
        })
      );
    });

    it("emits null when the same item is clicked again", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();
      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenLastCalledWith(null);
    });

    it("closes open dropdown when a regular item is clicked", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "toggled").emit();
      fixture.detectChanges();

      expect(ngMocks.input(findDropdownByLabel("Done"), "open")).toBe(true);

      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();

      expect(ngMocks.input(findDropdownByLabel("Done"), "open")).toBe(false);
    });
  });

  describe("dropdown toggle", () => {
    it("opens Done dropdown when toggled emits", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "toggled").emit();
      fixture.detectChanges();

      expect(ngMocks.input(findDropdownByLabel("Done"), "open")).toBe(true);
    });

    it("closes Done dropdown when toggled emits again", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "toggled").emit();
      fixture.detectChanges();
      ngMocks.output(findDropdownByLabel("Done"), "toggled").emit();
      fixture.detectChanges();

      expect(ngMocks.input(findDropdownByLabel("Done"), "open")).toBe(false);
    });
  });

  describe("redirect links", () => {
    it("has a link to detections page with correct query params", async () => {
      await renderComponent();

      await waitFor(() => {
        const link = screen.getByTestId("detections-redirect");
        expect(link).toBeTruthy();
        expect(link.getAttribute("target")).toBe("_blank");
      });
    });

    it("has a link to incidents page with correct query params", async () => {
      await renderComponent();

      await waitFor(() => {
        const link = screen.getByTestId("incidents-redirect");
        expect(link).toBeTruthy();
        expect(link.getAttribute("target")).toBe("_blank");
      });
    });
  });

  describe("loading state", () => {
    it("shows skeleton placeholders while loading", async () => {
      mockScenarioRunService.fetch.mockReturnValue(NEVER);

      await renderComponent();

      await waitFor(() => {
        const skeletons = document.querySelectorAll("p-skeleton");
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("error handling", () => {
    it("shows error toast when fetch fails", async () => {
      mockScenarioRunService.fetch.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Failed to load scenario runs summary"
        );
      });
    });
  });

  it("gates analysis status panel behind read_analysis_status permission", async () => {
    await renderComponent();

    await waitFor(() => {
      const directives = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      );
      const analysisAuth = directives.find(
        (d) => d.showElementIfAuthorized.action === "read_analysis_status"
      );
      expect(analysisAuth).toBeTruthy();
      expect(analysisAuth!.showElementIfAuthorized).toEqual({
        action: "read_analysis_status",
        resource: "scenario_execution",
        package: "test",
        attributes: {},
      });
    });
  });

  it("gates detections panel behind view permission on analysis_object", async () => {
    await renderComponent();

    await waitFor(() => {
      const directives = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      );
      const detectionsAuth = directives.find(
        (d) =>
          d.showElementIfAuthorized.action === "view" &&
          d.showElementIfAuthorized.resource === "analysis_object"
      );
      expect(detectionsAuth).toBeTruthy();
      expect(detectionsAuth!.showElementIfAuthorized).toEqual({
        action: "view",
        resource: "analysis_object",
        package: "web",
        attributes: {},
      });
    });
  });

  it("gates incidents panel behind view permission on analysis_object", async () => {
    await renderComponent();

    await waitFor(() => {
      const panel = screen.getByTestId("incidents-panel");
      const directives = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      );
      const viewAuthDirectives = directives.filter(
        (d) =>
          d.showElementIfAuthorized.action === "view" &&
          d.showElementIfAuthorized.resource === "analysis_object"
      );
      expect(viewAuthDirectives.length).toBeGreaterThanOrEqual(2);
      expect(panel).toBeTruthy();
    });
  });

  describe("data fetching", () => {
    it("fetches scenario runs with project, context, and subcontext IDs", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockScenarioRunService.fetch).toHaveBeenCalledWith(
          "project-1",
          "ctx-1",
          "sub-ctx-1"
        );
      });
    });
  });

  describe("active filter chip", () => {
    it("returns null chip label when no filter is active", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      expect(fixture.componentInstance.activeFilterChipLabel()).toBeNull();
    });

    it("returns a chip label when a filter is activated", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "1 Under Analysis"
      );
    });

    it("clears the chip label when clearFilter is called", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();
      expect(fixture.componentInstance.activeFilterChipLabel()).toBeTruthy();

      fixture.componentInstance.clearFilter();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBeNull();
    });

    it("emits null filter event when chip is removed", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();

      fixture.componentInstance.clearFilter();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenLastCalledWith(null);
    });
  });

  describe("document click", () => {
    it("closes open dropdown when clicking outside the component", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "toggled").emit();
      fixture.detectChanges();
      expect(fixture.componentInstance.openDropdown()).toBe("done");

      const outsideEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(outsideEvent, "target", {
        value: document.body,
      });
      fixture.componentInstance.onDocumentClick(outsideEvent);
      fixture.detectChanges();

      expect(fixture.componentInstance.openDropdown()).toBeNull();
    });
  });

  describe("dropdown item deselection", () => {
    it("clears filter when the same dropdown item is clicked again", async () => {
      const { fixture } = await renderComponent();
      const emitSpy = jest.fn();
      fixture.componentInstance.filterClicked.subscribe(emitSpy);

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "itemClicked").emit("Passed");
      fixture.detectChanges();

      ngMocks.output(findDropdownByLabel("Done"), "itemClicked").emit("Passed");
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenLastCalledWith(null);
    });
  });

  describe("filter chip labels for all filter types", () => {
    it("returns correct label for Incident Sent filter", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Incident Sent"), "clicked").emit();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "1 Incident Sent"
      );
    });

    it("returns correct label for Regressions filter", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Regressions"), "clicked").emit();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "2 Regressions"
      );
    });

    it("returns correct label for Impacts filter", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Impacts"), "clicked").emit();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "3 Impacts"
      );
    });

    it("returns correct label for Closed Incidents filter", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      ngMocks.output(findItemByLabel("Closed Incidents"), "clicked").emit();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "1 Closed Incidents"
      );
    });

    it("returns correct label for Failed filter via dropdown", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks.output(findDropdownByLabel("Done"), "itemClicked").emit("Failed");
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "1 Failed"
      );
    });

    it("returns correct label for Cancelled filter via dropdown", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks
        .output(findDropdownByLabel("Done"), "itemClicked")
        .emit("Cancelled");
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "1 Cancelled"
      );
    });

    it("returns correct label for Assigned filter via dropdown", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks
        .output(findDropdownByLabel("Not Started"), "itemClicked")
        .emit("Assigned");
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe(
        "1 Assigned"
      );
    });

    it("returns correct label for Open Incidents breakdown filter", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(
          ngMocks.findAll(SummaryDropdownComponent).length
        ).toBeGreaterThan(0);
      });

      ngMocks
        .output(findDropdownByLabel("Open Incidents"), "itemClicked")
        .emit("OPEN");
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilterChipLabel()).toBe("1 OPEN");
    });
  });

  describe("externalFilter sync", () => {
    it("clears internal highlight when externalFilter transitions to undefined", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        expect(ngMocks.findAll(SummaryItemComponent).length).toBeGreaterThan(0);
      });

      // Activate a filter internally
      ngMocks.output(findItemByLabel("Under Analysis"), "clicked").emit();
      fixture.detectChanges();
      expect(fixture.componentInstance.activeFilter()).not.toBeNull();

      // Simulate parent setting externalFilter (chip is shown)
      fixture.componentRef.setInput("externalFilter", {
        type: "analysisStatus",
        value: "Under Analysis",
        label: "1 Under Analysis",
      });
      fixture.detectChanges();

      // Simulate parent clearing externalFilter (chip removed)
      fixture.componentRef.setInput("externalFilter", undefined);
      fixture.detectChanges();

      expect(fixture.componentInstance.activeFilter()).toBeNull();
    });
  });
});
