import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import {
  ScenarioRunApiResponse,
  ScenarioRunService,
} from "@mxevolve/domains/test/data-access";
import { BuildAndTestEnvironmentResolverService } from "./build-and-test-environment-resolver.service";

describe("BuildAndTestEnvironmentResolverService", () => {
  const PROJECT_ID = "projectId";
  const SCENARIO_EXECUTION_ID = "scenario-exec-1";

  const scenarioRunService = {
    fetchById: jest.fn(),
  };

  let service: BuildAndTestEnvironmentResolverService;

  function buildResponse(
    overrides: Partial<ScenarioRunApiResponse> = {}
  ): ScenarioRunApiResponse {
    return {
      envInfo: { environmentId: "env-1", status: "READY" },
      ...overrides,
    } as ScenarioRunApiResponse;
  }

  beforeEach(() => {
    jest.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: ScenarioRunService, useValue: scenarioRunService },
        BuildAndTestEnvironmentResolverService,
      ],
    });

    service = TestBed.inject(BuildAndTestEnvironmentResolverService);
  });

  it("fetches the scenario execution by id", () => {
    scenarioRunService.fetchById.mockReturnValue(of(buildResponse()));

    service.resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID).subscribe();

    expect(scenarioRunService.fetchById).toHaveBeenCalledWith(
      PROJECT_ID,
      SCENARIO_EXECUTION_ID
    );
  });

  it("maps envInfo to the environment id and status", () => {
    scenarioRunService.fetchById.mockReturnValue(of(buildResponse()));
    let result: unknown;

    service
      .resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe((env) => {
        result = env;
      });

    expect(result).toEqual({
      environmentId: "env-1",
      environmentStatus: "READY",
    });
  });

  it("defaults to empty values when envInfo is absent", () => {
    scenarioRunService.fetchById.mockReturnValue(
      of({ envInfo: undefined } as unknown as ScenarioRunApiResponse)
    );
    let result: unknown;

    service
      .resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID)
      .subscribe((env) => {
        result = env;
      });

    expect(result).toEqual({ environmentId: "", environmentStatus: "" });
  });

  it("surfaces the error message on failure", () => {
    scenarioRunService.fetchById.mockReturnValue(
      throwError(() => new Error("Scenario execution not found"))
    );
    let errorMessage: string | undefined;

    service.resolveEnvironment(PROJECT_ID, SCENARIO_EXECUTION_ID).subscribe({
      error: (error) => {
        errorMessage = error.message;
      },
    });

    expect(errorMessage).toBe("Scenario execution not found");
  });
});
