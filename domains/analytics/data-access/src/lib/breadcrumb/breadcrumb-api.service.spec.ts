import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import { BreadcrumbApiService } from "./breadcrumb-api.service";
import type { BreadcrumbResponse } from "./breadcrumb.model";

const GATEWAY_URL = "https://api.test.com/";
const PROJECT_ID = "project-1";
const RESOURCE_ID = "scenario-1";

describe("BreadcrumbApiService", () => {
  let service: BreadcrumbApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BreadcrumbApiService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(BreadcrumbApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("getBreadcrumb", () => {
    it("targets the breadcrumb endpoint for the given project", async () => {
      const result$ = firstValueFrom(
        service.getBreadcrumb(PROJECT_ID, "SCENARIO", RESOURCE_ID)
      );

      const req = httpController.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}analytics/projects/${PROJECT_ID}/breadcrumb`
      );
      req.flush({ target: { type: "SCENARIO", projectId: PROJECT_ID } });
      await result$;

      expect(req.request.method).toBe("GET");
    });

    it("sends the resourceType query parameter", async () => {
      const result$ = firstValueFrom(
        service.getBreadcrumb(PROJECT_ID, "MERGE_REQUEST", RESOURCE_ID)
      );

      const req = httpController.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}analytics/projects/${PROJECT_ID}/breadcrumb`
      );
      req.flush({ target: { type: "MERGE_REQUEST", projectId: PROJECT_ID } });
      await result$;

      expect(req.request.params.get("resourceType")).toBe("MERGE_REQUEST");
    });

    it("sends the resourceId query parameter", async () => {
      const result$ = firstValueFrom(
        service.getBreadcrumb(PROJECT_ID, "SCENARIO", RESOURCE_ID)
      );

      const req = httpController.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}analytics/projects/${PROJECT_ID}/breadcrumb`
      );
      req.flush({ target: { type: "SCENARIO", projectId: PROJECT_ID } });
      await result$;

      expect(req.request.params.get("resourceId")).toBe(RESOURCE_ID);
    });

    it("returns the breadcrumb response body", async () => {
      const response: BreadcrumbResponse = {
        target: {
          type: "SCENARIO",
          id: RESOURCE_ID,
          name: "Login TPK",
          projectId: PROJECT_ID,
          available: true,
          siblings: [],
        },
      };

      const result$ = firstValueFrom(
        service.getBreadcrumb(PROJECT_ID, "SCENARIO", RESOURCE_ID)
      );

      const req = httpController.expectOne(
        (request) =>
          request.url ===
          `${GATEWAY_URL}analytics/projects/${PROJECT_ID}/breadcrumb`
      );
      req.flush(response);

      await expect(result$).resolves.toEqual(response);
    });
  });
});
