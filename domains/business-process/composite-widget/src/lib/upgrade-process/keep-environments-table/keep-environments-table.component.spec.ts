import { render, screen, waitFor } from "@testing-library/angular";
import {
  AllCommunityModule,
  FirstDataRenderedEvent,
  ModuleRegistry,
  type SelectionChangedEvent,
} from "ag-grid-community";
import { of, Subject, throwError } from "rxjs";
import { KeepEnvironmentsTableComponent } from "./keep-environments-table.component";
import { FurtherAnalysisService } from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { uuid } from "@pact-foundation/pact/src/v3/matchers";

ModuleRegistry.registerModules([AllCommunityModule]);

const mockFurtherAnalysisService = {
  getFurtherAnalysisCandidates: jest.fn(),
  getSelectedResources: jest.fn(),
  markResourcesForFurtherAnalysis: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const environmentId = uuid();
const scenarioId = uuid();
const environmentId2 = uuid();
const environmentId3 = uuid();
const scenarioId2 = uuid();

const candidates = {
  candidates: [
    {
      id: environmentId,
      tags: ["regression"],
      linkedScenario: {
        id: scenarioId,
        name: "Smoke Test",
        linkedIncidents: [
          { id: "INC-1", externalIssueId: null, externalIssueLink: null },
        ],
      },
    },
    {
      id: environmentId2,
      tags: ["perf"],
      linkedScenario: {
        id: scenarioId,
        name: "Smoke Test",
        linkedIncidents: [
          { id: "INC-2", externalIssueId: null, externalIssueLink: null },
          { id: "INC-3", externalIssueId: null, externalIssueLink: null },
        ],
      },
    },
    {
      id: environmentId3,
      tags: ["integration"],
      linkedScenario: {
        id: scenarioId2,
        name: "Settlement Test",
        linkedIncidents: [],
      },
    },
  ],
};

const selectedResources = {
  resources: [
    {
      id: environmentId,
      tags: [],
      linkedScenario: {
        id: scenarioId,
        name: "Smoke Test",
        linkedIncidents: [
          { id: "INC-1", externalIssueId: null, externalIssueLink: null },
        ],
      },
    },
  ],
};

const projectId = "projectId";
const processId = "processId";

const REQUIRED_INPUTS = {
  mode: "edit" as "edit" | "readonly",
  projectId: projectId,
  processId: processId,
  preselectedEnvironmentIds: [] as string[],
  preselectedScenarioIds: [] as string[],
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(KeepEnvironmentsTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      {
        provide: FurtherAnalysisService,
        useValue: mockFurtherAnalysisService,
      },
      {
        provide: ToastMessageService,
        useValue: mockToastMessageService,
      },
    ],
  });
}

describe("KeepEnvironmentsTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFurtherAnalysisService.getFurtherAnalysisCandidates.mockReturnValue(
      of(candidates)
    );
    mockFurtherAnalysisService.getSelectedResources.mockReturnValue(
      of(selectedResources)
    );
  });

  it("given the user is viewing the component in edit mode, then the component should fetch the further analysis candidates", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(
        mockFurtherAnalysisService.getFurtherAnalysisCandidates
      ).toHaveBeenCalledWith(projectId, processId);
    });
  });

  it("given no candidates exist when the user is viewing the component in edit mode, then the component should display a banner indicating this to the user", async () => {
    mockFurtherAnalysisService.getFurtherAnalysisCandidates.mockReturnValue(
      of({ candidates: [] })
    );

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(
          /There are no valid test executions or environments to keep after this business process is closed./
        )
      ).toBeTruthy();
    });
  });

  it("given the user is viewing the component in readonly mode, then the component should fetch the selected resources for further analysis", async () => {
    await renderComponent({ mode: "readonly" });

    await waitFor(() => {
      expect(
        mockFurtherAnalysisService.getSelectedResources
      ).toHaveBeenCalledWith(projectId, processId);
    });
  });

  it("given no resources are selected for further analysis when the user is viewing the component in readonly mode, then the component should display a banner indicating this to the user", async () => {
    mockFurtherAnalysisService.getSelectedResources.mockReturnValue(
      of({ resources: [] })
    );

    await renderComponent({ mode: "readonly" });

    await waitFor(() => {
      expect(
        screen.getByText(
          /No test scenarios or environments were selected to be kept. All scenarios and environments will be cleaned up when the business process ends./
        )
      ).toBeTruthy();
    });
  });

  it("given a failure occurs when fetching candidates, then an error toast is displayed with the error message", async () => {
    mockFurtherAnalysisService.getFurtherAnalysisCandidates.mockReturnValue(
      throwError(() => new Error("Failed to fetch candidates"))
    );

    await renderComponent();

    await waitFor(() => {
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to fetch candidates"
      );
    });
  });

  it("given a failure occurs when fetching selected resources, then an error toast is displayed with the error message", async () => {
    mockFurtherAnalysisService.getSelectedResources.mockReturnValue(
      throwError(() => new Error("Failed to fetch resources"))
    );

    await renderComponent({ mode: "readonly" });

    await waitFor(() => {
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to fetch resources"
      );
    });
  });

  it("given the user selected an environment without a linked scenario, then the component emits the environment id", async () => {
    const referenceEnvironment = {
      id: environmentId,
      tags: ["standalone"],
      linkedScenario: undefined,
    };
    const { fixture } = await renderComponent();
    const emitSpy = jest.fn();
    fixture.componentInstance.selectionChanged.subscribe(emitSpy);

    await waitFor(() => {
      expect(screen.queryByRole("grid")).toBeTruthy();
    });

    const mockEvent = {
      api: {
        getSelectedRows: () => [referenceEnvironment],
      },
    } as Pick<SelectionChangedEvent, "api">;

    fixture.componentInstance.onSelectionChanged(
      mockEvent as SelectionChangedEvent
    );

    expect(emitSpy).toHaveBeenCalledWith({
      environmentIds: [environmentId],
      scenarioIds: [],
    });
  });

  it("given the user selected an environment with a linked scenario, then the component emits the scenario id", async () => {
    const environmentWithLinkedScenario = {
      id: environmentId,
      tags: ["regression"],
      linkedScenario: {
        id: scenarioId,
        name: "Smoke Test",
        linkedIncidents: [
          { id: "INC-1", externalIssueId: null, externalIssueLink: null },
        ],
      },
    };

    const { fixture } = await renderComponent();
    const emitSpy = jest.fn();
    fixture.componentInstance.selectionChanged.subscribe(emitSpy);

    await waitFor(() => {
      expect(screen.queryByRole("grid")).toBeTruthy();
    });

    const mockEvent = {
      api: {
        getSelectedRows: () => [environmentWithLinkedScenario],
      },
    } as Pick<SelectionChangedEvent, "api">;

    fixture.componentInstance.onSelectionChanged(
      mockEvent as SelectionChangedEvent
    );

    expect(emitSpy).toHaveBeenCalledWith({
      environmentIds: [],
      scenarioIds: [scenarioId],
    });
  });

  it("given a candidate is a reference environment, then a 'Ref env' label is displayed in the row of the corresponding candidate in the table", async () => {
    mockFurtherAnalysisService.getFurtherAnalysisCandidates.mockReturnValue(
      of({
        candidates: [
          {
            id: environmentId,
            tags: ["REFERENCE_ENVIRONMENT"],
            linkedScenario: {
              id: scenarioId,
              name: "Smoke Test",
              linkedIncidents: [],
            },
          },
        ],
      })
    );

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Ref env")).toBeTruthy();
    });
  });

  it("given the user selected environments without linked scenarios, when they navigate from the keep environments step, then the environment selection is preserved", async () => {
    const { fixture } = await renderComponent({
      preselectedEnvironmentIds: ["environmentId", "environmentId2"],
    });

    const row1 = {
      data: { id: "environmentId", linkedScenario: undefined },
      setSelected: jest.fn(),
    };
    const row2 = {
      data: { id: "environmentId2", linkedScenario: undefined },
      setSelected: jest.fn(),
    };
    const row3 = {
      data: { id: "environmentId3", linkedScenario: undefined },
      setSelected: jest.fn(),
    };

    const mockEvent = {
      api: {
        forEachNode: (cb) => {
          [row1, row2, row3].forEach(cb);
        },
      },
    } as unknown as FirstDataRenderedEvent;

    fixture.componentInstance.onFirstDataRendered(mockEvent);

    expect(row1.setSelected).toHaveBeenCalledWith(true);
    expect(row2.setSelected).toHaveBeenCalledWith(true);
    expect(row3.setSelected).not.toHaveBeenCalled();
  });

  it("given the user selected environments with linked scenarios, when they navigate from the keep environments step, then the scenario selection is preserved", async () => {
    const { fixture } = await renderComponent({
      preselectedScenarioIds: ["scenarioId"],
    });

    const row1 = {
      data: {
        id: environmentId,
        linkedScenario: {
          id: "scenarioId",
          name: "Smoke Test",
          linkedIncidents: [],
        },
      },
      setSelected: jest.fn(),
    };
    const row2 = {
      data: {
        id: environmentId2,
        linkedScenario: {
          id: "scenarioId2",
          name: "Other Test",
          linkedIncidents: [],
        },
      },
      setSelected: jest.fn(),
    };
    const row3 = {
      data: { id: environmentId3, linkedScenario: undefined },
      setSelected: jest.fn(),
    };

    const mockEvent = {
      api: {
        forEachNode: (cb) => {
          [row1, row2, row3].forEach(cb);
        },
      },
    } as unknown as FirstDataRenderedEvent;

    fixture.componentInstance.onFirstDataRendered(mockEvent);

    expect(row1.setSelected).toHaveBeenCalledWith(true);
    expect(row2.setSelected).not.toHaveBeenCalled();
    expect(row3.setSelected).not.toHaveBeenCalled();
  });

  it("given the candidates are being fetched in edit mode, then the grid is displayed with a loading overlay", async () => {
    const subject = new Subject<typeof candidates>();
    mockFurtherAnalysisService.getFurtherAnalysisCandidates.mockReturnValue(
      subject
    );

    await renderComponent({ mode: "edit" });

    expect(screen.queryByRole("grid")).toBeTruthy();
    expect(
      document.querySelector("mxevolve-table-loading-overlay")
    ).toBeTruthy();
  });

  it("given the candidates have been fetched in edit mode, then the loading overlay is no longer displayed", async () => {
    const subject = new Subject<typeof candidates>();
    mockFurtherAnalysisService.getFurtherAnalysisCandidates.mockReturnValue(
      subject
    );

    await renderComponent({ mode: "edit" });

    subject.next(candidates);
    subject.complete();

    await waitFor(() => {
      expect(screen.queryByRole("grid")).toBeTruthy();
    });

    expect(document.querySelector("mxevolve-table-loading-overlay")).toBeNull();
  });

  it("given the selected resources are being fetched in readonly mode, then the grid is displayed with a loading overlay", async () => {
    const subject = new Subject<typeof selectedResources>();
    mockFurtherAnalysisService.getSelectedResources.mockReturnValue(subject);

    await renderComponent({ mode: "readonly" });

    expect(screen.queryByRole("grid")).toBeTruthy();
    expect(
      document.querySelector("mxevolve-table-loading-overlay")
    ).toBeTruthy();
  });

  it("given the selected resources have been fetched in readonly mode, then the loading overlay is no longer displayed", async () => {
    const subject = new Subject<typeof selectedResources>();
    mockFurtherAnalysisService.getSelectedResources.mockReturnValue(subject);

    await renderComponent({ mode: "readonly" });

    subject.next(selectedResources);
    subject.complete();

    await waitFor(() => {
      expect(screen.queryByRole("grid")).toBeTruthy();
    });

    expect(document.querySelector("mxevolve-table-loading-overlay")).toBeNull();
  });
});
