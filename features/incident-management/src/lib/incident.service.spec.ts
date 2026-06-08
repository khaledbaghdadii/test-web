import { IncidentService } from "./incident.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import { ExternalIssue, Incident } from "./model/incident.model";
import { TestBed } from "@angular/core/testing";
import {
  IncidentsApiRequest,
  IncidentsFetchRequest,
  IncidentsQueryParams,
} from "@mxflow/features/incident-management";

describe("IncidentService", () => {
  const GATEWAY_URL = "GATEWAY_URL/";
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;
  const DEFAULT_PAGE_INDEX = 0;
  const DEFAULT_PAGE_SIZE = 20;
  const EXTERNAL_ISSUE: ExternalIssue = {
    id: "id",
    origin: "origin",
    link: "link",
  };
  const queryParams: IncidentsQueryParams = {
    page: DEFAULT_PAGE_INDEX,
    size: DEFAULT_PAGE_SIZE,
  };
  const queryApiRequest: IncidentsApiRequest = {
    externalIssueIdPhrase: "id",
    statuses: ["status"],
    titlePhrase: "title",
    reporterPhrase: "reporter",
    assigneePhrase: "assignee",
  };
  const idsQuery: IncidentsApiRequest = {
    ids: ["1"],
  };
  const INCIDENT_API_MODEL = {
    id: "id",
    title: "title",
    reporter: "reporter",
    assignee: "assignee",
    status: "status",
    externalIssue: EXTERNAL_ISSUE,
  };
  const INCIDENT_PAGE_API_MODEL = {
    incidents: {
      content: [INCIDENT_API_MODEL],
      totalPages: 1,
      totalElements: 1,
      size: 1,
      number: 1,
      last: true,
    },
  };
  const INCIDENT: Incident = {
    id: "id",
    title: "title",
    status: "status",
    reporter: "reporter",
    assignee: "assignee",
    externalIssue: EXTERNAL_ISSUE,
  };
  const INCIDENT_PAGE = {
    content: [INCIDENT],
    totalPages: 1,
    totalElements: 1,
    size: 1,
    number: 1,
    last: true,
  };

  const STATUSES = ["status 1", "status 2"];

  let service: IncidentService;
  let httpClient: HttpClient;

  function toHttpParams(query: IncidentsQueryParams) {
    return new HttpParams({ fromObject: { ...query } });
  }

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of()),
      post: jest.fn(() => of()),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [IncidentService],
    })
      .overrideProvider(HttpClient, { useValue: httpClient })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });
    service = TestBed.inject(IncidentService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("fetch all statuses", () => {
    beforeEach(() => {
      jest.spyOn(httpClient, "get").mockReturnValue(of(STATUSES));
    });

    it("should fetch all incidents", async () => {
      await expect(lastValueFrom(service.fetchAllStatuses())).resolves.toEqual(
        STATUSES
      );
      expect(httpClient.get).toHaveBeenCalledTimes(1);
    });

    it("should throw error correctly on failure", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(service.fetchAllStatuses())
      ).rejects.toHaveProperty("message", "failed");
    });
  });

  describe("fetch all incidents", () => {
    beforeEach(() => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(of(INCIDENT_PAGE_API_MODEL));
    });

    it("should call the correct api", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
      };
      await expect(lastValueFrom(service.fetch(fetchRequest))).resolves.toEqual(
        INCIDENT_PAGE
      );

      expect(httpClient.post).toHaveBeenCalledTimes(1);
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}incident-management/incidents/fetch`,
        expect.anything(),
        expect.anything()
      );
    });

    it("should set empty body if no queryApiRequest is passed", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
      };
      await expect(lastValueFrom(service.fetch(fetchRequest))).resolves.toEqual(
        INCIDENT_PAGE
      );

      expect(httpClient.post).toHaveBeenCalledTimes(1);
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        {},
        expect.anything()
      );
    });

    it("should set the pagination params", async () => {
      const query: IncidentsQueryParams = {
        page: 2,
        size: 10,
      };
      const queryParams = toHttpParams(query);
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: query,
      };

      await expect(lastValueFrom(service.fetch(fetchRequest))).resolves.toEqual(
        INCIDENT_PAGE
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { params: queryParams }
      );
    });

    it("should set the titlePhrase param in request body", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: queryApiRequest,
      };
      await lastValueFrom(service.fetch(fetchRequest));

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ titlePhrase: queryApiRequest.titlePhrase }),
        expect.anything()
      );
    });

    it("should set the statuses param in request body", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: queryApiRequest,
      };
      await lastValueFrom(service.fetch(fetchRequest));

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statuses: queryApiRequest.statuses }),
        expect.anything()
      );
    });

    it("should set the externalIssueIdPhrase param in request body", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: queryApiRequest,
      };
      await lastValueFrom(service.fetch(fetchRequest));

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          externalIssueIdPhrase: queryApiRequest.externalIssueIdPhrase,
        }),
        expect.anything()
      );
    });

    it("should set the report params in request body", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: queryApiRequest,
      };
      await lastValueFrom(service.fetch(fetchRequest));

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reporterPhrase: queryApiRequest.reporterPhrase,
        }),
        expect.anything()
      );
    });

    it("should set the assignee params in request body", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: queryApiRequest,
      };
      await lastValueFrom(service.fetch(fetchRequest));

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          assigneePhrase: queryApiRequest.assigneePhrase,
        }),
        expect.anything()
      );
    });

    it("should set the ids param in request body", async () => {
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
        filters: idsQuery,
      };
      await lastValueFrom(service.fetch(fetchRequest));

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ ids: idsQuery.ids }),
        expect.anything()
      );
    });

    it("should throw error correctly on failure", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(throwError(() => errorResponse));
      const fetchRequest: IncidentsFetchRequest = {
        queryParams: queryParams,
      };

      await expect(
        lastValueFrom(service.fetch(fetchRequest))
      ).rejects.toHaveProperty("message", "failed");
    });
  });

  describe("fetch incidents by ids", () => {
    it.each([undefined, []])(
      "should return an empty list if no ids are passed as params",
      (param, done) => {
        service
          .fetchIncidentsByIds(param as unknown as string[])
          .subscribe((data) => {
            expect(data).toEqual([]);
            done();
          });
      }
    );

    it("should delegate correctly to the method that fetches incidents with query params if ids are passed to the method", async () => {
      const fetchSpy = jest
        .spyOn(service, "fetch")
        .mockReturnValue(of(INCIDENT_PAGE));
      const ids = ["id1", "id2"];

      await expect(
        lastValueFrom(service.fetchIncidentsByIds(ids))
      ).resolves.toEqual(INCIDENT_PAGE.content);
      expect(fetchSpy).toHaveBeenCalledWith({
        queryParams: {
          page: 0,
          size: ids.length,
        },
        filters: {
          ids: ids,
        },
      });
    });

    it("should throw error in case the method to fetch incidents by query params throws error", async () => {
      const error = "error";
      const fetchSpy = jest.spyOn(service, "fetch").mockImplementation(() => {
        return throwError(() => new Error(error));
      });
      const ids = ["id1", "id2"];

      await expect(
        lastValueFrom(service.fetchIncidentsByIds(ids))
      ).rejects.toHaveProperty("message", error);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });
});
