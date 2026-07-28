import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { EnvironmentAbortService } from "./environment-abort.service";
import { BulkAbortRequest } from "./bulk-abort-request";

const GATEWAY_URL = "https://api.test.com/";

describe("EnvironmentAbortService", () => {
  let service: EnvironmentAbortService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EnvironmentAbortService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(EnvironmentAbortService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("abortEnvironments", () => {
    const request: BulkAbortRequest = { environmentIds: ["env-1", "env-2"] };

    it("sends a POST request to the bulk abort endpoint", async () => {
      const resultPromise = firstValueFrom(service.abortEnvironments(request));

      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}environments/abort`
      );
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.method).toBe("POST");
    });

    it("sends the bulk abort request as the body", async () => {
      const resultPromise = firstValueFrom(service.abortEnvironments(request));

      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}environments/abort`
      );
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.body).toEqual(request);
    });

    it("propagates an error when the request fails", async () => {
      const resultPromise = firstValueFrom(
        service.abortEnvironments(request)
      ).catch((error) => error);

      httpController
        .expectOne(`${GATEWAY_URL}environments/abort`)
        .flush("Server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("abortProjectEnvironments", () => {
    const projectId = "proj-001";
    const request: BulkAbortRequest = { environmentIds: ["env-1"] };

    it("sends a POST request to the project abort endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.abortProjectEnvironments(projectId, request)
      );

      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${projectId}/environments/abort`
      );
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.method).toBe("POST");
    });

    it("sends the bulk abort request as the body", async () => {
      const resultPromise = firstValueFrom(
        service.abortProjectEnvironments(projectId, request)
      );

      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${projectId}/environments/abort`
      );
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.body).toEqual(request);
    });

    it("propagates an error when the request fails", async () => {
      const resultPromise = firstValueFrom(
        service.abortProjectEnvironments(projectId, request)
      ).catch((error) => error);

      httpController
        .expectOne(`${GATEWAY_URL}projects/${projectId}/environments/abort`)
        .flush("Server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });
});
