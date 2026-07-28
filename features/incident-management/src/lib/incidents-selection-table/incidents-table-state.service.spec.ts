import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { delay, of, throwError } from "rxjs";
import { IncidentsTableStateService } from "./incidents-table-state.service";
import { IncidentService } from "../incident.service";
import {
  INCIDENT_1,
  INCIDENT_2,
  INCIDENT_STATUS_OPTIONS,
} from "../incident-test-utils";
import { IncidentsFetchRequest } from "@mxflow/features/incident-management";
import { FilterTranslatorService } from "@mxflow/ui/utils";
import { IncidentsTableQuery } from "./incidents-table-query.model";
import { IncidentPage } from "../model/incident-page.model";

function getDefaultFetchIncidentsRequest(): IncidentsFetchRequest {
  return {
    queryParams: { page: 0, size: 10 },
  };
}

const INCIDENTS_TABLE_QUERY: IncidentsTableQuery = {
  page: 0,
  pageSize: 10,
};

const INCIDENT_SECOND_PAGE: IncidentPage = {
  content: [INCIDENT_1, INCIDENT_2],
  totalPages: 2,
  totalElements: 2,
  size: 2,
  number: 2,
  last: true,
};

const INCIDENT_STATUSES = ["status 1", "status 2"];

describe("IncidentsTableStateService", () => {
  let service: IncidentsTableStateService;
  let incidentService: jest.Mocked<IncidentService>;

  beforeEach(() => {
    incidentService = {
      fetch: jest.fn(() => of(INCIDENT_SECOND_PAGE)),
      fetchAllStatuses: jest.fn(() => of(INCIDENT_STATUSES)),
    } as unknown as jest.Mocked<IncidentService>;

    TestBed.configureTestingModule({
      providers: [
        IncidentsTableStateService,
        FilterTranslatorService,
        { provide: IncidentService, useValue: incidentService },
      ],
    });

    service = TestBed.inject(IncidentsTableStateService);
    TestBed.tick();
  });

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should initialize page index to 0", () => {
      expect(service.page()).toEqual(0);
    });

    it("should initialize page size to 10", () => {
      expect(service.size()).toEqual(10);
    });

    it("should initialize isLoading to false", () => {
      expect(service.isLoading()).toBe(false);
    });

    it("should initialize errorMessage and statusesErrorMessage to undefined", () => {
      expect(service.errorMessage()).toBeUndefined();
      expect(service.statusesErrorMessage()).toBeUndefined();
    });

    it("should initially fetch the incidents using the default query", () => {
      expect(incidentService.fetch).toHaveBeenCalledWith(
        getDefaultFetchIncidentsRequest()
      );
      expect(service.incidents()).toEqual(INCIDENT_SECOND_PAGE.content);
      expect(service.total()).toEqual(INCIDENT_SECOND_PAGE.totalElements);
    });

    it("should initially fetch the incident status options", () => {
      expect(incidentService.fetchAllStatuses).toHaveBeenCalledTimes(1);
      expect(service.statusOptions()).toEqual(INCIDENT_STATUS_OPTIONS);
    });
  });

  describe("on table query params change", () => {
    it("should fetch the incidents again when the title filter is applied", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      };

      service.setIncidentsTableQuery(query);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          titlePhrase: "title",
        },
      });
    }));

    it("should fetch the incidents again when the statuses filter is applied", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        statuses: ["PASSED", "FAILED"],
      };

      service.setIncidentsTableQuery(query);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          statuses: ["PASSED", "FAILED"],
        },
      });
    }));

    it("should fetch the incidents again when the external issue id filter is applied", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        externalIssueIdPhrase: "id",
      };

      service.setIncidentsTableQuery(query);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          externalIssueIdPhrase: "id",
        },
      });
    }));

    it("should fetch the incidents again when the reporter filter is applied", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        reporterPhrase: "Sam",
      };

      service.setIncidentsTableQuery(query);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          reporterPhrase: "Sam",
        },
      });
    }));

    it("should fetch the incidents again when the assignee filter is applied", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        assigneePhrase: "Jane",
      };

      service.setIncidentsTableQuery(query);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          assigneePhrase: "Jane",
        },
      });
    }));

    it("should set loading state to true while fetching the incidents", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      };
      jest.spyOn(incidentService, "fetch").mockImplementation(() => {
        return of(INCIDENT_SECOND_PAGE).pipe(delay(100));
      });

      service.setIncidentsTableQuery(query);
      tick();

      expect(service.isLoading()).toBe(true);
    }));

    it("should set loading state to false after fetching the incidents", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      };

      service.setIncidentsTableQuery(query);
      tick();

      expect(service.isLoading()).toBe(false);
    }));

    it("should set the error message on failure to fetch incidents", fakeAsync(() => {
      const errorMessage = "Failed to fetch incidents";
      incidentService.fetch.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );

      service.setIncidentsTableQuery(INCIDENTS_TABLE_QUERY);
      tick();

      expect(service.errorMessage()).toBe(errorMessage);
    }));

    it("should return an empty page on failure to fetch incidents", fakeAsync(() => {
      incidentService.fetch.mockReturnValue(
        throwError(() => new Error("Failed to fetch incidents"))
      );

      service.setIncidentsTableQuery(INCIDENTS_TABLE_QUERY);
      tick();

      expect(service.incidents()).toEqual([]);
      expect(service.total()).toEqual(0);
    }));

    it("should set the loading state to false on failure to fetch incidents", fakeAsync(() => {
      incidentService.fetch.mockReturnValue(
        throwError(() => new Error("Failed to fetch incidents"))
      );

      service.setIncidentsTableQuery(INCIDENTS_TABLE_QUERY);
      tick();

      expect(service.isLoading()).toBe(false);
    }));

    it("should not fetch incidents again if the component is destroyed", fakeAsync(() => {
      service.ngOnDestroy();

      service.setIncidentsTableQuery({
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      });
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(1);
    }));

    it("should preserve the previously linked filter when the table query params change", fakeAsync(() => {
      const previouslyLinkedFilter = {
        testCaseExternalIds: ["id1", "id2"],
        scenarioDefinitionId: "scenario1",
      };
      service.setPreviouslyLinkedFilterCriteria(previouslyLinkedFilter);
      tick();

      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      };
      service.setIncidentsTableQuery(query);
      tick();

      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          testCaseExternalIds: previouslyLinkedFilter.testCaseExternalIds,
          scenarioDefinitionId: previouslyLinkedFilter.scenarioDefinitionId,
          titlePhrase: "title",
        },
      });
    }));
  });

  describe("on refresh", () => {
    it("should reset the query to defaults and fetch incidents again", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      };
      service.setIncidentsTableQuery(query);
      tick();
      service.refresh();
      tick();

      expect(incidentService.fetch).toHaveBeenLastCalledWith(
        getDefaultFetchIncidentsRequest()
      );
    }));

    it("should fetch the incident status options again", fakeAsync(() => {
      service.refresh();
      tick();

      expect(incidentService.fetchAllStatuses).toHaveBeenCalledTimes(2);
    }));

    it("should set error message on failure to refresh incident statuses", fakeAsync(() => {
      const errorMessage = "Failed to fetch statuses";
      incidentService.fetchAllStatuses.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );

      service.refresh();
      tick();

      expect(service.statusesErrorMessage()).toBe(errorMessage);
    }));

    it("should not refresh the data if the component is destroyed", fakeAsync(() => {
      service.ngOnDestroy();

      service.refresh();
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(1);
      expect(incidentService.fetchAllStatuses).toHaveBeenCalledTimes(1);
    }));
  });

  describe("on previously linked filter change", () => {
    it("should update the test case external ids filter and fetch incidents again", fakeAsync(() => {
      const filter = {
        testCaseExternalIds: ["id1", "id2"],
      };

      service.setPreviouslyLinkedFilterCriteria(filter);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          testCaseExternalIds: filter.testCaseExternalIds,
        },
      });
    }));

    it("should ignore the test case external ids filter when it is empty", fakeAsync(() => {
      const filter = {
        testCaseExternalIds: [],
      };

      service.setPreviouslyLinkedFilterCriteria(filter);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {},
      });
    }));

    it("should update the scenario definition id filter and fetch incidents again", fakeAsync(() => {
      const filter = {
        scenarioDefinitionId: "scenario1",
      };

      service.setPreviouslyLinkedFilterCriteria(filter);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(2);
      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          scenarioDefinitionId: filter.scenarioDefinitionId,
        },
      });
    }));

    it("should preserve the current table filters when previously linked criteria are updated", fakeAsync(() => {
      const query: IncidentsTableQuery = {
        ...INCIDENTS_TABLE_QUERY,
        titlePhrase: "title",
      };
      service.setIncidentsTableQuery(query);
      tick();

      const previouslyLinkedFilter = {
        testCaseExternalIds: ["id1", "id2"],
        scenarioDefinitionId: "scenario1",
      };
      service.setPreviouslyLinkedFilterCriteria(previouslyLinkedFilter);
      tick();

      expect(incidentService.fetch).toHaveBeenLastCalledWith({
        ...getDefaultFetchIncidentsRequest(),
        filters: {
          testCaseExternalIds: previouslyLinkedFilter.testCaseExternalIds,
          scenarioDefinitionId: previouslyLinkedFilter.scenarioDefinitionId,
          titlePhrase: "title",
        },
      });
    }));

    it("should not fetch incidents again if the previously linked filters are updated after the component is destroyed", fakeAsync(() => {
      service.ngOnDestroy();
      const previouslyLinkedFilter = {
        testCaseExternalIds: ["id1", "id2"],
        scenarioDefinitionId: "scenario1",
      };

      service.setPreviouslyLinkedFilterCriteria(previouslyLinkedFilter);
      tick();

      expect(incidentService.fetch).toHaveBeenCalledTimes(1);
    }));
  });
});
