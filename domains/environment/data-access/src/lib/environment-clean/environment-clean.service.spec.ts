import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { EnvironmentCleanService } from "./environment-clean.service";

const GATEWAY_URL = "https://api.test.com/";

describe("EnvironmentCleanService", () => {
  let service: EnvironmentCleanService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EnvironmentCleanService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(EnvironmentCleanService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("cleanEnvironment", () => {
    const projectId = "proj-001";
    const environmentId = "env-001";

    it("sends a POST request to the single-environment clean endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.cleanEnvironment(projectId, environmentId)
      );

      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${projectId}/environments/${environmentId}/clean`
      );
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.method).toBe("POST");
    });

    it("sends a null body", async () => {
      const resultPromise = firstValueFrom(
        service.cleanEnvironment(projectId, environmentId)
      );

      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${projectId}/environments/${environmentId}/clean`
      );
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.body).toBeNull();
    });

    it("propagates an error when the request fails", async () => {
      const resultPromise = firstValueFrom(
        service.cleanEnvironment(projectId, environmentId)
      ).catch((error) => error);

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${projectId}/environments/${environmentId}/clean`
        )
        .flush("Server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });
});
