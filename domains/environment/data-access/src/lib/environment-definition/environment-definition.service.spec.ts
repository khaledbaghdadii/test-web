import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import { EnvironmentDefinitionService } from "./environment-definition.service";
import { EnvironmentDefinitionStatus } from "./environment-definition";

const GATEWAY_URL = "https://api.test.com/";

describe("EnvironmentDefinitionService", () => {
  let service: EnvironmentDefinitionService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EnvironmentDefinitionService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(EnvironmentDefinitionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch active environment definitions by default", async () => {
    const resultPromise = firstValueFrom(
      service.getEnvironmentDefinitions("proj-001")
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
          `${GATEWAY_URL}projects/proj-001/environments/definitions` &&
        req.params.get("includeInactive") === "false"
    );
    expect(request.request.method).toBe("GET");
    request.flush([
      {
        id: "env-def-001",
        name: "Small",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
    ]);

    await expect(resultPromise).resolves.toEqual([
      {
        id: "env-def-001",
        name: "Small",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
    ]);
  });

  it("should include inactive environment definitions when requested", async () => {
    service.getEnvironmentDefinitions("proj-001", true).subscribe();

    const request = httpController.expectOne(
      (req) =>
        req.url ===
          `${GATEWAY_URL}projects/proj-001/environments/definitions` &&
        req.params.get("includeInactive") === "true"
    );

    expect(request.request.method).toBe("GET");
    request.flush([]);
  });

  it("should fetch environment definition by id", async () => {
    const resultPromise = firstValueFrom(
      service.getEnvironmentDefinitionById("proj-001", "env-def-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/definitions/env-def-001`
    );
    expect(request.request.method).toBe("GET");
    request.flush({
      id: "env-def-001",
      name: "Small",
      status: EnvironmentDefinitionStatus.ACTIVE,
    });

    await expect(resultPromise).resolves.toEqual({
      id: "env-def-001",
      name: "Small",
      status: EnvironmentDefinitionStatus.ACTIVE,
    });
  });

  it("should use the nested error message when fetching definitions fails", async () => {
    const resultPromise = firstValueFrom(
      service.getEnvironmentDefinitions("proj-001")
    ).catch((error) => error);

    httpController
      .expectOne(
        (req) =>
          req.url === `${GATEWAY_URL}projects/proj-001/environments/definitions`
      )
      .flush(
        { message: "definitions forbidden" },
        { status: 403, statusText: "Forbidden" }
      );

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("definitions forbidden");
  });

  it("should propagate errors when fetching a definition by id fails", async () => {
    const resultPromise = firstValueFrom(
      service.getEnvironmentDefinitionById("proj-001", "env-def-001")
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/definitions/env-def-001`
      )
      .flush(
        { message: "definition not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("definition not found");
  });
});
