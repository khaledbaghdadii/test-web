import { SingleSelectIncidentTableComponent } from "./single-select-incident-table.component";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { IncidentService } from "../incident.service";
import { Incident } from "../model/incident.model";
import { IncidentPage } from "../model/incident-page.model";
import { Observable, Subject } from "rxjs";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";
import { Table, TableModule } from "primeng/table";
import { FormsModule } from "@angular/forms";
import { RadioButtonModule } from "primeng/radiobutton";
import { SkeletonModule } from "primeng/skeleton";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DomTestUtils } from "@mxevolve/testing";

function createIncident(id: string, title: string, ticketId: string): Incident {
  return {
    id,
    title,
    status: "Open",
    reporter: "john.doe",
    externalIssue: {
      id: ticketId,
      origin: "Jira",
      link: `https://jira.example.com/browse/${ticketId}`,
    },
  };
}

function createIncidentPage(
  incidents: Incident[],
  total?: number
): IncidentPage {
  return {
    content: incidents,
    totalElements: total ?? incidents.length,
    totalPages: Math.ceil((total ?? incidents.length) / 10),
    size: 10,
    number: 0,
    last: true,
  };
}

interface TestInputs {
  refresh: Observable<void>;
}

describe("SingleSelectIncidentComponent", () => {
  let fixture: MockedComponentFixture<
    SingleSelectIncidentTableComponent,
    TestInputs
  >;
  let component: SingleSelectIncidentTableComponent;
  let incidentService: IncidentService;
  let refreshSubject: Subject<void>;
  let fetchSubject: Subject<IncidentPage>;

  const mockIncidents = [
    createIncident("INC-001", "Database Connection Timeout", "JIRA-101"),
    createIncident("INC-002", "API Gateway Failure", "JIRA-102"),
    createIncident("INC-003", "Memory Leak Detected", "JIRA-103"),
  ];

  beforeEach(async () => {
    refreshSubject = new Subject<void>();
    fetchSubject = new Subject<IncidentPage>();

    await MockBuilder(SingleSelectIncidentTableComponent)
      .keep(TableModule)
      .keep(FormsModule)
      .keep(RadioButtonModule)
      .keep(SkeletonModule)
      .keep(CommonModule)
      .keep(ButtonModule)
      .provide(provideNoopAnimations())
      .mock(IncidentService, {
        fetch: jest.fn(() => fetchSubject.asObservable()),
      });

    fixture = MockRender(SingleSelectIncidentTableComponent, {
      refresh: refreshSubject.asObservable(),
    });
    component = fixture.point.componentInstance;
    incidentService = ngMocks.get(IncidentService);
    fixture.detectChanges();
  });

  function applyTableFilter(field: string, value: string | null) {
    const table = getTableInstance();
    if (value) {
      table.filters[field] = [{ value, matchMode: "contains" }];
    } else {
      table.filters[field] = [{ value: null, matchMode: "contains" }];
    }
    table.onLazyLoad.emit({
      first: 0,
      rows: table.rows,
      filters: table.filters,
    });
    fixture.detectChanges();
  }

  function changePage(pageIndex: number, pageSize: number = 10) {
    const table = getTableInstance();
    table.onLazyLoad.emit({
      first: pageIndex * pageSize,
      rows: pageSize,
      filters: table.filters,
    });
    fixture.detectChanges();
  }

  function changePageSize(newSize: number) {
    const table = getTableInstance();
    table.onLazyLoad.emit({
      first: 0,
      rows: newSize,
      filters: table.filters,
    });
    fixture.detectChanges();
  }

  describe("Viewing Available Incidents", () => {
    it("given the user opens the incident selector, then available incidents should be displayed", () => {
      triggerRefresh();
      completeDataFetch();

      const rows = getTableRows();
      expect(rows.length).toBe(3);
      expect(rows[0].textContent).toContain("Database Connection Timeout");
      expect(rows[1].textContent).toContain("API Gateway Failure");
      expect(rows[2].textContent).toContain("Memory Leak Detected");
    });

    it("given the user is viewing incidents, when incidents are loading, then a loading state should be shown", () => {
      triggerRefresh();

      expect(component.isTableLoading).toBe(true);
      const skeletons = getSkeletonRows();
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("given the user is viewing incidents, when loading completes, then the loading state should be removed", () => {
      triggerRefresh();
      completeDataFetch();

      expect(component.isTableLoading).toBe(false);
      const skeletons = getSkeletonRows();
      expect(skeletons.length).toBe(0);
    });

    it("given the user is viewing incidents, when no incidents exist, then an empty message should be displayed", () => {
      triggerRefresh();
      completeDataFetch([]);

      const emptyMessage = getEmptyMessage();
      expect(emptyMessage?.textContent).toContain("No incidents found");
    });

    it("given the user opens the selector, then the system should request available incidents", () => {
      triggerRefresh();

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          queryParams: expect.objectContaining({ page: 0, size: 10 }),
        })
      );
    });
  });

  describe("Selecting an Incident", () => {
    it("given the user sees available incidents, when they click on an incident, then it should be marked as selected", () => {
      triggerRefresh();
      completeDataFetch();

      clickRadioButton("INC-002");

      expect(component.selectedIncident()).toEqual(
        expect.objectContaining({ id: "INC-002", title: "API Gateway Failure" })
      );
    });

    it("given the user has selected an incident, then the selection should be displayed above the table", () => {
      triggerRefresh();
      completeDataFetch();

      clickRadioButton("INC-001");

      const display = getSelectedIncidentDisplay();
      expect(display?.textContent).toContain("Database Connection Timeout");
      expect(display?.textContent).toContain("JIRA-101");
    });

    it("given the user has selected an incident, when they select a different one, then the new selection should replace the old", () => {
      triggerRefresh();
      completeDataFetch();

      clickRadioButton("INC-001");
      clickRadioButton("INC-003");

      expect(component.selectedIncident()).toEqual(
        expect.objectContaining({
          id: "INC-003",
          title: "Memory Leak Detected",
        })
      );
      const display = getSelectedIncidentDisplay();
      expect(display?.textContent).toContain("Memory Leak Detected");
    });

    it("given the user had a pre-selected incident, when the selector opens, then that incident should already be marked", () => {
      const preSelectedIncident = mockIncidents[1];
      component.selectedIncident.set(preSelectedIncident);
      fixture.detectChanges();

      expect(component.selectedIncident()).toEqual(preSelectedIncident);
      const display = getSelectedIncidentDisplay();
      expect(display?.textContent).toContain("API Gateway Failure");
    });
  });

  describe("Clearing Selection", () => {
    it("given the user has selected an incident, when they click clear, then the selection should be removed", () => {
      triggerRefresh();
      completeDataFetch();
      clickRadioButton("INC-001");

      getClearButton().click();

      expect(component.selectedIncident()).toBeUndefined();
    });

    it("given the user cleared the selection, then the selection display should not be shown", () => {
      triggerRefresh();
      completeDataFetch();
      clickRadioButton("INC-001");

      getClearButton().click();

      const display = getSelectedIncidentDisplay();
      expect(display).toBeNull();
    });
  });

  describe("Refreshing Data", () => {
    it("given the user already loaded incidents, when a refresh is triggered, then fresh data should be fetched", () => {
      triggerRefresh();
      completeDataFetch();
      jest.clearAllMocks();

      triggerRefresh();

      expect(incidentService.fetch).toHaveBeenCalledTimes(1);
    });

    it("given the user had applied filters, when a refresh is triggered, then filters should be reset", () => {
      component.incidentsQuery.titlePhrase = "some filter";
      component.incidentsQuery.page = 2;

      triggerRefresh();

      expect(component.incidentsQuery.page).toBe(0);
      expect(component.incidentsQuery.titlePhrase).toBeUndefined();
    });
  });

  describe("Filtering Incidents", () => {
    it("given the user wants to find a specific incident, when they filter by title, then only matching incidents should be shown", () => {
      const filteredIncidents = [
        createIncident("INC-001", "Database Connection Timeout", "JIRA-101"),
      ];
      triggerRefresh();
      completeDataFetch();
      jest.clearAllMocks();

      applyTableFilter("titlePhrase", "Database");

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ titlePhrase: "Database" }),
        })
      );

      completeDataFetch(filteredIncidents);

      const rows = getTableRows();
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain("Database Connection Timeout");
    });

    it("given the user wants to find by ticket, when they filter by linked ticket ID, then only matching incidents should be shown", () => {
      const filteredIncidents = [
        createIncident("INC-002", "API Gateway Failure", "JIRA-102"),
      ];
      triggerRefresh();
      completeDataFetch();
      jest.clearAllMocks();

      applyTableFilter("externalIssueIdPhrase", "JIRA-102");

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            externalIssueIdPhrase: "JIRA-102",
          }),
        })
      );

      completeDataFetch(filteredIncidents);

      const rows = getTableRows();
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain("API Gateway Failure");
      expect(rows[0].textContent).toContain("JIRA-102");
    });

    it("given the user applied a filter, when they clear it, then all incidents should be fetched again", () => {
      triggerRefresh();
      completeDataFetch();

      applyTableFilter("titlePhrase", "Database");
      completeDataFetch([mockIncidents[0]]);
      jest.clearAllMocks();

      applyTableFilter("titlePhrase", null);

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ titlePhrase: undefined }),
        })
      );

      completeDataFetch(mockIncidents);

      const rows = getTableRows();
      expect(rows.length).toBe(3);
    });

    it("given the user applies multiple filters, then all filters should be sent to the service", () => {
      triggerRefresh();
      completeDataFetch();
      jest.clearAllMocks();

      applyTableFilter("titlePhrase", "API");
      completeDataFetch([mockIncidents[1]]);
      jest.clearAllMocks();

      applyTableFilter("externalIssueIdPhrase", "JIRA");

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            titlePhrase: "API",
            externalIssueIdPhrase: "JIRA",
          }),
        })
      );
    });
  });

  describe("Pagination", () => {
    it("given the user is on page 1, when they navigate to page 2, then page 2 data should be requested", () => {
      triggerRefresh();
      completeDataFetch();
      jest.clearAllMocks();

      changePage(1);

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          queryParams: expect.objectContaining({ page: 1, size: 10 }),
        })
      );
    });

    it("given the user is viewing 10 items per page, when they change to 25 items per page, then 25 items should be requested", () => {
      triggerRefresh();
      completeDataFetch();
      jest.clearAllMocks();

      changePageSize(25);

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          queryParams: expect.objectContaining({ page: 0, size: 25 }),
        })
      );
    });

    it("given the user is on page 3, when they change page size, then they should be reset to page 1", () => {
      triggerRefresh();
      completeDataFetch();
      changePage(2);
      completeDataFetch();
      jest.clearAllMocks();

      changePageSize(25);

      expect(incidentService.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          queryParams: expect.objectContaining({ page: 0, size: 25 }),
        })
      );
    });
  });

  describe("Cleanup on Destroy", () => {
    it("given incidents are being fetched, when the selector is closed, then the pending request should be cancelled", () => {
      triggerRefresh();
      fixture.destroy();
      fetchSubject.next(createIncidentPage(mockIncidents));

      expect(component.incidents()).toEqual([]);
    });
  });

  function triggerRefresh() {
    refreshSubject.next();
    fixture.detectChanges();
  }

  function completeDataFetch(incidents: Incident[] = mockIncidents) {
    fetchSubject.next(createIncidentPage(incidents));
    fetchSubject.complete();
    fetchSubject = new Subject<IncidentPage>();
    jest
      .spyOn(incidentService, "fetch")
      .mockReturnValue(fetchSubject.asObservable());
    fixture.detectChanges();
  }

  function getTableRows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("tbody tr"));
  }

  function clickRadioButton(incidentId: string) {
    const radioButtonDebug = fixture.debugElement.query(
      By.css(`[data-testid="${incidentId}"]`)
    );
    const radioButtonComponent = radioButtonDebug.componentInstance;
    radioButtonComponent.onClick.emit();
    fixture.detectChanges();
  }

  function getSelectedIncidentDisplay(): HTMLElement | null {
    return fixture.nativeElement.querySelector(".bg-gray-50");
  }

  function getClearButton() {
    return DomTestUtils.getButtonByTestId(fixture, "clear-selection-button");
  }

  function getEmptyMessage(): HTMLElement | null {
    return fixture.nativeElement.querySelector('td[colspan="5"]');
  }

  function getSkeletonRows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("p-skeleton"));
  }

  function getTableInstance(): Table {
    return ngMocks.find(Table).componentInstance;
  }
});
