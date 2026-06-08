import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ServiceActionsService } from "./service-actions.service";
import { firstValueFrom } from "rxjs";
import {
  StartEnvironmentResponseApiModel,
  StopEnvironmentResponseApiModel,
  EnvironmentServicesResponseApiModel,
} from "./service-actions-api-model";

const GATEWAY_URL = "https://api.test.com/";

describe("ServiceActionsService", () => {
  let service: ServiceActionsService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ServiceActionsService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ServiceActionsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("startEnvironment", () => {
    it("sends a POST request and maps the response", async () => {
      const apiResponse: StartEnvironmentResponseApiModel = {
        startRequestId: "start-123",
      };

      const resultPromise = firstValueFrom(
        service.startEnvironment("proj-001", "env-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/start`
      );
      expect(request.request.method).toBe("POST");
      request.flush(apiResponse);

      const result = await resultPromise;

      expect(result).toEqual({ startRequestId: "start-123" });
    });

    it("propagates errors", async () => {
      const resultPromise = firstValueFrom(
        service.startEnvironment("proj-001", "env-001")
      ).catch((error) => error);

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/start`
      );
      request.flush("Server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("stopEnvironment", () => {
    it("sends a POST request and maps the response", async () => {
      const apiResponse: StopEnvironmentResponseApiModel = {
        stopRequestId: "stop-456",
      };

      const resultPromise = firstValueFrom(
        service.stopEnvironment("proj-001", "env-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/stop`
      );
      expect(request.request.method).toBe("POST");
      request.flush(apiResponse);

      const result = await resultPromise;

      expect(result).toEqual({ stopRequestId: "stop-456" });
    });

    it("propagates errors", async () => {
      const resultPromise = firstValueFrom(
        service.stopEnvironment("proj-001", "env-001")
      ).catch((error) => error);

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/stop`
      );
      request.flush("Server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("fetchEnvironmentServices", () => {
    it("sends a GET request and maps the response services", async () => {
      const apiResponse: EnvironmentServicesResponseApiModel = {
        environmentId: "env-001",
        services: [
          {
            name: "mx-service",
            nickname: "MX",
            installationCode: "MX001",
            description: "Main service",
            status: "RUNNING",
          },
          {
            name: "db-service",
            nickname: "DB",
            installationCode: "DB001",
            description: "Database service",
            status: "STOPPED",
          },
        ],
      };

      const resultPromise = firstValueFrom(
        service.fetchEnvironmentServices("proj-001", "env-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/services/status`
      );
      expect(request.request.method).toBe("GET");
      request.flush(apiResponse);

      const result = await resultPromise;

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        name: "mx-service",
        nickname: "MX",
        installationCode: "MX001",
        description: "Main service",
        status: "RUNNING",
      });
      expect(result[1]).toEqual({
        name: "db-service",
        nickname: "DB",
        installationCode: "DB001",
        description: "Database service",
        status: "STOPPED",
      });
    });

    it("propagates errors", async () => {
      const resultPromise = firstValueFrom(
        service.fetchEnvironmentServices("proj-001", "env-001")
      ).catch((error) => error);

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/services/status`
      );
      request.flush("Server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("excludeFromDailyShutdown", () => {
    it("sends a POST request with exclude set to true", async () => {
      const resultPromise = firstValueFrom(
        service.excludeFromDailyShutdown("proj-001", "env-001", true)
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/services/exclude-from-shutdown/true`
      );
      expect(request.request.method).toBe("POST");
      request.flush(null);

      await resultPromise;
    });

    it("sends a POST request with exclude set to false", async () => {
      const resultPromise = firstValueFrom(
        service.excludeFromDailyShutdown("proj-001", "env-001", false)
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/services/exclude-from-shutdown/false`
      );
      expect(request.request.method).toBe("POST");
      request.flush(null);

      await resultPromise;
    });

    it("propagates errors", async () => {
      const resultPromise = firstValueFrom(
        service.excludeFromDailyShutdown("proj-001", "env-001", true)
      ).catch((error) => error);

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/services/exclude-from-shutdown/true`
      );
      request.flush("Server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });
});
