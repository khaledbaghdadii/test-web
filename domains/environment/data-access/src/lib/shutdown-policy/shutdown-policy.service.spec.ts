import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ShutdownPolicyService } from "./shutdown-policy.service";

const GATEWAY_URL = "https://api.test.com/";

describe("ShutdownPolicyService", () => {
  let service: ShutdownPolicyService;
  let httpController: HttpTestingController;

  const projectId = "proj-001";
  const allocationId = "alloc-001";
  const allocationUrl = `${GATEWAY_URL}projects/${projectId}/infra/management/allocations/${allocationId}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ShutdownPolicyService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ShutdownPolicyService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("getEnvironmentShutdownPolicyState", () => {
    it("sends a GET request to the allocation endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      );

      const httpRequest = httpController.expectOne(allocationUrl);
      httpRequest.flush({ state: "active" });
      await resultPromise;

      expect(httpRequest.request.method).toBe("GET");
    });

    it("maps the includedInShutdown flag to isIncludedInShutdown", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      );

      httpController.expectOne(allocationUrl).flush({
        state: "active",
        allocationShutdownPolicy: { includedInShutdown: true },
      });
      const result = await resultPromise;

      expect(result.isIncludedInShutdown).toBe(true);
    });

    it("returns undefined isIncludedInShutdown when no shutdown policy is present", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      );

      httpController.expectOne(allocationUrl).flush({ state: "active" });
      const result = await resultPromise;

      expect(result.isIncludedInShutdown).toBeUndefined();
    });

    it("allows actions when the allocation state is active", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      );

      httpController.expectOne(allocationUrl).flush({ state: "active" });
      const result = await resultPromise;

      expect(result.actionsAllowed).toBe(true);
    });

    it("allows actions when the allocation state is idle", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      );

      httpController.expectOne(allocationUrl).flush({ state: "idle" });
      const result = await resultPromise;

      expect(result.actionsAllowed).toBe(true);
    });

    it("disallows actions when the allocation state is not active or idle", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      );

      httpController.expectOne(allocationUrl).flush({ state: "deallocated" });
      const result = await resultPromise;

      expect(result.actionsAllowed).toBe(false);
    });

    it("propagates an error when the request fails", async () => {
      const resultPromise = firstValueFrom(
        service.getEnvironmentShutdownPolicyState(projectId, allocationId)
      ).catch((error) => error);

      httpController
        .expectOne(allocationUrl)
        .flush(
          { message: "boom" },
          { status: 500, statusText: "Internal Server Error" }
        );
      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("includeEnvironmentInShutdownPolicy", () => {
    const includeUrl = `${allocationUrl}/include`;

    it("sends a PUT request to the include endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.includeEnvironmentInShutdownPolicy(projectId, allocationId)
      );

      const httpRequest = httpController.expectOne(includeUrl);
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.method).toBe("PUT");
    });

    it("sends the MUREX policy type in the body", async () => {
      const resultPromise = firstValueFrom(
        service.includeEnvironmentInShutdownPolicy(projectId, allocationId)
      );

      const httpRequest = httpController.expectOne(includeUrl);
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.body).toEqual({ policyType: "MUREX" });
    });

    it("propagates an error when the request fails", async () => {
      const resultPromise = firstValueFrom(
        service.includeEnvironmentInShutdownPolicy(projectId, allocationId)
      ).catch((error) => error);

      httpController
        .expectOne(includeUrl)
        .flush(
          { message: "boom" },
          { status: 500, statusText: "Internal Server Error" }
        );
      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("excludeEnvironmentFromShutdownPolicy", () => {
    const excludeUrl = `${allocationUrl}/exclude`;

    it("sends a PUT request to the exclude endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.excludeEnvironmentFromShutdownPolicy(projectId, allocationId)
      );

      const httpRequest = httpController.expectOne(excludeUrl);
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.method).toBe("PUT");
    });

    it("sends the MUREX policy type in the body", async () => {
      const resultPromise = firstValueFrom(
        service.excludeEnvironmentFromShutdownPolicy(projectId, allocationId)
      );

      const httpRequest = httpController.expectOne(excludeUrl);
      httpRequest.flush(null);
      await resultPromise;

      expect(httpRequest.request.body).toEqual({ policyType: "MUREX" });
    });

    it("propagates an error when the request fails", async () => {
      const resultPromise = firstValueFrom(
        service.excludeEnvironmentFromShutdownPolicy(projectId, allocationId)
      ).catch((error) => error);

      httpController
        .expectOne(excludeUrl)
        .flush(
          { message: "boom" },
          { status: 500, statusText: "Internal Server Error" }
        );
      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
    });
  });
});
