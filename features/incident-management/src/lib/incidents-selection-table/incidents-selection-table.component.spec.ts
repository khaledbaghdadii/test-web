import { IncidentsSelectionTableComponent } from "./incidents-selection-table.component";
import { IncidentService } from "../incident.service";
import { of, Subject, throwError } from "rxjs";
import {
  getFullyCheckedIncident,
  INCIDENT_1,
  INCIDENT_2,
  INCIDENT_SECOND_PAGE,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_STATUSES,
  INCIDENT_TABLE_LAZY_LOAD_EVENT,
  INCIDENTS,
  INCIDENTS_QUERY,
} from "../incident-test-utils";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { IncidentPage } from "../model/incident-page.model";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { CheckboxChangeEvent } from "primeng/checkbox";
import { Incident } from "../model/incident.model";
import { CommonModule } from "@angular/common";
import { PaginatorModule } from "primeng/paginator";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import {
  IncidentsFetchRequest,
  IncidentsQueryParams,
} from "@mxflow/features/incident-management";
import { DomTestUtils } from "@mxevolve/testing";

describe("IncidentsSelectionTableComponent", () => {
  const refresh$ = new Subject<boolean>();
  let component: IncidentsSelectionTableComponent;
  let fixture: ComponentFixture<IncidentsSelectionTableComponent>;
  let incidentService: jest.Mocked<IncidentService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let selectionStateService: AnalysisObjectTableSelectionStateService;

  beforeEach(async () => {
    incidentService = {
      fetch: jest.fn(() => of(INCIDENT_SECOND_PAGE)),
      fetchAllStatuses: jest.fn(() => of(INCIDENT_STATUSES)),
    } as unknown as jest.Mocked<IncidentService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    selectionStateService = {
      computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection: jest
        .fn()
        .mockImplementation((incident, selected) => [
          ...selected,
          { analysisObject: incident } as any,
        ]),
      isAnalysisObjectFullySelected: jest.fn().mockReturnValue(true),
      isAnalysisObjectPartiallySelected: jest.fn().mockReturnValue(false),
    } as unknown as AnalysisObjectTableSelectionStateService;

    await TestBed.configureTestingModule({
      imports: [
        IncidentsSelectionTableComponent,
        CommonModule,
        TableModule,
        PaginatorModule,
      ],
      providers: [
        provideNoopAnimations(),
        { provide: IncidentService, useValue: incidentService },
        { provide: ToastMessageService, useValue: toastMessageService },
        {
          provide: AnalysisObjectTableSelectionStateService,
          useValue: selectionStateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsSelectionTableComponent);
    component = fixture.componentInstance;
    component.refresh = refresh$;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize table total to 0", () => {
    expect(component.total).toBe(0);
  });

  it("should initialize the initially selected incidents to empty array", () => {
    expect(component.selectedIncidents()).toEqual([]);
  });

  it("should initialize the selected incidents to empty array", () => {
    expect(component.incidents()).toEqual([]);
  });

  it("should initialize incident selections to empty array", () => {
    expect(component.incidentSelections()).toEqual([]);
  });

  it("should initialize incidentsQuery with default values", () => {
    expect(component.incidentsQuery).toEqual({
      page: 0,
      size: 10,
    });
  });

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(fixture, "all-incidents-table");
  }

  it("should set the table loading state to true if isTableLoading is true", () => {
    component.isTableLoading = true;
    component.selectedIncidentIdsLoading = false;
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to true if selectedIncidentIdsLoading is true", () => {
    component.selectedIncidentIdsLoading = true;
    component.isTableLoading = false;
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to false if both isTableLoading and selectedIncidentIdsLoading are false", () => {
    component.isTableLoading = false;
    component.selectedIncidentIdsLoading = false;
    fixture.detectChanges();
    expect(getTableHarness().isLoading()).toBe(false);
  });

  it("should set the table value to empty if isTableLoading is true", () => {
    component.isTableLoading = true;
    component.selectedIncidentIdsLoading = false;
    component.incidents.set(INCIDENTS);
    expect(getTableHarness().getValues()).toEqual([]);
  });

  it("should set the table value to empty if selectedIncidentIdsLoading is true", () => {
    component.selectedIncidentIdsLoading = true;
    component.isTableLoading = false;
    component.incidents.set(INCIDENTS);
    expect(getTableHarness().getValues()).toEqual([]);
  });

  it("should set the table value to incidentSelections when neither isTableLoading nor selectedIncidentIdsLoading are true", () => {
    component.isTableLoading = false;
    component.selectedIncidentIdsLoading = false;
    component.incidents.set(INCIDENTS);
    expect(getTableHarness().getValues()).toEqual([
      getFullyCheckedIncident(INCIDENT_1),
      getFullyCheckedIncident(INCIDENT_2),
    ]);
  });

  describe("refresh$", () => {
    it("should reset the query params when refresh is called", () => {
      component.incidentsQuery = { page: 1, size: 20 };
      refresh$.next(true);
      expect(component.incidentsQuery).toEqual({
        page: 0,
        size: 10,
      });
    });

    it("should fetch and init table when refresh is true", () => {
      refresh$.next(true);
      expect(incidentService.fetch).toHaveBeenCalled();
    });

    it("given that incidents are already selected, when refresh is triggered, then selected incidents should be preserved", () => {
      component.selectedIncidents.set([
        { analysisObject: { id: "test" } } as any,
      ]);

      refresh$.next(true);

      expect(component.selectedIncidents()).toEqual([
        { analysisObject: { id: "test" } },
      ]);
    });

    it("given that refresh is triggered, when table data is requested, then fetchTableData should be called", () => {
      jest.spyOn(component, "fetchTableData");

      refresh$.next(true);

      expect(component.fetchTableData).toHaveBeenCalledWith({
        queryParams: component.incidentsQuery,
        filters: {},
      });
    });

    it("should not fetch and init table when refresh is false", () => {
      refresh$.next(false);
      expect(incidentService.fetch).not.toHaveBeenCalled();
    });

    it("should stop fetching the incidents after component is destroyed", () => {
      component.ngOnDestroy();
      refresh$.next(true);
      expect(incidentService.fetch).not.toHaveBeenCalled();
    });

    it("should fetch all statuses when refresh is true", () => {
      refresh$.next(true);
      expect(incidentService.fetchAllStatuses).toHaveBeenCalled();
    });

    it("should not fetch all statuses when refresh is false", () => {
      refresh$.next(false);
      expect(incidentService.fetchAllStatuses).not.toHaveBeenCalled();
    });

    it("should stop fetching all statuses after component is destroyed", () => {
      component.ngOnDestroy();
      refresh$.next(true);
      expect(incidentService.fetchAllStatuses).not.toHaveBeenCalled();
    });

    it("should set the fetched status options", () => {
      refresh$.next(true);
      expect(component.statusOptions).toEqual(INCIDENT_STATUS_OPTIONS);
    });

    it("should display an error message on failure to fetch statuses", () => {
      const errorMessage = "Failed to fetch statuses";
      jest
        .spyOn(incidentService, "fetchAllStatuses")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      refresh$.next(true);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("handleTableQueryParamsChange", () => {
    it("should reset the fetched incidents", () => {
      const fetchSubject = new Subject<IncidentPage>();
      jest
        .spyOn(incidentService, "fetch")
        .mockReturnValue(fetchSubject.asObservable());
      component.incidents.set(INCIDENTS);
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.incidents()).toEqual([]);
    });

    describe("generate fetch incidents query", () => {
      it("should default page index to 0", () => {
        const event: TableLazyLoadEvent = {
          first: undefined,
          rows: 10,
        };

        component.handleTableQueryParamsChange(event);

        const expectedQuery: IncidentsQueryParams = {
          page: 0,
          size: 10,
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });

      it("should default the page size to 10", () => {
        const event: TableLazyLoadEvent = {
          first: 0,
          rows: undefined,
        };

        component.handleTableQueryParamsChange(event);
        const expectedQuery: IncidentsQueryParams = {
          page: 0,
          size: 10,
        };
        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });

      it("should set the page index correctly when first is defined", () => {
        const event: TableLazyLoadEvent = {
          first: 20,
          rows: 10,
        };

        component.handleTableQueryParamsChange(event);

        const expectedQuery: IncidentsQueryParams = {
          page: 2,
          size: 10,
        };
        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });

      it("should set the page index correctly when first is not divisible by page size", () => {
        const event: TableLazyLoadEvent = {
          first: 15,
          rows: 10,
        };

        component.handleTableQueryParamsChange(event);
        const expectedQuery: IncidentsQueryParams = {
          page: 1,
          size: 10,
        };
        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });

      it("should set the page size correctly when rows is defined", () => {
        const event: TableLazyLoadEvent = {
          first: 0,
          rows: 5,
        };

        component.handleTableQueryParamsChange(event);

        const expectedQuery: IncidentsQueryParams = {
          page: 0,
          size: 5,
        };
        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });

      it("should query filter criteria correctly when filtering by title", () => {
        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            titlePhrase: {
              value: "title",
            },
          },
        };

        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: INCIDENTS_QUERY,
          filters: {
            titlePhrase: "title",
          },
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should set query filter criteria correctly when filtering by statuses", () => {
        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            statuses: {
              value: ["PASSED", "FAILED"],
            },
          },
        };

        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: INCIDENTS_QUERY,
          filters: {
            statuses: ["PASSED", "FAILED"],
          },
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should set query filter criteria correctly when filtering by external issue id", () => {
        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            externalIssueIdPhrase: {
              value: "id",
            },
          },
        };

        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: INCIDENTS_QUERY,
          filters: {
            externalIssueIdPhrase: "id",
          },
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should set the reporter in the query filter criteria when filtering by reporter", () => {
        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            reporterPhrase: {
              value: "Sam",
            },
          },
        };

        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: INCIDENTS_QUERY,
          filters: {
            reporterPhrase: "Sam",
          },
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should set the assignee in the query filter criteria when filtering by assignee", () => {
        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            assigneePhrase: {
              value: "Jane",
            },
          },
        };

        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: INCIDENTS_QUERY,
          filters: {
            assigneePhrase: "Jane",
          },
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should remove filter criteria from query if it was removed when filtering", () => {
        component.incidentsQuery = {
          ...INCIDENTS_QUERY,
          titlePhrase: "title",
          statuses: ["PASSED"],
          externalIssueIdPhrase: "ext-id",
          reporterPhrase: "reporter",
          assigneePhrase: "assignee",
        };

        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            titlePhrase: undefined,
            statuses: undefined,
            externalIssueIdPhrase: undefined,
            reporterPhrase: undefined,
            assigneePhrase: undefined,
          },
        };
        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: INCIDENTS_QUERY,
          filters: {},
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should remove status from filter criteria is the selected statuses list is empty", () => {
        component.incidentsQuery = {
          ...INCIDENTS_QUERY,
          statuses: ["PASSED"],
        };

        const event: TableLazyLoadEvent = {
          ...INCIDENT_TABLE_LAZY_LOAD_EVENT,
          filters: {
            statuses: {
              value: [],
            },
          },
        };
        component.handleTableQueryParamsChange(event);

        const expectedQuery: IncidentsQueryParams = {
          page: 0,
          size: 10,
        };
        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });

      it("should set query filter criteria correctly when filtering all fields together", () => {
        const event: TableLazyLoadEvent = {
          first: 0,
          rows: 5,
          filters: {
            externalIssueIdPhrase: {
              value: "id",
            },
            statuses: {
              value: ["PASSED", "FAILED"],
            },
            titlePhrase: {
              value: "title",
            },
          },
        };

        component.handleTableQueryParamsChange(event);

        const expectedRequest: IncidentsFetchRequest = {
          queryParams: {
            page: 0,
            size: 5,
          },
          filters: {
            externalIssueIdPhrase: "id",
            titlePhrase: "title",
            statuses: ["PASSED", "FAILED"],
          },
        };

        expect(incidentService.fetch).toHaveBeenCalledWith(expectedRequest);
      });

      it("should set query filter criteria correctly when no filters are passed", () => {
        const event: TableLazyLoadEvent = {
          first: 0,
          rows: 10,
        };

        component.handleTableQueryParamsChange(event);

        const expectedQuery: IncidentsQueryParams = {
          page: 0,
          size: 10,
        };
        expect(incidentService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ queryParams: expectedQuery })
        );
      });
    });

    it("should set table loading to true when fetching data", () => {
      const fetchSubject = new Subject<IncidentPage>();
      jest
        .spyOn(incidentService, "fetch")
        .mockReturnValue(fetchSubject.asObservable());
      component.isTableLoading = false;
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.isTableLoading).toBe(true);
    });

    it("should set table loading to false when data is fetched", () => {
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.isTableLoading).toBe(false);
    });

    it("should set incidents to the fetched page content", () => {
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.incidents()).toEqual(INCIDENT_SECOND_PAGE.content);
    });

    it("should set total to the fetched page total elements", () => {
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.total).toBe(INCIDENT_SECOND_PAGE.totalElements);
    });

    it("should emit error message on failure to fetch incidents", () => {
      const errorMessage = "Failed to fetch incidents";
      jest
        .spyOn(incidentService, "fetch")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should empty the selected incidents if failed to fetch incidents", () => {
      component.selectedIncidents.set([{} as any]);
      const errorMessage = "Failed to fetch incidents";
      jest
        .spyOn(incidentService, "fetch")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.selectedIncidents()).toEqual([]);
    });

    it("should set table loading to false on failure to fetch incidents", () => {
      const errorMessage = "Failed to fetch incidents";
      jest
        .spyOn(incidentService, "fetch")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      component.isTableLoading = true;
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.isTableLoading).toBe(false);
    });

    it("should be called when the table emits a lazy load event", () => {
      const spy = jest.spyOn(component, "handleTableQueryParamsChange");
      const event: TableLazyLoadEvent = {
        first: 1,
        rows: 20,
      };
      getTableHarness().emitLazyLoadEvent(event);
      expect(spy).toHaveBeenCalledWith(event);
    });

    it("should add initially selected incidents not already present to selectedIncidents after fetching data", () => {
      const initialIncident = { analysisObject: { id: "1" } } as any;
      const newIncident = { analysisObject: { id: "2" } } as any;
      component.initiallySelectedIncidents = [initialIncident, newIncident];
      fixture.detectChanges();
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      const selected = component.selectedIncidents();
      expect(selected.length).toBe(2);
      expect(selected.some((sel) => sel.analysisObject.id === "1")).toBe(true);
      expect(selected.some((sel) => sel.analysisObject.id === "2")).toBe(true);
    });

    it("should not add any incidents if initiallySelectedIncidents is empty", () => {
      component.initiallySelectedIncidents = [];
      fixture.detectChanges();
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.selectedIncidents()).toEqual([]);
    });

    it("should not add duplicates if all initiallySelectedIncidents are already present", () => {
      const incident = { analysisObject: { id: "1" } } as any;
      component.initiallySelectedIncidents = [incident];
      fixture.detectChanges();
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.selectedIncidents()).toEqual([incident]);
    });

    it("should handle incidents with missing or undefined analysisObject.id", () => {
      const incidentWithNoId = { analysisObject: {} } as any;
      component.initiallySelectedIncidents = [incidentWithNoId];
      fixture.detectChanges();
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.selectedIncidents()).toEqual([incidentWithNoId]);
    });

    it("should add all initiallySelectedIncidents if selectedIncidents is initially empty", () => {
      const inc1 = { analysisObject: { id: "1" } } as any;
      const inc2 = { analysisObject: { id: "2" } } as any;
      component.initiallySelectedIncidents = [inc1, inc2];
      fixture.detectChanges();
      component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT);
      expect(component.selectedIncidents().length).toBe(2);
    });

    it("should not throw if initiallySelectedIncidents is null or undefined", () => {
      component.initiallySelectedIncidents = null as any;
      component.selectedIncidents.set([]);
      expect(() =>
        component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT)
      ).not.toThrow();

      component.initiallySelectedIncidents = undefined as any;
      expect(() =>
        component.handleTableQueryParamsChange(INCIDENT_TABLE_LAZY_LOAD_EVENT)
      ).not.toThrow();
    });
  });

  describe("handleSelectionChange", () => {
    const incident = { id: "incident-1" } as Incident;

    it("should add incident to selection when checkbox is checked", () => {
      const event = { checked: true } as CheckboxChangeEvent;
      component.selectedIncidents.set([]);
      component.handleSelectionChange(event, incident);
      expect(
        component
          .selectedIncidents()
          .some((sel) => sel.analysisObject.id === incident.id)
      ).toBe(true);
    });

    it("should remove incident from selection when checkbox is unchecked", () => {
      const event = { checked: false } as CheckboxChangeEvent;
      component.selectedIncidents.set([{ analysisObject: incident } as any]);
      component.handleSelectionChange(event, incident);
      expect(
        component
          .selectedIncidents()
          .some((sel) => sel.analysisObject.id === incident.id)
      ).toBe(false);
    });

    it("should remove incident from initial selection when checkbox is unchecked", () => {
      component.initiallySelectedIncidents = [
        { analysisObject: incident } as any,
      ];
      fixture.detectChanges();

      component.handleSelectionChange(
        { checked: false } as CheckboxChangeEvent,
        incident
      );

      expect(
        component
          .selectedIncidents()
          .some((sel) => sel.analysisObject.id === incident.id)
      ).toBe(false);
    });

    it("should do nothing if removing an incident not in selection", () => {
      const event = { checked: false } as CheckboxChangeEvent;
      component.selectedIncidents.set([]);
      expect(() =>
        component.handleSelectionChange(event, incident)
      ).not.toThrow();
      expect(component.selectedIncidents()).toEqual([]);
    });

    it("should handle incident with undefined id gracefully", () => {
      const event = { checked: true } as CheckboxChangeEvent;
      const incidentNoId = {} as Incident;
      component.selectedIncidents.set([]);
      component.handleSelectionChange(event, incidentNoId);
      expect(component.selectedIncidents().length).toBe(1);
      component.handleSelectionChange(
        { checked: false } as CheckboxChangeEvent,
        incidentNoId
      );
      expect(component.selectedIncidents().length).toBe(0);
    });

    describe("selected analysis objects", () => {
      it("should initialize the selected analysis object to empty array if none are selected", () => {
        expect(component.selectedAnalysisObjects()).toEqual([]);
      });

      it("should initialize the selected analysis object correctly if some initially selected", () => {
        const selectionMessage = "selection message";
        component.initiallySelectedIncidents = [
          {
            analysisObject: INCIDENT_1,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<Incident>,
        ];
        fixture.detectChanges();
        refresh$.next(true);
        expect(component.selectedAnalysisObjects()).toEqual([
          {
            id: INCIDENT_1.id,
            title: INCIDENT_1.title,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as SelectedAnalysisObject,
        ]);
      });

      it("should initialize the selected analysis object correctly if none initially selected but added later", () => {
        const selectionMessage = "selection message";
        component.initiallySelectedIncidents = [];
        fixture.detectChanges();
        refresh$.next(true);
        component.selectedIncidents.set([
          {
            analysisObject: INCIDENT_1,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<Incident>,
        ]);
        expect(component.selectedAnalysisObjects()).toEqual([
          {
            id: INCIDENT_1.id,
            title: INCIDENT_1.title,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as SelectedAnalysisObject,
        ]);
      });

      it("should initialize the selected analysis object correctly if some initially selected and some added later", () => {
        const selectionMessage = "selection message";
        component.initiallySelectedIncidents = [
          {
            analysisObject: INCIDENT_1,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<Incident>,
        ];
        fixture.detectChanges();
        refresh$.next(true);
        component.selectedIncidents.update((current) => {
          return [
            ...current,
            {
              analysisObject: INCIDENT_2,
              selectionType: AnalysisObjectSelectionType.PARTIAL,
            } as AnalysisObjectSelectionState<Incident>,
          ];
        });
        expect(component.selectedAnalysisObjects()).toEqual([
          {
            id: INCIDENT_1.id,
            title: INCIDENT_1.title,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as SelectedAnalysisObject,
          {
            id: INCIDENT_2.id,
            title: INCIDENT_2.title,
            selectionType: AnalysisObjectSelectionType.PARTIAL,
          } as SelectedAnalysisObject,
        ]);
      });

      it("should update selected incidents when analysis object removed event is emitted", () => {
        component.selectedIncidents.set([
          {
            analysisObject: INCIDENT_1,
            selectionType: AnalysisObjectSelectionType.PARTIAL,
          } as AnalysisObjectSelectionState<Incident>,
        ]);
        getAnalysisObjectListingComponent().analysisObjectRemoved.emit(
          INCIDENT_1.id
        );
        expect(component.selectedIncidents()).toEqual([]);
      });
      it("should update selected analysis objects when analysis object removed event is emitted", () => {
        component.selectedIncidents.set([
          {
            analysisObject: INCIDENT_1,
            selectionType: AnalysisObjectSelectionType.FULL,
          } as AnalysisObjectSelectionState<Incident>,
        ]);
        getAnalysisObjectListingComponent().analysisObjectRemoved.emit(
          INCIDENT_1.id
        );
        expect(component.selectedAnalysisObjects()).toEqual([]);
      });
    });
  });

  function getAnalysisObjectListingComponent() {
    return DomTestUtils.getElementByType(
      fixture,
      SelectedAnalysisObjectsListingComponent
    ).getInstance();
  }
});
