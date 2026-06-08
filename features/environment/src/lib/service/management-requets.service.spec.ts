import { AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom, of } from "rxjs";
import { ManagementRequestsService } from "./management-requests.service";

describe("ManagementRequestsService", () => {
  let service: ManagementRequestsService;
  const appConfig: AppConfig = {
    gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
  } as unknown as AppConfig;
  const projectId = "123";
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      get: jest.fn((url) => {
        if (
          url ===
          appConfig.gatewayUrl +
            `projects/${projectId}/environments/definitions`
        ) {
          return of([
            {
              id: "df15720e-e7a5-4f0c-aac8-daf7a74d6ffe",
              name: "Sample Environment Definition - 2",
            },
          ]);
        } else if (
          url ===
          appConfig.gatewayUrl + `projects/${projectId}/environments`
        ) {
          return of([
            {
              id: "abc123",
              name: "Environment 1",
            },
            {
              id: "def456",
              name: "Environment 2",
            },
          ]);
        }
        return {};
      }),
      post: jest.fn((url) => {
        if (
          url ===
          appConfig.gatewayUrl +
            `projects/${projectId}/environments/{environmentId}/start`
        ) {
          return of([
            {
              startRequestId: "5e942f2b-8f98-4de4-af4c-90f4c8a7a58a",
            },
          ]);
        }
        return {};
      }),
    } as unknown as HttpClient;
    service = new ManagementRequestsService(appConfig, httpClient);
  });

  it("should return correct start request id", async function () {
    httpClient = {
      post: jest.fn(() => {
        return of(TestHelper.getMockedStartManagementRequest());
      }),
    } as unknown as HttpClient;
    service = new ManagementRequestsService(appConfig, httpClient);

    const environmentId = "environmentId";
    await expect(
      lastValueFrom(service.startEnvironmentRequest(projectId, environmentId))
    ).resolves.toEqual(TestHelper.getExpectedStartRequestId());

    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${projectId}/environments/${environmentId}/start`,
      null
    );
  });

  it("should return correct stop request id", async function () {
    httpClient = {
      post: jest.fn(() => {
        return of(TestHelper.getMockedStopManagementRequest());
      }),
    } as unknown as HttpClient;
    service = new ManagementRequestsService(appConfig, httpClient);

    const environmentId = "environmentId";
    await expect(
      lastValueFrom(service.stopEnvironmentRequest(projectId, environmentId))
    ).resolves.toEqual(TestHelper.getExpectedStopRequestId());

    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${projectId}/environments/${environmentId}/stop`,
      null
    );
  });
});

class TestHelper {
  static getExpectedStartRequestId(): { startRequestId: string } {
    return { startRequestId: "5e942f2b-8f98-4de4-af4c-90f4c8a7a58a" };
  }

  static getMockedStartManagementRequest(): { startRequestId: string } {
    return { startRequestId: "5e942f2b-8f98-4de4-af4c-90f4c8a7a58a" };
  }

  static getExpectedStopRequestId(): { stopRequestId: string } {
    return { stopRequestId: "5e942f2b-8f98-4de4-af4c-90f4c8a7a58a" };
  }

  static getMockedStopManagementRequest(): { stopRequestId: string } {
    return { stopRequestId: "5e942f2b-8f98-4de4-af4c-90f4c8a7a58a" };
  }
}
