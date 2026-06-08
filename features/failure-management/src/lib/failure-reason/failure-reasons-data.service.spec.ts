/* tslint:disable:no-unused-variable */

import { lastValueFrom, of, throwError } from "rxjs";
import { FailureReasonApiModel } from "./failure-reason-api-model";
import { FailureReasonsDataService } from "./failure-reasons-data.service";
import { FailureReason } from "./failure-reason";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { CreateFailureReasonRequest } from "./create-failure-reason-modal/create-failure-reason-request";
import { CreateFailureReasonApiRequest } from "./create-failure-reason-api-request";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";

describe("Service: FailureReasonsData", () => {
  const GATEWAY_URL = "GATEWAY_URL/";

  let service: FailureReasonsDataService;
  let httpClientSpy: jest.Mocked<HttpClient>;

  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as AppConfig;

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    TestBed.configureTestingModule({
      providers: [
        FailureReasonsDataService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(FailureReasonsDataService);
  });

  describe("fetch reasons of failure", () => {
    it("can get reason of failures correctly", (done) => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(TestHelper.getFailureReasonsApiModel()));

      service.getFailureReasons().subscribe({
        next: (data) => {
          expect(data).toEqual(TestHelper.getFailureReasons());
          done();
        },
      });

      const url = `${GATEWAY_URL}failure-management/failure-reasons`;
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
        params: new HttpParams({ fromObject: {} }),
      });
    });

    it("should call the http client with query params if query params are passed when fetching failure reasons", async () => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(TestHelper.getFailureReasonsApiModel()));

      const ids = ["1", "2"];
      const url = `${GATEWAY_URL}failure-management/failure-reasons`;
      const data = await lastValueFrom(service.getFailureReasons({ ids }));

      expect(data).toEqual(TestHelper.getFailureReasons());
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
        params: new HttpParams({ fromObject: { ids } }),
      });
    });

    it("can throw error correctly on failure", (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(throwError(() => errorResponse));
      service.getFailureReasons().subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
    });
  });

  it("can switch failure reason enablement correctly", () => {
    jest.spyOn(httpClientSpy, "patch").mockReturnValue(of());

    service.toggleFailureReasonActivation("reasonId", true).subscribe();

    const url = `${GATEWAY_URL}failure-management/failure-reasons`;

    expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.patch).toHaveBeenCalledWith(`${url}/reasonId`, {
      isEnabled: true,
    });
  });

  it("can handle error correctly when switching failure reason enablement", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: "failed",
    });
    jest
      .spyOn(httpClientSpy, "patch")
      .mockReturnValue(throwError(() => errorResponse));

    service.toggleFailureReasonActivation("reasonId", true).subscribe({
      error: (error) => {
        expect(error.message).toEqual("failed");
        done();
      },
    });

    const url = `${GATEWAY_URL}failure-management/failure-reasons`;

    expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.patch).toHaveBeenCalledWith(`${url}/reasonId`, {
      isEnabled: true,
    });
  });

  it("should create a failure reason correctly", (done) => {
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of({}));

    service
      .createFailureReason(TestHelper.buildCreateFailureReasonRequest())
      .subscribe({
        next: () => {
          const url = `${GATEWAY_URL}failure-management/failure-reasons`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(
            url,
            TestHelper.buildCreateFailureReasonApiRequest()
          );
          done();
        },
      });
  });

  it("should trim request when create a failure reason", (done) => {
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of({}));

    service
      .createFailureReason(
        TestHelper.buildCreateFailureReasonTrailingWhiteSpaceRequest()
      )
      .subscribe({
        next: () => {
          const url = `${GATEWAY_URL}failure-management/failure-reasons`;
          expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
          expect(httpClientSpy.post).toHaveBeenCalledWith(
            url,
            TestHelper.buildCreateFailureReasonApiRequest()
          );
          done();
        },
      });
  });

  it("should throw an error when failing to create a failure reason", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: "failed",
    });
    jest
      .spyOn(httpClientSpy, "post")
      .mockReturnValue(throwError(() => errorResponse));
    service
      .createFailureReason(TestHelper.buildCreateFailureReasonRequest())
      .subscribe({
        error: (error) => {
          expect(error.message).toEqual("failed");
          done();
        },
      });
  });
});

class TestHelper {
  static getFailureReasonsApiModel(): FailureReasonApiModel[] {
    return [
      {
        id: "ID",
        title: "NAME",
        description: "DESCRIPTION",
        isEnabled: true,
      },
    ];
  }

  static getFailureReasons(): FailureReason[] {
    return [
      {
        id: "ID",
        title: "NAME",
        description: "DESCRIPTION",
        isEnabled: true,
      },
    ];
  }

  static buildCreateFailureReasonRequest(): CreateFailureReasonRequest {
    return {
      title: "title",
      description: "description",
      isEnabled: true,
    };
  }

  static buildCreateFailureReasonTrailingWhiteSpaceRequest(): CreateFailureReasonRequest {
    return {
      title: "title ",
      description: "description ",
      isEnabled: true,
    };
  }

  static buildCreateFailureReasonApiRequest(): CreateFailureReasonApiRequest {
    return {
      title: "title",
      description: "description",
      isEnabled: true,
    };
  }
}
