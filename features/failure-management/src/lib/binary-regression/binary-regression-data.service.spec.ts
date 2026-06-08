/* tslint:disable:no-unused-variable */

import { of, throwError } from "rxjs";
import { BinaryRegressionDataService } from "./binary-regression-data.service";
import { CreateBinaryRegressionRequest } from "./create-binary-regression-modal/create-binary-regression-request.model";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { BinaryRegressionApiResponse } from "./binary-regression-api-response.model";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { EditBinaryRegressionRequest } from "./edit-binary-regression-modal/edit-binary-regression-request";
import { TestBed } from "@angular/core/testing";
import {
  FetchBinaryRegressionsRequest,
  Pageable,
} from "./model/fetch-binary-regressions-request";
import {
  BinaryRegressionApiPage,
  BinaryRegressionPage,
  FetchBinaryRegressionsApiResponse,
  FetchBinaryRegressionsResponse,
  LiteBinaryRegression,
  LiteBinaryRegressionApiResponse,
} from "@mxflow/features/failure-management";

const WARNING_MESSAGE = "warningMessage";

describe("Service: Binary Regression", () => {
  const GATEWAY_URL = "GATEWAY_URL/";

  let service: BinaryRegressionDataService;
  let httpClientSpy: HttpClient;

  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;

  const projectId = "projectId";
  const binaryRegressionId = "binaryRegressionId";
  const errorMessage = "failed";
  const errorResponse = new HttpErrorResponse({
    status: 500,
    error: errorMessage,
  });

  beforeEach(() => {
    httpClientSpy = {
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [BinaryRegressionDataService],
    })
      .overrideProvider(HttpClient, { useValue: httpClientSpy })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });
    service = TestBed.inject(BinaryRegressionDataService);
  });

  describe("creating binary regression", () => {
    it("should create a binary regression correctly", (done) => {
      jest.spyOn(httpClientSpy, "post").mockReturnValue(of({}));
      const projectId = "projectId";

      service
        .createBinaryRegression(
          projectId,
          TestHelper.buildCreateBinaryRegressionRequest()
        )
        .subscribe({
          next: () => {
            const url = `${GATEWAY_URL}projects/${projectId}/failure-management/regressions/binary`;
            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
            expect(httpClientSpy.post).toHaveBeenCalledWith(
              url,
              TestHelper.buildCreateBinaryRegressionRequest()
            );
            done();
          },
        });
    });

    it("should trim request when creating a binary regression", (done) => {
      jest.spyOn(httpClientSpy, "post").mockReturnValue(of({}));
      const projectId = "projectId";

      service
        .createBinaryRegression(
          projectId,
          TestHelper.buildCreateBinaryRegressionTrailingWhiteSpaceRequest()
        )
        .subscribe({
          next: () => {
            const url = `${GATEWAY_URL}projects/${projectId}/failure-management/regressions/binary`;
            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
            expect(httpClientSpy.post).toHaveBeenCalledWith(
              url,
              TestHelper.buildCreateBinaryRegressionRequest()
            );
            done();
          },
        });
    });

    it("should throw an error when failing to create a binary regression", (done) => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(throwError(() => errorResponse));
      service
        .createBinaryRegression(
          projectId,
          TestHelper.buildCreateBinaryRegressionRequest()
        )
        .subscribe({
          error: (error) => {
            expect(error.message).toEqual(errorMessage);
            done();
          },
        });
    });
  });

  describe("getting binary regression by id", () => {
    it("should do correct http call", (done) => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(TestHelper.getBinaryRegressionApiResponse()));

      service.getBinaryRegressionById(binaryRegressionId).subscribe({
        next: () => {
          expect(httpClientSpy.get).toHaveBeenCalledWith(
            `${GATEWAY_URL}failure-management/regressions/binary/${binaryRegressionId}`
          );
          done();
        },
      });
    });

    it("should propagate error on failure", (done) => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(throwError(() => errorResponse));

      service.getBinaryRegressionById(binaryRegressionId).subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
          done();
        },
      });
    });
  });

  describe("fetch all binary regressions", () => {
    it("should do the correct api call", (done) => {
      const pageable = TestHelper.buildPageable(0, 10);
      const request = TestHelper.buildFetchBinaryRegressionRequest();
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          of(TestHelper.buildFetchBinaryRegressionsApiResponse())
        );

      service.fetchAll(pageable, request).subscribe({
        next: () => {
          const url = `${GATEWAY_URL}failure-management/regressions/binary/fetch`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(url, request, {
            params: new HttpParams({ fromObject: { ...pageable } }),
          });
          done();
        },
      });
    });

    it("should do the correct api call without query request", () => {
      const pageable = TestHelper.buildPageable(0, 10);
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          of(TestHelper.buildFetchBinaryRegressionsApiResponse())
        );

      service.fetchAll(pageable).subscribe({
        next: () => {
          const url = `${GATEWAY_URL}failure-management/regressions/binary/fetch`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(
            url,
            {},
            {
              params: new HttpParams({ fromObject: { ...pageable } }),
            }
          );
        },
      });
    });

    it("should do the correct api call when provided with some of the query params", () => {
      const pageable = TestHelper.buildPageable(0, 10);
      const request = {
        fixPhrase: "fix",
        ownerPhrase: "owner",
        ids: ["1", "2"],
      } as FetchBinaryRegressionsRequest;
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          of(TestHelper.buildFetchBinaryRegressionsApiResponse())
        );

      service.fetchAll(pageable, request).subscribe({
        next: () => {
          const url = `${GATEWAY_URL}failure-management/regressions/binary/fetch`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(url, request, {
            params: new HttpParams({ fromObject: { ...pageable } }),
          });
        },
      });
    });

    it("should throw an error when failing to fetch all binary regressions", () => {
      const pageable = TestHelper.buildPageable(0, 10);
      const request = TestHelper.buildFetchBinaryRegressionRequest();
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(throwError(() => errorResponse));

      service.fetchAll(pageable, request).subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
        },
      });
    });

    it("should return a response with warning message if it exists", () => {
      const modifiedWarningMessage = `Showing all binary regressions due to: ${WARNING_MESSAGE}. Data includes binary regressions outside the validation cycle.`;
      const pageable = TestHelper.buildPageable(0, 10);
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          of(TestHelper.buildFetchBinaryRegressionsApiResponseWithWarning())
        );

      service.fetchAll(pageable).subscribe((response) => {
        const url = `${GATEWAY_URL}failure-management/regressions/binary/fetch`;
        expect(response).toEqual({
          ...TestHelper.buildFetchBinaryRegressionsResponse(),
          warningMessage: modifiedWarningMessage,
        });
        expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.post).toHaveBeenCalledWith(
          url,
          {},
          {
            params: new HttpParams({ fromObject: { ...pageable } }),
          }
        );
      });
    });
  });

  describe("fetching binary regressions by ids", () => {
    it("should call fetch all with the correct params", () => {
      const ids = ["1", "2"];
      const pageable = TestHelper.buildPageable(0, 2);
      const request = { ids: ids } as FetchBinaryRegressionsRequest;
      const fetchAllSpy = jest
        .spyOn(service, "fetchAll")
        .mockReturnValue(
          of(TestHelper.buildFetchBinaryRegressionsApiResponse())
        );

      service.fetchByIds(ids).subscribe({
        next: () => {
          expect(fetchAllSpy).toHaveBeenCalledWith(pageable, request);
        },
      });
    });

    it("should throw an error when failing to fetch by ids", () => {
      const ids = ["1", "2"];
      jest
        .spyOn(service, "fetchAll")
        .mockReturnValue(throwError(() => errorResponse));

      service.fetchByIds(ids).subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
        },
      });
    });
  });

  describe("updating binary regression", () => {
    it("should update the binary regression correctly", (done) => {
      jest.spyOn(httpClientSpy, "patch").mockReturnValue(of(null));

      service
        .update(binaryRegressionId, TestHelper.getEditBinaryRegressionRequest())
        .subscribe({
          next: () => {
            expect(httpClientSpy.patch).toHaveBeenCalledWith(
              `${GATEWAY_URL}failure-management/regressions/binary/${binaryRegressionId}`,
              TestHelper.getEditBinaryRegressionRequest()
            );
            done();
          },
        });
    });

    it("should trim request when updating the binary regression", (done) => {
      jest.spyOn(httpClientSpy, "patch").mockReturnValue(of(null));

      service
        .update(
          binaryRegressionId,
          TestHelper.getEditBinaryRegressionTrailingWhiteSpaceRequest()
        )
        .subscribe({
          next: () => {
            expect(httpClientSpy.patch).toHaveBeenCalledWith(
              `${GATEWAY_URL}failure-management/regressions/binary/${binaryRegressionId}`,
              TestHelper.getEditBinaryRegressionRequest()
            );
            done();
          },
        });
    });

    it("should throw error on failure to update", (done) => {
      jest
        .spyOn(httpClientSpy, "patch")
        .mockReturnValue(throwError(() => errorResponse));

      service
        .update(binaryRegressionId, TestHelper.getEditBinaryRegressionRequest())
        .subscribe({
          error: (error) => {
            expect(error.message).toEqual(errorMessage);
            done();
          },
        });
    });
  });
});

class TestHelper {
  static buildCreateBinaryRegressionRequest(): CreateBinaryRegressionRequest {
    return {
      title: "title",
      description: "description",
      defect: "guiltyChange",
      mxVersion: "mxVersion",
      fix: "fix",
      incidentId: "incidentId",
    };
  }

  static buildCreateBinaryRegressionTrailingWhiteSpaceRequest(): CreateBinaryRegressionRequest {
    return {
      title: "title ",
      description: "description",
      defect: "guiltyChange ",
      mxVersion: "mxVersion ",
      fix: "fix ",
      incidentId: "incidentId ",
    };
  }

  static getBinaryRegressionApiResponse(): BinaryRegressionApiResponse {
    return {
      id: "id",
      title: "title",
      description: "description",
      mxVersion: "mxVersion",
      defect: {
        id: "defectId",
        link: "defectLink",
      },
      fix: "fix",
      incidentId: "incidentId",
      creationDate: new Date(),
    };
  }

  static getEditBinaryRegressionRequest(): EditBinaryRegressionRequest {
    return {
      title: "title",
      description: "description",
      fix: "fix",
      incidentId: "incidentId",
    };
  }

  static getEditBinaryRegressionTrailingWhiteSpaceRequest(): EditBinaryRegressionRequest {
    return {
      title: "title ",
      description: "description",
      fix: "fix ",
      incidentId: "incidentId ",
    };
  }

  static buildFetchBinaryRegressionRequest(): FetchBinaryRegressionsRequest {
    return {
      ids: ["1", "2"],
      titlePhrases: ["title1", "title2"],
      defectIdPhrases: ["defect1", "defect2"],
      mxVersionPhrases: ["mx1", "mx2"],
      fixPhrase: "fix",
      ownerPhrase: "owner",
    } as FetchBinaryRegressionsRequest;
  }

  static buildPageable(page: number, size: number) {
    return {
      page: page,
      size: size,
    } as Pageable;
  }

  static buildFetchBinaryRegressionsResponse(): FetchBinaryRegressionsResponse {
    return {
      binaryRegressions: TestHelper.buildBinaryRegressionPage(),
    } as FetchBinaryRegressionsResponse;
  }

  static buildFetchBinaryRegressionsApiResponse(): FetchBinaryRegressionsApiResponse {
    return {
      binaryRegressions: TestHelper.buildBinaryRegressionApiPage(),
    } as FetchBinaryRegressionsApiResponse;
  }

  static buildFetchBinaryRegressionsApiResponseWithWarning(): FetchBinaryRegressionsApiResponse {
    return {
      binaryRegressions: TestHelper.buildBinaryRegressionApiPage(),
      warningMessage: WARNING_MESSAGE,
    } as FetchBinaryRegressionsApiResponse;
  }

  static buildBinaryRegressionPage(): BinaryRegressionPage {
    return {
      content: [this.getLiteBinaryRegression()],
      totalElements: 1,
    } as BinaryRegressionPage;
  }

  static buildBinaryRegressionApiPage(): BinaryRegressionApiPage {
    return {
      content: [this.getLiteBinaryRegressionApiResponse()],
      totalElements: 1,
    } as BinaryRegressionApiPage;
  }

  static getLiteBinaryRegression() {
    return {
      id: "id",
      title: "title",
      description: "description",
      mxVersion: "mxVersion",
      defect: {
        id: "defectId",
        link: "defectLink",
      },
      fix: "fix",
      creationDate: new Date(),
    } as LiteBinaryRegression;
  }

  static getLiteBinaryRegressionApiResponse() {
    return {
      id: "id",
      title: "title",
      mxVersion: "mxVersion",
      defect: {
        id: "defectId",
        link: "defectLink",
      },
      fix: "fix",
    } as LiteBinaryRegressionApiResponse;
  }
}
