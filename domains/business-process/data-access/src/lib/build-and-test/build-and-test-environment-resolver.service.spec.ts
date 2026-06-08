import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { BuildAndTestEnvironmentResolverService } from "./build-and-test-environment-resolver.service";

describe("BuildAndTestEnvironmentResolverService", () => {
  const PROJECT_ID = "projectId";
  const SCENARIO_EXECUTION_ID = "scenario-exec-1";
  const GATEWAY_URL = "https://api.test.com/";
  const EXPECTED_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_EXECUTION_ID}`;

  let service: BuildAndTestEnvironmentResolverService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BuildAndTestEnvironmentResolverService,
      ],
    });

    service = TestBed.inject(BuildAndTestEnvironmentResolverService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should call the scenario-execution endpoint correctly", () => {
    service.resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID).subscribe();

    httpTestingController.expectOne({ method: "GET", url: EXPECTED_URL });
  });

  it("should map envInfo to the environment id and status", () => {
    let result: unknown;

    service
      .resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe((env) => {
        result = env;
      });

    httpTestingController
      .expectOne(EXPECTED_URL)
      .flush({ envInfo: { environmentId: "env-1", status: "READY" } });

    expect(result).toEqual({
      environmentId: "env-1",
      environmentStatus: "READY",
    });
  });

  it("should default to empty values when envInfo is absent", () => {
    let result: unknown;

    service
      .resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe((env) => {
        result = env;
      });

    httpTestingController.expectOne(EXPECTED_URL).flush({});

    expect(result).toEqual({ environmentId: "", environmentStatus: "" });
  });

  it("should surface the error message on failure", () => {
    let errorMessage: string | undefined;

    service.resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID).subscribe({
      error: (error) => {
        errorMessage = error.message;
      },
    });

    httpTestingController
      .expectOne(EXPECTED_URL)
      .flush(
        { message: "Scenario execution not found" },
        { status: 404, statusText: "Not Found" }
      );

    expect(errorMessage).toBe("Scenario execution not found");
  });
});
