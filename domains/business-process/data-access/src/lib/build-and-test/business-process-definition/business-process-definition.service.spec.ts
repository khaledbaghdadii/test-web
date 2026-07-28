import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { BusinessProcessDefinitionService } from "./business-process-definition.service";

describe("BusinessProcessDefinitionService", () => {
  const GATEWAY_URL = "https://api.test/";
  const PROJECT_ID = "project-1";
  const BASE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/definitions`;

  let service: BusinessProcessDefinitionService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BusinessProcessDefinitionService,
      ],
    });

    service = TestBed.inject(BusinessProcessDefinitionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("fetches business process definitions with legacy filters", () => {
    service
      .getBusinessProcessDefinitions({
        projectId: PROJECT_ID,
        executable: true,
        extendable: false,
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      (req) => req.url === BASE_URL
    );

    expect(request.request.method).toBe("GET");
    expect(request.request.params.get("executable")).toBe("true");
    expect(request.request.params.get("extendable")).toBe("false");
  });

  it("fetches a single business process definition by id", async () => {
    const definition = {
      id: "def-1",
      name: "Build and Test",
      providedInputs: [{ inputId: "repositoryId", value: "repo-1" }],
    };

    const resultPromise = firstValueFrom(
      service.getBusinessProcessDefinition(PROJECT_ID, "def-1")
    );

    const request = httpTestingController.expectOne(`${BASE_URL}/def-1`);
    expect(request.request.method).toBe("GET");
    request.flush(definition);

    expect(await resultPromise).toEqual(definition);
  });

  it("returns the fetched business process definitions", async () => {
    const definitions = [
      { id: "def-1", name: "Build and Test" },
      { id: "def-2", name: "Validation" },
    ];

    const resultPromise = firstValueFrom(
      service.getBusinessProcessDefinitions({ projectId: PROJECT_ID })
    );

    httpTestingController
      .expectOne((req) => req.url === BASE_URL)
      .flush(definitions);

    expect(await resultPromise).toEqual(definitions);
  });

  it("returns the family, sourceDefinitionId and providedInputs of each definition", async () => {
    const definitions = [
      {
        id: "def-1",
        name: "On-demand backport",
        processName: "Backport",
        family: { id: "user-story-build-and-test", name: "Build & Test" },
        sourceDefinitionId: "on-demand-backport",
        providedInputs: [{ inputId: "repositoryId", value: "repo-1" }],
      },
    ];

    const resultPromise = firstValueFrom(
      service.getBusinessProcessDefinitions({
        projectId: PROJECT_ID,
        executable: true,
        extendable: false,
      })
    );

    httpTestingController
      .expectOne((req) => req.url === BASE_URL)
      .flush(definitions);

    expect(await resultPromise).toEqual(definitions);
  });

  it("omits extendable and executable params when not provided", () => {
    service
      .getBusinessProcessDefinitions({ projectId: PROJECT_ID })
      .subscribe();

    const request = httpTestingController.expectOne(
      (req) => req.url === BASE_URL
    );

    expect(request.request.params.has("executable")).toBe(false);
    expect(request.request.params.has("extendable")).toBe(false);
  });

  it("throws the server string error when fetching definitions fails", async () => {
    const resultPromise = firstValueFrom(
      service.getBusinessProcessDefinitions({ projectId: PROJECT_ID })
    );

    httpTestingController
      .expectOne((req) => req.url === BASE_URL)
      .flush("definitions unavailable", {
        status: 500,
        statusText: "Internal Server Error",
      });

    await expect(resultPromise).rejects.toThrow("definitions unavailable");
  });

  it("throws the server error message object when fetching definitions fails", async () => {
    const resultPromise = firstValueFrom(
      service.getBusinessProcessDefinitions({ projectId: PROJECT_ID })
    );

    httpTestingController
      .expectOne((req) => req.url === BASE_URL)
      .flush(
        { message: "not authorized" },
        { status: 403, statusText: "Forbidden" }
      );

    await expect(resultPromise).rejects.toThrow("not authorized");
  });
});
