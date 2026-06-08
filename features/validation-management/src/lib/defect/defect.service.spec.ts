import { DefectService } from "./defect.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { of, throwError } from "rxjs";
import { Defect, FetchDefectResult } from "./model/defect.model";
import { FetchDefectsQuery } from "./model/fetch-defects-query.model";
import {
  DefectApiResponse,
  FetchDefectApiResult,
} from "./model/defect-api-response.model";
import { TestBed } from "@angular/core/testing";

const WARNING_MESSAGE = "failed to fetch scope";
let subDate = new Date();
const DEFECT_API_RESPONSE: DefectApiResponse = {
  id: "id",
  link: "link",
  title: "title",
  description: "description",
  developer: "developer",
  submissionDate: subDate,
};
const FETCH_DEFECT_API_RESULT: FetchDefectApiResult = {
  defects: {
    content: [DEFECT_API_RESPONSE],
    totalPages: 2,
    totalElements: 2,
    size: 1,
    number: 0,
    last: false,
  },
};
const DEFECT: Defect = {
  id: "id",
  link: "link",
  title: "title",
  description: "description",
  developer: "developer",
  submissionDate: subDate,
};
const FETCH_DEFECT_RESULT: FetchDefectResult = {
  defects: {
    content: [DEFECT],
    totalPages: 2,
    totalElements: 2,
    size: 1,
    number: 0,
    last: false,
  },
};
const DEFECT_QUERY: FetchDefectsQuery = {
  page: 0,
  size: 1,
  sort: "desc",
  idPhrase: "idPhrase",
  titlePhrase: "titlePhrase",
  descriptionPhrase: "descriptionPhrase",
  developerPhrase: "developerPhrase",
  currentVersion: "currentVersion",
  referenceVersion: "referenceVersion",
};

describe("ValidationManagementService", () => {
  let service: DefectService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of(FETCH_DEFECT_API_RESULT)),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [DefectService],
    })
      .overrideProvider(APP_CONFIG, { useValue: appConfig })
      .overrideProvider(HttpClient, { useValue: httpClient });
    service = TestBed.inject(DefectService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("fetch defects", () => {
    it("should fetch defects with correct filters", () => {
      service.fetchAll(DEFECT_QUERY);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${appConfig.gatewayUrl}validation-resources/defects`,
        {
          params: new HttpParams({
            fromObject: { ...DEFECT_QUERY },
          }),
        }
      );
    });

    it("should exclude filters with undefined or null values", () => {
      const query: FetchDefectsQuery = { page: 1, sort: undefined };
      service.fetchAll(query);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${appConfig.gatewayUrl}validation-resources/defects`,
        {
          params: new HttpParams({ fromObject: { page: 1 } }),
        }
      );
    });

    it("should return a defects page", (done) => {
      service.fetchAll(DEFECT_QUERY).subscribe((defectPage) => {
        expect(defectPage).toEqual(FETCH_DEFECT_RESULT);
        done();
      });
    });

    it("should modify error message if returned in the fetch result", (done) => {
      const modifiedWarningMessage = `Showing all defects due to: ${WARNING_MESSAGE}. Data includes defects outside the validation cycle.`;
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          of({ ...FETCH_DEFECT_API_RESULT, warningMessage: WARNING_MESSAGE })
        );
      service.fetchAll(DEFECT_QUERY).subscribe((defectPage) => {
        expect(defectPage).toEqual({
          ...FETCH_DEFECT_RESULT,
          warningMessage: modifiedWarningMessage,
        });
        done();
      });
    });

    it("should handle error", (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      jest
        .spyOn(httpClient, "get")
        .mockReturnValueOnce(throwError(() => errorResponse));

      service.fetchAll(DEFECT_QUERY).subscribe({
        error: (err) => {
          expect(err.message).toEqual("failed");
          done();
        },
      });
    });
  });
});
