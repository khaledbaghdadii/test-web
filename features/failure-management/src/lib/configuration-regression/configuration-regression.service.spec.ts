import { lastValueFrom, of, throwError } from "rxjs";
import { CreateConfigurationRegressionRequest } from "./create-configuration-regression-modal/create-configuration-regression-request";
import { ConfigurationRegressionService } from "./configuration-regression.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { ConfigurationRegression } from "./model/configuration-regression";
import { EditConfigurationRegressionRequest } from "./edit-configuration-regression-modal/edit-configuration-regression-request";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import {
  FetchConfigurationRegressionsRequest,
  FetchConfigurationRegressionsApiRequest,
} from "./model/fetch-configuration-regressions-request";
import { FetchConfigurationRegressionsApiResponse } from "./model/fetch-configuration-regressions-api-response";

function getCreateConfigurationRegressionRequest(): CreateConfigurationRegressionRequest {
  return {
    title: "title1",
    description: "description1",
    guiltyChange: "guiltyChange1",
    fix: "fix1",
  };
}

function getCreateConfigurationRegressionTrailingWhiteSpaceRequest(): CreateConfigurationRegressionRequest {
  return {
    title: "title1 ",
    description: "description1",
    guiltyChange: "guiltyChange1 ",
    fix: "fix1 ",
  };
}

function getEditConfigurationRegressionRequest(): EditConfigurationRegressionRequest {
  return {
    title: "title1",
    description: "description1",
    fix: "fix1",
  };
}

function getEditConfigurationRegressionTrailingWhiteSpaceRequest(): EditConfigurationRegressionRequest {
  return {
    title: "title1 ",
    description: "description1",
    fix: "fix1 ",
  };
}

describe("ConfigurationRegressionsService", () => {
  let service: ConfigurationRegressionService;
  let httpClientSpy: HttpClient;
  const appConfig = {
    gatewayUrl: "http://localhost/",
  } as AppConfig;

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
      providers: [ConfigurationRegressionService],
    })
      .overrideProvider(HttpClient, { useValue: httpClientSpy })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });
    service = TestBed.inject(ConfigurationRegressionService);
  });

  it("should create config regression correctly", (done) => {
    const response = { id: "123" };
    const request: CreateConfigurationRegressionRequest =
      getCreateConfigurationRegressionRequest();
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of(response));

    service.create("projectId", request).subscribe((data) => {
      expect(data).toEqual(response.id);
      done();
    });

    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration`;
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(url, request);
  });

  it("should trim request when create config regression", (done) => {
    const response = { id: "123" };
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of(response));

    service
      .create(
        "projectId",
        getCreateConfigurationRegressionTrailingWhiteSpaceRequest()
      )
      .subscribe((data) => {
        expect(data).toEqual(response.id);
        done();
      });

    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration`;
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(
      url,
      getCreateConfigurationRegressionRequest()
    );
  });

  it("should handle error correctly when failing to create config regression", (done) => {
    const errorResponse = new HttpErrorResponse({ error: "failed" });
    jest
      .spyOn(httpClientSpy, "post")
      .mockReturnValue(throwError(() => errorResponse));

    service
      .create("projectId", getCreateConfigurationRegressionRequest())
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
  });

  it("should get config regression by id correctly", (done) => {
    const apiResponse = getConfigurationRegressionApiResponse();
    jest.spyOn(httpClientSpy, "get").mockReturnValue(of(apiResponse));
    const returnedResponse = getConfigurationRegression();

    service.fetch("projectId", "regressionId").subscribe((data) => {
      expect(data).toEqual(returnedResponse);
      done();
    });

    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/regressionId`;
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  describe("fetchAll", () => {
    it("should call http client correctly when fetching configuration regressions with query params", () => {
      const pageable = buildPageable(1, 10);
      const request = getFetchConfigurationRegressionsRequest();
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchConfigurationRegressionsApiResponse()));
      service.fetchAll("projectId", request).subscribe({
        next: () => {
          const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/fetch`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(
            url,
            getFetchConfigurationRegressionsApiRequest(),
            {
              params: new HttpParams({ fromObject: { ...pageable } }),
            }
          );
        },
      });
    });

    it("should call http client correctly when fetching configuration regressions without query params", () => {
      const pageable = buildPageable(0, 10);
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchConfigurationRegressionsApiResponse()));
      service.fetchAll("projectId", pageable).subscribe({
        next: () => {
          const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/fetch`;
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

    it("should call http client correctly when fetching configuration regressions with some query params", () => {
      const pageable = buildPageable(0, 10);
      const request: FetchConfigurationRegressionsRequest = {
        page: 1,
        size: 10,
        ownerPhrase: "ownerPhrase",
        titlePhrases: ["titlePhrase1", "titlePhrase2"],
      };
      const apiRequest: FetchConfigurationRegressionsApiRequest = {
        ownerPhrase: "ownerPhrase",
        titlePhrases: ["titlePhrase1", "titlePhrase2"],
      };
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchConfigurationRegressionsApiResponse()));
      service.fetchAll("projectId", request).subscribe({
        next: () => {
          const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/fetch`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(url, apiRequest, {
            params: new HttpParams({ fromObject: { ...pageable } }),
          });
        },
      });
    });

    it("should throw an error when failed to fetch configuration regressions", () => {
      const request = getFetchConfigurationRegressionsRequest();
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: errorResponse }))
        );
      service.fetchAll("projectId", request).subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
        },
      });
    });
  });

  describe("fetchByIds", () => {
    it("should call http client correctly when fetching configuration regressions by ids", () => {
      const ids = ["1", "2", "3"];
      const pageable = buildPageable(0, ids.length);
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchConfigurationRegressionsApiResponse()));
      service.fetchByIds("projectId", ids).subscribe({
        next: () => {
          const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/fetch`;
          const expectedRequest: FetchConfigurationRegressionsApiRequest = {
            ids: ids,
          };
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(
            url,
            expectedRequest,
            {
              params: new HttpParams({ fromObject: { ...pageable } }),
            }
          );
        },
      });
    });

    it("should throw an error when failed to fetch configuration regressions by ids", () => {
      const ids = ["1", "2", "3"];
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: errorResponse }))
        );
      service.fetchByIds("projectId", ids).subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
        },
      });
    });
  });

  it("should handle error correctly when failing to get config regression by id", (done) => {
    const errorResponse = new HttpErrorResponse({ error: "failed" });
    jest
      .spyOn(httpClientSpy, "get")
      .mockReturnValue(throwError(() => errorResponse));

    service.fetch("projectId", "regressionId").subscribe({
      error: (error) => {
        expect(error.message).toEqual("failed");
        done();
      },
    });
  });

  it("should update the configuration regression successfully", async () => {
    jest.spyOn(httpClientSpy, "patch").mockReturnValue(of(null));
    await lastValueFrom(
      service.update(
        "projectId",
        "configurationRegressionId",
        getEditConfigurationRegressionRequest()
      )
    );
    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/configurationRegressionId`;
    expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.patch).toHaveBeenCalledWith(
      url,
      getEditConfigurationRegressionRequest()
    );
  });

  it("should trim request when update the configuration regression", async () => {
    jest.spyOn(httpClientSpy, "patch").mockReturnValue(of(null));
    await lastValueFrom(
      service.update(
        "projectId",
        "configurationRegressionId",
        getEditConfigurationRegressionTrailingWhiteSpaceRequest()
      )
    );
    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/regressions/configuration/configurationRegressionId`;
    expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.patch).toHaveBeenCalledWith(
      url,
      getEditConfigurationRegressionRequest()
    );
  });

  it("should fail to update the configuration regression", (done) => {
    const errorResponse = new HttpErrorResponse({ error: "failed" });
    jest
      .spyOn(httpClientSpy, "patch")
      .mockReturnValue(throwError(() => errorResponse));

    service
      .update(
        "projectId",
        "configurationRegressionId",
        getEditConfigurationRegressionRequest()
      )
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
  });
});

function getConfigurationRegressionApiResponse() {
  return {
    id: "1",
    projectId: "projectId",
    title: "title1",
    description: "description1",
    guiltyChange: "guiltyChange1",
    fix: "fix1",
    owner: "owner1",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}

function getConfigurationRegressionsApiResponse() {
  return [
    {
      id: "1",
      projectId: "projectId",
      title: "title1",
      guiltyChange: "guiltyChange1",
      fix: "fix1",
      owner: "owner1",
    },
  ];
}

function getConfigurationRegression(): ConfigurationRegression {
  return {
    id: "1",
    projectId: "projectId",
    title: "title1",
    description: "description1",
    guiltyChange: "guiltyChange1",
    fix: "fix1",
    owner: "owner1",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}

function buildPageable(page: number, size: number) {
  return {
    page: page,
    size: size,
  };
}

function getFetchConfigurationRegressionsRequest() {
  return {
    page: 1,
    size: 10,
    ids: ["1", "2"],
    fixPhrase: "fixPhrase",
    ownerPhrase: "ownerPhrase",
    titlePhrases: ["titlePhrase1", "titlePhrase2"],
    guiltyChangePhrases: ["guiltyChangePhrase1", "guiltyChangePhrase2"],
  } as unknown as FetchConfigurationRegressionsRequest;
}

function getFetchConfigurationRegressionsApiRequest() {
  return {
    ids: ["1", "2"],
    fixPhrase: "fixPhrase",
    ownerPhrase: "ownerPhrase",
    titlePhrases: ["titlePhrase1", "titlePhrase2"],
    guiltyChangePhrases: ["guiltyChangePhrase1", "guiltyChangePhrase2"],
  } as unknown as FetchConfigurationRegressionsApiRequest;
}

function buildFetchConfigurationRegressionsApiResponse() {
  return {
    configurationRegressionsPage: {
      content: getConfigurationRegressionsApiResponse(),
      totalElements: 1,
    },
  } as unknown as FetchConfigurationRegressionsApiResponse;
}
