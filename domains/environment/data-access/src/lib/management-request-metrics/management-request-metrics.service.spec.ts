import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ManagementRequestMetricsService } from "./management-request-metrics.service";
import { ManagementRequestMetricApiResponse } from "./management-request-metric-api-model";

const GATEWAY_URL = "https://api.test.com/";

describe("ManagementRequestMetricsService", () => {
  let service: ManagementRequestMetricsService;
  let httpController: HttpTestingController;

  const projectId = "proj-001";
  const environmentId = "env-001";
  const managementRequestId = "req-001";
  const metricsUrl = `${GATEWAY_URL}projects/${projectId}/environments/${environmentId}/management-requests/${managementRequestId}/metrics`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ManagementRequestMetricsService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ManagementRequestMetricsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("sends a GET request to the metrics endpoint", async () => {
    const resultPromise = firstValueFrom(
      service.getManagementRequestMetrics(
        projectId,
        environmentId,
        managementRequestId
      )
    );

    const httpRequest = httpController.expectOne(metricsUrl);
    httpRequest.flush([]);
    await resultPromise;

    expect(httpRequest.request.method).toBe("GET");
  });

  it("returns the array of metrics from the response", async () => {
    const metrics: ManagementRequestMetricApiResponse[] = [
      {
        id: "metric-1",
        projectId,
        environmentId,
        managementRequestId,
        taskName: "task-a",
        startTime: "2024-01-01T00:00:00.000Z",
        endTime: "2024-01-01T00:01:00.000Z",
        duration: "PT1M",
      },
    ];

    const resultPromise = firstValueFrom(
      service.getManagementRequestMetrics(
        projectId,
        environmentId,
        managementRequestId
      )
    );

    httpController.expectOne(metricsUrl).flush(metrics);
    const result = await resultPromise;

    expect(result).toEqual(metrics);
  });

  it("propagates an error when the request fails", async () => {
    const resultPromise = firstValueFrom(
      service.getManagementRequestMetrics(
        projectId,
        environmentId,
        managementRequestId
      )
    ).catch((error) => error);

    httpController.expectOne(metricsUrl).flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });
    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
  });
});
