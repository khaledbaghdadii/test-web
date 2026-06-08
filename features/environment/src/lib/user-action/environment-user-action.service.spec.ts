import { HttpClient, HttpParams } from "@angular/common/http";
import { AppConfig } from "@mxflow/config";
import { lastValueFrom, of, throwError } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { EnvironmentUserRequestApiModel } from "./environment-user-request-api-model";
import {
  EnvironmentUserActionService,
  EnvironmentUserRequest,
} from "@mxflow/features/environment";

describe("Environment user action service test", () => {
  const appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  let httpClient: HttpClient;
  let service: EnvironmentUserActionService;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of(getRequestsApiModel())),
    } as unknown as HttpClient;

    service = new EnvironmentUserActionService(appConfig, httpClient);
  });

  it("should fetch the user requests with correct url and query params", () => {
    let expectedQueryParams = new HttpParams();
    expectedQueryParams = expectedQueryParams.append(
      "requestIds",
      "request1,request2"
    );

    service.getRequests("projectId", ["request1", "request2"]);

    expect(httpClient.get).toHaveBeenCalledWith(
      "gatewayUrl/projects/projectId/environments/user-requests",
      { params: expectedQueryParams }
    );
  });

  it("should return the fetched requests", async () => {
    const requests = await lastValueFrom(
      service.getRequests("projectId", ["request1", "request2"])
    );

    expect(requests).toEqual(getRequests());
  });

  it("should handle failures by throwing correct error message", async () => {
    const expectedErrorMessage = uuidv4();
    jest
      .spyOn(httpClient, "get")
      .mockReturnValueOnce(
        throwError(() => ({ status: 500, error: expectedErrorMessage }))
      );

    await lastValueFrom(
      service.getRequests("projectId", ["request1", "request2"])
    ).catch((error) =>
      expect(error.message).toStrictEqual(expectedErrorMessage)
    );
  });

  function getRequestsApiModel(): EnvironmentUserRequestApiModel[] {
    return [
      {
        id: "request1",
        environmentId: "env1",
        completedAt: "2023-10-01T00:00:00Z",
      },
      {
        id: "request2",
        environmentId: "env2",
        completedAt: "2023-10-02T00:00:00Z",
      },
    ];
  }

  function getRequests(): EnvironmentUserRequest[] {
    return [
      {
        id: "request1",
        environmentId: "env1",
        completedAt: "2023-10-01T00:00:00Z",
      },
      {
        id: "request2",
        environmentId: "env2",
        completedAt: "2023-10-02T00:00:00Z",
      },
    ];
  }
});
