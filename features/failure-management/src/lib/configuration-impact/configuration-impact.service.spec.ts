import { lastValueFrom, of, throwError } from "rxjs";
import { ConfigurationImpactService } from "./configuration-impact.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { EditConfigurationImpactRequest } from "./edit-configuration-impact-modal/edit-configuration-impact-request.model";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { FetchConfigurationImpactsRequest } from "./model/fetch-configuration-impacts-request";
import {
  FetchConfigurationImpactsApiResponse,
  LiteConfigurationImpactApiResponse,
} from "./model/fetch-configuration-impacts-api-response";
import { FetchConfigurationImpactsApiRequest } from "./model/fetch-configuration-impacts-api-request";

function getCreateConfigurationImpactRequest() {
  return {
    title: "title1",
    description: "description1",
    guiltyChange: "guiltyChange1",
  };
}

function getCreateConfigurationImpactTrailingWhiteSpaceRequest() {
  return {
    title: "title1 ",
    description: "description1",
    guiltyChange: "guiltyChange1 ",
  };
}

function getEditConfigurationImpactRequest(): EditConfigurationImpactRequest {
  return {
    title: "title1",
    description: "description1",
  };
}

function getEditConfigurationImpactTrailingWhiteSpaceRequest(): EditConfigurationImpactRequest {
  return {
    title: "title1 ",
    description: "description1",
  };
}

function buildPageable(page: number, size: number) {
  return {
    page: page,
    size: size,
  };
}

function getFetchConfigurationImpactsRequest() {
  return {
    page: 1,
    size: 10,
    ids: ["id1", "id2"],
    titlePhrase: "title",
    ownerPhrase: "owner",
    guiltyChangePhrase: "guiltyChange",
  } as unknown as FetchConfigurationImpactsRequest;
}

const PROJECT_ID = "projectId";

function getConfigurationImpact() {
  return {
    id: "123",
    title: "title1",
    description: "description1",
    guiltyChange: "guiltyChange1",
    owner: "owner1",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}

function getLiteConfigurationImpactApiResponse(): LiteConfigurationImpactApiResponse {
  return {
    id: "123",
    title: "title1",
    guiltyChange: "guiltyChange1",
    owner: "owner1",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  } as unknown as LiteConfigurationImpactApiResponse;
}

function getFetchConfigurationImpactsApiResponse() {
  return {
    configurationImpacts: {
      content: [getLiteConfigurationImpactApiResponse()],
      totalElements: 1,
    },
  } as unknown as FetchConfigurationImpactsApiResponse;
}

function getFetchConfigurationImpactsApiRequest() {
  return {
    ids: ["id1", "id2"],
    titlePhrase: "title",
    ownerPhrase: "owner",
    guiltyChangePhrase: "guiltyChange",
  } as unknown as FetchConfigurationImpactsApiRequest;
}

describe("ConfigurationImpactsService", () => {
  let service: ConfigurationImpactService;
  let httpClientSpy: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "http://localhost/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClientSpy = {
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(() => of(null)),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [ConfigurationImpactService],
    })
      .overrideProvider(HttpClient, { useValue: httpClientSpy })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });
    service = TestBed.inject(ConfigurationImpactService);
  });

  it("should create config impact correctly", (done) => {
    const response = { id: "123" };
    const request = getCreateConfigurationImpactRequest();
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of(response));

    service.create(PROJECT_ID, request).subscribe((data) => {
      expect(data).toEqual(response.id);
      done();
    });

    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/impacts/configuration`;
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(url, request);
  });

  it("should trim request when create config impact", (done) => {
    const response = { id: "123" };
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of(response));

    service
      .create(
        PROJECT_ID,
        getCreateConfigurationImpactTrailingWhiteSpaceRequest()
      )
      .subscribe((data) => {
        expect(data).toEqual(response.id);
        done();
      });

    const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/impacts/configuration`;
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(
      url,
      getCreateConfigurationImpactRequest()
    );
  });

  it("should handle error correctly when failing to create config impact", (done) => {
    const errorResponse = new HttpErrorResponse({ error: "failed" });
    jest
      .spyOn(httpClientSpy, "post")
      .mockReturnValue(throwError(() => errorResponse));

    service
      .create(PROJECT_ID, getCreateConfigurationImpactRequest())
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
  });

  describe("should fetch all config impacts correctly", () => {
    it("should call http client correctly when fetching configuration impacts without query params", fakeAsync(async () => {
      const pageable = buildPageable(1, 10);
      const request = { page: 1, size: 10 } as FetchConfigurationImpactsRequest;
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(getFetchConfigurationImpactsApiResponse()));
      tick();

      await lastValueFrom(service.fetchAll(PROJECT_ID, request));
      const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/impacts/configuration/fetch`;
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        url,
        {},
        {
          params: new HttpParams({ fromObject: { ...pageable } }),
        }
      );
    }));

    it("should call the http client with query params if query params are passed when fetching configuration impacts", fakeAsync(async () => {
      const pageable = buildPageable(1, 10);
      const request = getFetchConfigurationImpactsRequest();
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(getFetchConfigurationImpactsApiResponse()));
      tick();

      await lastValueFrom(service.fetchAll(PROJECT_ID, request));
      const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/impacts/configuration/fetch`;
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        url,
        getFetchConfigurationImpactsApiRequest(),
        {
          params: new HttpParams({ fromObject: { ...pageable } }),
        }
      );
    }));

    it("should call http client correctly when fetching configuration impacts with some query params", fakeAsync(async () => {
      const pageable = buildPageable(0, 10);
      const request = {
        page: 0,
        size: 10,
        titlePhrase: "title",
        ownerPhrase: "owner",
      } as unknown as FetchConfigurationImpactsRequest;
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(getFetchConfigurationImpactsApiResponse()));
      tick();

      await lastValueFrom(service.fetchAll(PROJECT_ID, request));
      const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/impacts/configuration/fetch`;
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        url,
        {
          titlePhrase: "title",
          ownerPhrase: "owner",
        } as FetchConfigurationImpactsApiRequest,
        {
          params: new HttpParams({ fromObject: { ...pageable } }),
        }
      );
    }));

    it("should throw error correctly", fakeAsync(async () => {
      const errorResponse = new HttpErrorResponse({ error: "failed" });
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(throwError(() => errorResponse));
      tick();

      await expect(lastValueFrom(service.fetchAll(PROJECT_ID))).rejects.toThrow(
        "failed"
      );
    }));
  });

  describe("should fetch all configuration impacts by ids correctly", () => {
    it("should call http client correctly when fetching configuration impacts by ids", fakeAsync(async () => {
      const ids = ["1", "2", "3"];
      const pageable = buildPageable(0, ids.length);
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(getFetchConfigurationImpactsApiResponse()));
      tick();
      await lastValueFrom(service.fetchByIds("projectId", ids));
      const url = `${appConfig.gatewayUrl}projects/projectId/failure-management/impacts/configuration/fetch`;
      const apiRequest: FetchConfigurationImpactsApiRequest = {
        ids: ids,
      };
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(url, apiRequest, {
        params: new HttpParams({ fromObject: { ...pageable } }),
      });
    }));

    it("should throw an error when failed to fetch configuration impacts by ids", fakeAsync(async () => {
      const ids = ["1", "2", "3"];
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: "errorMessage" }))
        );
      tick();
      await expect(
        lastValueFrom(service.fetchByIds("projectId", ids))
      ).rejects.toThrow("errorMessage");
    }));
  });

  it("should fetch a configuration impact by id correctly", (done) => {
    jest
      .spyOn(httpClientSpy, "get")
      .mockReturnValue(of(getConfigurationImpact()));

    service.fetch(PROJECT_ID, getConfigurationImpact().id).subscribe((data) => {
      expect(data).toEqual(getConfigurationImpact());
      const url = `${
        appConfig.gatewayUrl
      }projects/projectId/failure-management/impacts/configuration/${
        getConfigurationImpact().id
      }`;
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(url);
      done();
    });
  });

  it("should fail to fetch a configuration impact if id does not exist", (done) => {
    const errorResponse = new HttpErrorResponse({ error: "failed" });
    jest
      .spyOn(httpClientSpy, "get")
      .mockReturnValue(throwError(() => errorResponse));

    service.fetch(PROJECT_ID, getConfigurationImpact().id).subscribe({
      error: (error) => {
        expect(error.message).toEqual("failed");
        done();
      },
    });
  });

  it("should update a configuration impact correctly", (done) => {
    const url = `${
      appConfig.gatewayUrl
    }projects/projectId/failure-management/impacts/configuration/${
      getConfigurationImpact().id
    }`;

    service
      .update(
        PROJECT_ID,
        getConfigurationImpact().id,
        getEditConfigurationImpactRequest()
      )
      .subscribe(() => {
        expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.patch).toHaveBeenCalledWith(
          url,
          getEditConfigurationImpactRequest()
        );
        done();
      });
  });

  it("should trim request when updating a configuration impact", (done) => {
    const url = `${
      appConfig.gatewayUrl
    }projects/projectId/failure-management/impacts/configuration/${
      getConfigurationImpact().id
    }`;

    service
      .update(
        PROJECT_ID,
        getConfigurationImpact().id,
        getEditConfigurationImpactTrailingWhiteSpaceRequest()
      )
      .subscribe(() => {
        expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.patch).toHaveBeenCalledWith(
          url,
          getEditConfigurationImpactRequest()
        );
        done();
      });
  });

  it("should throw an error on failure to update a configuration impact", (done) => {
    const errorResponse = new HttpErrorResponse({ error: "failed" });
    jest
      .spyOn(httpClientSpy, "patch")
      .mockReturnValue(throwError(() => errorResponse));

    service
      .update(
        PROJECT_ID,
        getConfigurationImpact().id,
        getEditConfigurationImpactRequest()
      )
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
  });
});
