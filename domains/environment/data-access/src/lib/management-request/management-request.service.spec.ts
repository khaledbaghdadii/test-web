import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ManagementRequestService } from "./management-request.service";
import { firstValueFrom } from "rxjs";
import { ManagementRequestApiModel } from "./management-request-api-model";

const GATEWAY_URL = "https://api.test.com/";

describe("ManagementRequestService", () => {
  let service: ManagementRequestService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ManagementRequestService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ManagementRequestService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("fetches management requests and maps the response", async () => {
    const apiResponse: ManagementRequestApiModel[] = [
      {
        id: "req-1",
        correlationId: "corr-1",
        createdOn: "2025-01-08T12:00:00Z",
        startedOn: "2025-01-08T12:01:00Z",
        endedOn: "2025-01-08T13:00:00Z",
        environmentId: "env-001",
        status: "ENDED",
        type: "deployment",
        result: {
          status: "FAILURE",
          message: "Deployment failed",
        },
      },
    ];

    const resultPromise = firstValueFrom(
      service.fetchByProjectAndEnvironmentId("proj-001", "env-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/requests`
    );
    request.flush(apiResponse);

    const result = await resultPromise;

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("req-1");
    expect(result[0].type).toBe("deployment");
    expect(result[0].resultMessage).toBe("Deployment failed");
  });

  it("propagates errors", async () => {
    const resultPromise = firstValueFrom(
      service.fetchByProjectAndEnvironmentId("proj-001", "env-001")
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/requests`
    );
    request.flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
  });
});
