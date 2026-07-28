import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import {
  TechnicalReseedExecutionGroupStatus,
  TechnicalReseedStatus,
} from "./technical-reseed.model";
import { TechnicalReseedService } from "./technical-reseed.service";

describe("TechnicalReseedService", () => {
  const GATEWAY_URL = "https://gateway.test/";
  const PROJECT_ID = "project-001";
  const EXECUTION_GROUP_ID = "execution-group-001";

  let service: TechnicalReseedService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TechnicalReseedService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(TechnicalReseedService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("fetches technical reseed execution group details", async () => {
    const resultPromise = firstValueFrom(
      service.getExecutionGroupDetails(PROJECT_ID, EXECUTION_GROUP_ID)
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}`
    );
    expect(request.request.method).toBe("GET");
    request.flush({
      executionGroupId: EXECUTION_GROUP_ID,
      status: TechnicalReseedExecutionGroupStatus.ENABLED,
      launchesAllowed: true,
      technicalReseedOperations: [
        {
          id: "operation-001",
          status: TechnicalReseedStatus.PASSED,
          branch: "release/branch",
          sourceCommit: "abc123",
          maintenanceLevel: "Full",
          environmentDefinitionId: "env-def-001",
          createdOn: "2026-06-01T10:00:00Z",
        },
      ],
    });

    const result = await resultPromise;

    expect(result.executionGroupId).toBe(EXECUTION_GROUP_ID);
    expect(result.technicalReseedOperations?.[0].sourceCommit).toBe("abc123");
  });

  it("launches a technical reseed operation", async () => {
    const payload = {
      infraGroupId: "infra-group-001",
      branch: "release/branch",
      configurationCommitId: "abc123",
      environmentDefinitionId: "env-def-001",
      maintenanceConfiguration: { full: true },
      validationLevel: "MQG",
      targetBranch: "target/branch",
    };

    const resultPromise = firstValueFrom(
      service.launchTechnicalReseed(PROJECT_ID, EXECUTION_GROUP_ID, payload)
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/launch-reseed`
    );
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual(payload);
    request.flush({ requestId: "request-001" });

    await expect(resultPromise).resolves.toEqual({ requestId: "request-001" });
  });

  it("propagates backend error messages when launching fails", async () => {
    const resultPromise = firstValueFrom(
      service.launchTechnicalReseed(PROJECT_ID, EXECUTION_GROUP_ID, {
        infraGroupId: "infra-group-001",
        branch: "release/branch",
        configurationCommitId: "abc123",
        environmentDefinitionId: "env-def-001",
        maintenanceConfiguration: { full: true },
        targetBranch: "target/branch",
      })
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/launch-reseed`
    );
    request.flush(
      { message: "launch rejected" },
      { status: 409, statusText: "Conflict" }
    );

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("launch rejected");
  });

  it("propagates backend error messages when fetching execution group details fails", async () => {
    const resultPromise = firstValueFrom(
      service.getExecutionGroupDetails(PROJECT_ID, EXECUTION_GROUP_ID)
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}`
      )
      .flush(
        { message: "group not found" },
        { status: 404, statusText: "Not Found" }
      );

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("group not found");
  });

  it("falls back to the status text when fetching details fails without an error body message", async () => {
    const resultPromise = firstValueFrom(
      service.getExecutionGroupDetails(PROJECT_ID, EXECUTION_GROUP_ID)
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("500");
  });

  it("falls back to the status text when launching fails without an error body message", async () => {
    const resultPromise = firstValueFrom(
      service.launchTechnicalReseed(PROJECT_ID, EXECUTION_GROUP_ID, {
        infraGroupId: "infra-group-001",
        branch: "release/branch",
        configurationCommitId: "abc123",
        environmentDefinitionId: "env-def-001",
        maintenanceConfiguration: { full: true },
        targetBranch: "target/branch",
      })
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/launch-reseed`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("500");
  });

  describe("Resume Technical Reseed", () => {
    const OPERATION_ID = "operation-001";

    it("posts to the resume endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.resumeTechnicalReseed(
          PROJECT_ID,
          EXECUTION_GROUP_ID,
          OPERATION_ID
        )
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/operations/${OPERATION_ID}/resume`
      );
      expect(request.request.method).toBe("POST");
      expect(request.request.body).toEqual({});
      request.flush(null);

      await expect(resultPromise).resolves.toBeNull();
    });

    it("propagates backend error messages when resuming fails", async () => {
      const resultPromise = firstValueFrom(
        service.resumeTechnicalReseed(
          PROJECT_ID,
          EXECUTION_GROUP_ID,
          OPERATION_ID
        )
      ).catch((error) => error);

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/operations/${OPERATION_ID}/resume`
        )
        .flush(
          { message: "operation not pausable" },
          { status: 409, statusText: "Conflict" }
        );

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("operation not pausable");
    });

    it("falls back to the status text when resuming fails without an error body message", async () => {
      const resultPromise = firstValueFrom(
        service.resumeTechnicalReseed(
          PROJECT_ID,
          EXECUTION_GROUP_ID,
          OPERATION_ID
        )
      ).catch((error) => error);

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/technical-reseed-execution-groups/${EXECUTION_GROUP_ID}/operations/${OPERATION_ID}/resume`
        )
        .flush(null, { status: 500, statusText: "Internal Server Error" });

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("500");
    });
  });
});
