import { IncidentsSelectionTableComponent } from "./incidents-selection-table.component";
import {
  INCIDENT_1,
  INCIDENT_2,
  INCIDENT_STATUS_OPTIONS,
} from "../incident-test-utils";
import { TableModule } from "primeng/table";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture } from "@angular/core/testing";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { Checkbox } from "primeng/checkbox";
import { Paginator, PaginatorModule } from "primeng/paginator";
import { render, screen, waitFor, within } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { signal } from "@angular/core";
import { IncidentsTableStateService } from "./incidents-table-state.service";
import { Skeleton, SkeletonModule } from "primeng/skeleton";
import {
  TableCheckboxFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { PreviouslyLinkedFilter } from "@mxevolve/domains/test/model";
import { Tooltip } from "primeng/tooltip";
import { Subject } from "rxjs";

describe("IncidentsSelectionTableComponent", () => {
  const incidentTableStateService = {
    incidents: signal([INCIDENT_1, INCIDENT_2]),
    page: signal(0),
    size: signal(0),
    total: signal(0),
    isLoading: signal(false),
    statusOptions: signal<{ text: string; value: string }[]>([]),
    errorMessage: signal<string | undefined>(undefined),
    statusesErrorMessage: signal<string | undefined>(undefined),
    setPreviouslyLinkedFilterCriteria: jest.fn(),
    setIncidentsTableQuery: jest.fn(),
    refresh: jest.fn(),
  };

  const toastMessageService = {
    showError: jest.fn(),
  };

  const refreshSubject = new Subject<boolean>();

  const INITIALLY_SELECTED_INCIDENTS: AnalysisObjectSelectionState<AnalysisObject>[] =
    [
      {
        analysisObject: INCIDENT_1,
        selectionType: AnalysisObjectSelectionType.FULL,
      },
      {
        analysisObject: INCIDENT_2,
        selectionType: AnalysisObjectSelectionType.PARTIAL,
        selectionMessage: "Linked to some things",
      },
    ];

  const REQUIRED_INPUTS = {
    refresh: refreshSubject,
  };

  type RenderInputs = Partial<typeof REQUIRED_INPUTS> & {
    initiallySelectedIncidents?: AnalysisObjectSelectionState<AnalysisObject>[];
    previouslyLinkedFilter?: PreviouslyLinkedFilter;
  };

  async function renderComponent(inputs: RenderInputs = {}) {
    return render(IncidentsSelectionTableComponent, {
      inputs: { ...REQUIRED_INPUTS, ...inputs },
      componentImports: [
        IncidentsSelectionTableComponent,
        Checkbox,
        Tooltip,
        PaginatorModule,
        TableCheckboxFilterComponent,
        TableModule,
        SkeletonModule,
        MockComponent(SelectedAnalysisObjectsListingComponent),
        MockComponent(TableEmptyMessageComponent),
      ],
      componentProviders: [
        {
          provide: IncidentsTableStateService,
          useValue: incidentTableStateService,
        },
        {
          provide: AnalysisObjectTableSelectionStateService,
          useClass: AnalysisObjectTableSelectionStateService,
        },
      ],
      providers: [
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    });
  }

  function getDataRows() {
    return screen
      .queryAllByRole("row")
      .filter((row) => within(row).queryAllByRole("cell").length > 0);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    incidentTableStateService.incidents.set([INCIDENT_1, INCIDENT_2]);
    incidentTableStateService.statusOptions.set([]);
    incidentTableStateService.isLoading.set(false);
    incidentTableStateService.errorMessage.set(undefined);
    incidentTableStateService.statusesErrorMessage.set(undefined);
    incidentTableStateService.page.set(0);
    incidentTableStateService.size.set(10);
    incidentTableStateService.total.set(2);
  });

  it("should create", async () => {
    const { fixture } = await renderComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe("column headers", () => {
    it("renders the title column header", async () => {
      await renderComponent();
      expect(screen.getByRole("columnheader", { name: "Title" })).toBeTruthy();
    });

    it("renders the status column header", async () => {
      await renderComponent();
      expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    });

    it("renders the reporter column header", async () => {
      await renderComponent();
      expect(
        screen.getByRole("columnheader", { name: "Reporter" })
      ).toBeTruthy();
    });

    it("renders the assignee column header", async () => {
      await renderComponent();
      expect(
        screen.getByRole("columnheader", { name: "Assignee" })
      ).toBeTruthy();
    });

    it("renders the linked ticket id column header", async () => {
      await renderComponent();
      expect(
        screen.getByRole("columnheader", { name: "Linked Ticket ID" })
      ).toBeTruthy();
    });
  });

  describe("data rows", () => {
    it("renders a row for every incident", async () => {
      await renderComponent();
      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });

    it("should display a checkbox in the first column for each incident", async () => {
      await renderComponent();
      const dataRows = getDataRows();
      dataRows.forEach((row) => {
        const checkbox = within(row).getAllByRole("checkbox")[0];
        expect(checkbox).toBeTruthy();
      });
    });

    it("renders the incident title", async () => {
      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getAllByRole("cell")[1].textContent?.trim()
      ).toBe(INCIDENT_1.title);
      expect(
        within(dataRows[1]).getAllByRole("cell")[1].textContent?.trim()
      ).toBe(INCIDENT_2.title);
    });

    it("renders the incident status", async () => {
      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getAllByRole("cell")[2].textContent?.trim()
      ).toBe(INCIDENT_1.status);
      expect(
        within(dataRows[1]).getAllByRole("cell")[2].textContent?.trim()
      ).toBe(INCIDENT_2.status);
    });

    it("renders a link with the external issue id", async () => {
      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getByRole("link", {
          name: INCIDENT_1.externalIssue.id,
        })
      ).toBeTruthy();
      expect(
        within(dataRows[1]).getByRole("link", {
          name: INCIDENT_2.externalIssue.id,
        })
      ).toBeTruthy();
    });

    it("redirects to the external issue link when clicked", async () => {
      await renderComponent();
      const dataRows = getDataRows();

      const link = within(dataRows[0]).getByRole("link", {
        name: INCIDENT_1.externalIssue.id,
      });
      expect(link.getAttribute("href")).toBe(INCIDENT_1.externalIssue.link);
    });

    it("renders the incident reporter", async () => {
      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getAllByRole("cell")[4].textContent?.trim()
      ).toBe(INCIDENT_1.reporter);
      expect(
        within(dataRows[1]).getAllByRole("cell")[4].textContent?.trim()
      ).toBe(INCIDENT_2.reporter);
    });

    it("shows a dash when the reporter is not available", async () => {
      incidentTableStateService.incidents.set([
        { ...INCIDENT_1, reporter: undefined },
      ]);

      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getAllByRole("cell")[4].textContent?.trim()
      ).toBe("-");
    });

    it("renders the incident assignee", async () => {
      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getAllByRole("cell")[5].textContent?.trim()
      ).toBe(INCIDENT_1.assignee);
      expect(
        within(dataRows[1]).getAllByRole("cell")[5].textContent?.trim()
      ).toBe(INCIDENT_2.assignee);
    });

    it("shows a dash when the assignee is not available", async () => {
      incidentTableStateService.incidents.set([
        { ...INCIDENT_1, assignee: undefined },
      ]);

      await renderComponent();
      const dataRows = getDataRows();

      expect(
        within(dataRows[0]).getAllByRole("cell")[5].textContent?.trim()
      ).toBe("-");
    });
  });

  describe("table loading state", () => {
    it("displays table loading state when incidents are being fetched", async () => {
      incidentTableStateService.isLoading.set(true);
      await renderComponent();
      expect(ngMocks.findAll(Skeleton)).toHaveLength(60);
    });

    it("displays table loading state when selected incidents are being fetched", async () => {
      incidentTableStateService.isLoading.set(true);
      await renderComponent();
      expect(ngMocks.findAll(Skeleton)).toHaveLength(60);
    });
  });

  describe("empty table", () => {
    it("should display empty table message when there are no incidents", async () => {
      incidentTableStateService.incidents.set([]);
      await renderComponent();
      expect(ngMocks.findInstance(TableEmptyMessageComponent)).toBeTruthy();
    });
  });

  describe("table pagination", () => {
    it("renders the paginator", async () => {
      await renderComponent();
      expect(ngMocks.findInstance(Paginator)).toBeTruthy();
    });

    it("displays total number of incidents in the paginator", async () => {
      incidentTableStateService.total.set(2);
      await renderComponent();
      const paginator = ngMocks.findInstance(Paginator);
      expect(paginator.totalRecords).toBe(2);
    });

    it("displays the correct number of rows per page in the paginator", async () => {
      incidentTableStateService.size.set(10);
      await renderComponent();
      const paginator = ngMocks.findInstance(Paginator);
      expect(paginator.rows).toBe(10);
    });
  });

  describe("filtering", () => {
    async function applyTextFilter(
      columnHeaderName: string | RegExp,
      filterValue: string
    ) {
      const user = userEvent.setup();

      const columnHeader = screen.getByRole("columnheader", {
        name: columnHeaderName,
      });
      await user.click(within(columnHeader).getByRole("button"));

      const filterInput = await screen.findByRole("textbox");
      await user.type(filterInput, filterValue);
      await user.click(screen.getByRole("button", { name: "Apply" }));
    }

    async function applyCheckboxFilter(
      columnHeaderName: string | RegExp,
      optionText: string
    ) {
      const user = userEvent.setup();

      const columnHeader = screen.getByRole("columnheader", {
        name: columnHeaderName,
      });
      await user.click(within(columnHeader).getByRole("button"));

      const optionLabel = await screen.findByText(optionText);
      const optionCheckbox = within(
        optionLabel.closest(".field-checkbox") as HTMLElement
      ).getByRole("checkbox");
      await user.click(optionCheckbox);
    }

    it("should apply the title filter", async () => {
      await renderComponent();

      await applyTextFilter(/Title/, "title-1");

      await waitFor(() => {
        expect(
          incidentTableStateService.setIncidentsTableQuery
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            titlePhrase: "title-1",
          })
        );
      });
    });

    it("should populate the status filter options", async () => {
      const user = userEvent.setup();
      incidentTableStateService.statusOptions.set(INCIDENT_STATUS_OPTIONS);

      await renderComponent();

      const statusHeader = screen.getByRole("columnheader", { name: /Status/ });
      await user.click(within(statusHeader).getByRole("button"));

      for (const option of INCIDENT_STATUS_OPTIONS) {
        expect(await screen.findByText(option.text)).toBeTruthy();
      }
    });

    it("should update the incidents table query when a status filter is applied", async () => {
      incidentTableStateService.statusOptions.set(INCIDENT_STATUS_OPTIONS);

      await renderComponent();

      await applyCheckboxFilter(/Status/, INCIDENT_STATUS_OPTIONS[0].text);

      await waitFor(() => {
        expect(
          incidentTableStateService.setIncidentsTableQuery
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            statuses: [INCIDENT_STATUS_OPTIONS[0].value],
          })
        );
      });
    });

    it("should apply the linked ticket id filter", async () => {
      await renderComponent();

      await applyTextFilter(/Linked Ticket ID/, "ticket-1");

      await waitFor(() => {
        expect(
          incidentTableStateService.setIncidentsTableQuery
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            externalIssueIdPhrase: "ticket-1",
          })
        );
      });
    });

    it("should apply the reporter filter", async () => {
      await renderComponent();

      await applyTextFilter(/Reporter/, "reporter-1");

      await waitFor(() => {
        expect(
          incidentTableStateService.setIncidentsTableQuery
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            reporterPhrase: "reporter-1",
          })
        );
      });
    });

    it("should apply the assignee filter", async () => {
      await renderComponent();

      await applyTextFilter(/Assignee/, "assignee-1");

      await waitFor(() => {
        expect(
          incidentTableStateService.setIncidentsTableQuery
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            assigneePhrase: "assignee-1",
          })
        );
      });
    });

    it("should apply all filters together", async () => {
      incidentTableStateService.statusOptions.set(INCIDENT_STATUS_OPTIONS);
      await renderComponent();

      await applyTextFilter(/Title/, "title-1");
      await applyTextFilter(/Linked Ticket ID/, "ticket-1");
      await applyTextFilter(/Reporter/, "reporter-1");
      await applyTextFilter(/Assignee/, "assignee-1");
      await applyCheckboxFilter(/Status/, INCIDENT_STATUS_OPTIONS[0].text);

      await waitFor(() => {
        expect(
          incidentTableStateService.setIncidentsTableQuery
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            titlePhrase: "title-1",
            externalIssueIdPhrase: "ticket-1",
            reporterPhrase: "reporter-1",
            assigneePhrase: "assignee-1",
            statuses: [INCIDENT_STATUS_OPTIONS[0].value],
          })
        );
      });
    });
  });

  describe("upon refresh", () => {
    it("should update the incidents table when refresh is true", async () => {
      await renderComponent();
      refreshSubject.next(true);
      await waitFor(() => {
        expect(incidentTableStateService.refresh).toHaveBeenCalledWith();
      });
    });

    it("should not fetch the incidents again if refresh is false", async () => {
      await renderComponent();
      refreshSubject.next(false);
      await waitFor(() => {
        expect(incidentTableStateService.refresh).not.toHaveBeenCalled();
      });
    });

    it("should not fetch the incidents again if the component is destroyed", async () => {
      const { fixture } = await renderComponent();
      fixture.destroy();
      refreshSubject.next(true);
      await waitFor(() => {
        expect(incidentTableStateService.refresh).not.toHaveBeenCalled();
      });
    });
  });

  describe("upon setting previously linked filter input", () => {
    it("should set the previously linked filter criteria in the state service", async () => {
      const previouslyLinkedFilter: PreviouslyLinkedFilter = {
        testCaseExternalIds: ["test-case-1", "test-case-2"],
        scenarioDefinitionId: "scenario-1",
      };
      await renderComponent({ previouslyLinkedFilter: previouslyLinkedFilter });
      expect(
        incidentTableStateService.setPreviouslyLinkedFilterCriteria
      ).toHaveBeenCalledWith(previouslyLinkedFilter);
    });
  });

  describe("upon errors when fetching the data", () => {
    it("should display an error message when there is an error fetching incidents", async () => {
      incidentTableStateService.incidents.set([]);
      incidentTableStateService.errorMessage.set("Error fetching incidents");
      await renderComponent();
      await waitFor(() => {
        expect(toastMessageService.showError).toHaveBeenCalledWith(
          "Error fetching incidents"
        );
      });
    });

    it("should display an error message when there is an error fetching statuses", async () => {
      incidentTableStateService.statusesErrorMessage.set(
        "Error fetching statuses"
      );
      await renderComponent();
      await waitFor(() => {
        expect(toastMessageService.showError).toHaveBeenCalledWith(
          "Error fetching statuses"
        );
      });
    });
  });

  describe("table selection", () => {
    it("should initialize the selected incidents if they are fully selected", async () => {
      const { fixture } = await renderComponent({
        initiallySelectedIncidents: INITIALLY_SELECTED_INCIDENTS,
      });
      expect(isIncidentFullySelected(fixture, INCIDENT_1.id)).toBe(true);
    });

    it("should initialize the selected incidents if they are partially selected", async () => {
      const { fixture } = await renderComponent({
        initiallySelectedIncidents: INITIALLY_SELECTED_INCIDENTS,
      });
      expect(isIncidentPartiallySelected(fixture, INCIDENT_2.id)).toBe(true);
    });

    it("should display a tooltip for a selected incident when its checkbox is hovered over and a selection message exists", async () => {
      await renderComponent({
        initiallySelectedIncidents: INITIALLY_SELECTED_INCIDENTS,
      });
      const dataRows = getDataRows();
      const checkbox = within(dataRows[1]).getAllByRole("checkbox")[0];
      const user = userEvent.setup();
      await user.hover(checkbox);
      await waitFor(() => {
        expect(screen.getByText("Linked to some things")).toBeTruthy();
      });
    });

    it("should not display a tooltip for a selected incident when its checkbox is hovered over and no selection message exists", async () => {
      await renderComponent({
        initiallySelectedIncidents: INITIALLY_SELECTED_INCIDENTS,
      });
      const dataRows = getDataRows();
      const checkbox = within(dataRows[0]).getAllByRole("checkbox")[0];
      const user = userEvent.setup();
      await user.hover(checkbox);
      await waitFor(() => {
        expect(screen.queryByText("Linked to some things")).toBeNull();
      });
    });

    it("should select an incident when its checkbox is clicked", async () => {
      const { fixture } = await renderComponent();
      await selectIncidentRow(0);
      await selectIncidentRow(1);
      await waitFor(() => {
        expect(isIncidentFullySelected(fixture, INCIDENT_1.id)).toBe(true);
        expect(isIncidentFullySelected(fixture, INCIDENT_2.id)).toBe(true);
      });
    });

    it("should deselect an incident when its checkbox is clicked again", async () => {
      const { fixture } = await renderComponent();
      await selectIncidentRow(0);
      await selectIncidentRow(1);
      await selectIncidentRow(0);
      await waitFor(() => {
        expect(isIncidentFullySelected(fixture, INCIDENT_1.id)).toBe(false);
        expect(isIncidentFullySelected(fixture, INCIDENT_2.id)).toBe(true);
      });
    });
  });

  describe("selected analysis objects listing", () => {
    it("should pass the mapped selected incidents to the listing component", async () => {
      const { fixture } = await renderComponent({
        initiallySelectedIncidents: INITIALLY_SELECTED_INCIDENTS,
      });

      const listingComponent = ngMocks.find(
        fixture,
        SelectedAnalysisObjectsListingComponent
      );

      expect(
        ngMocks.input(listingComponent, "selectedAnalysisObjects")
      ).toEqual([
        {
          id: INCIDENT_1.id,
          title: INCIDENT_1.title,
          selectionType: AnalysisObjectSelectionType.FULL,
        },
        {
          id: INCIDENT_2.id,
          title: INCIDENT_2.title,
          selectionType: AnalysisObjectSelectionType.PARTIAL,
          selectionMessage: "Linked to some things",
        },
      ]);
    });

    it("should update the listing component when the selected incidents change", async () => {
      const { fixture } = await renderComponent();

      const listingComponent = ngMocks.find(
        fixture,
        SelectedAnalysisObjectsListingComponent
      );
      expect(
        ngMocks.input(listingComponent, "selectedAnalysisObjects")
      ).toEqual([]);

      await selectIncidentRow(0);

      await waitFor(() => {
        expect(
          ngMocks.input(listingComponent, "selectedAnalysisObjects")
        ).toEqual([expect.objectContaining({ id: INCIDENT_1.id })]);
      });

      await selectIncidentRow(1);

      await waitFor(() => {
        expect(
          ngMocks.input(listingComponent, "selectedAnalysisObjects")
        ).toEqual([
          expect.objectContaining({ id: INCIDENT_1.id }),
          expect.objectContaining({ id: INCIDENT_2.id }),
        ]);
      });
    });

    it("should remove the incident from the selection when an incident is removed from the listing component", async () => {
      const { fixture } = await renderComponent();

      const listingComponent = ngMocks.find(
        fixture,
        SelectedAnalysisObjectsListingComponent
      );

      await selectIncidentRow(0);
      await selectIncidentRow(1);

      ngMocks
        .output(listingComponent, "analysisObjectRemoved")
        .emit(INCIDENT_1.id);

      await waitFor(() => {
        expect(isIncidentFullySelected(fixture, INCIDENT_1.id)).toBe(false);
        expect(isIncidentFullySelected(fixture, INCIDENT_2.id)).toBe(true);
      });
    });
  });

  function isIncidentFullySelected(
    fixture: ComponentFixture<IncidentsSelectionTableComponent>,
    incidentId: string
  ): boolean | undefined {
    return (
      fixture.componentInstance
        .selectedIncidents()
        .find((incident) => incident.analysisObject.id === incidentId)
        ?.selectionType === AnalysisObjectSelectionType.FULL
    );
  }

  function isIncidentPartiallySelected(
    fixture: ComponentFixture<IncidentsSelectionTableComponent>,
    incidentId: string
  ): boolean | undefined {
    return (
      fixture.componentInstance
        .selectedIncidents()
        .find((incident) => incident.analysisObject.id === incidentId)
        ?.selectionType === AnalysisObjectSelectionType.PARTIAL
    );
  }

  async function selectIncidentRow(incidentRow: number) {
    const user = userEvent.setup();
    await user.click(
      within(getDataRows()[incidentRow]).getAllByRole("checkbox")[0]
    );
    return user;
  }
});
