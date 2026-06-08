import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { InfraAllocationsService } from "./infra-allocations.service";
import { AllocationMetricsApiResponse } from "./model/allocation-metrics.model";
import { provideHttpClient } from "@angular/common/http";

describe("InfraAllocationsService", () => {
  let service: InfraAllocationsService;
  let httpMock: HttpTestingController;
  const mockGatewayUrl = "http://api/";
  const mockConfig: AppConfig = { gatewayUrl: mockGatewayUrl } as AppConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InfraAllocationsService,
        { provide: APP_CONFIG, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(InfraAllocationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return mapped allocation metrics", () => {
    const apiResponse: AllocationMetricsApiResponse = {
      states: {
        deallocation_failed: 1,
        failed: 2,
        queued: 3,
      },
    };

    service.getAllocationMetrics("proj1").subscribe((result) => {
      expect(result).toEqual({
        states: {
          deallocationFailed: 1,
          failed: 2,
          queued: 3,
        },
      });
    });

    const req = httpMock.expectOne(
      `${mockGatewayUrl}projects/proj1/infra/management/allocations/metrics`
    );
    expect(req.request.method).toBe("GET");
    req.flush(apiResponse);
  });

  it("should throw error on http failure", () => {
    service.getAllocationMetrics("proj1").subscribe({
      next: () => fail("should have errored"),
      error: (err) => {
        expect(err.message).toBe("Could not fetch allocation metrics");
      },
    });

    const req = httpMock.expectOne(
      `${mockGatewayUrl}projects/proj1/infra/management/allocations/metrics`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
