import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import { ReferenceScenariosService } from "./reference-scenario.service";
import { ReferenceScenarioApiModel } from "../models/reference-scenario-api-model";
import { EnvironmentService } from "@mxevolve/domains/environment/data-access";
import {
  EnvironmentApiModel,
  EnvironmentStatus,
} from "@mxflow/features/environment";

const GATEWAY_URL = "https://api.test.com/";
const PROJECT_ID = "projectId";
const GROUP_ID = "groupId";

const scenarioExecutionsUrl = `${GATEWAY_URL}projects/${PROJECT_ID}/test-execution-manager/scenario-executions`;
const matchScenarioExecutions = (req: { url: string }) =>
  req.url === scenarioExecutionsUrl;
const environmentUrl = (environmentId: string) =>
  `${GATEWAY_URL}projects/${PROJECT_ID}/environments/${environmentId}`;

const getReferenceScenario = (
  overrides: Partial<ReferenceScenarioApiModel> = {}
): ReferenceScenarioApiModel => ({
  id: "scenarioId",
  name: "TPK Alpha",
  status: "EXECUTING",
  startDate: "2026-03-01T10:00:00Z",
  endDate: "2026-03-01T11:00:00Z",
  envInfo: {
    environmentId: "environmentId",
  },
  commitId: "abc123",
  mxVersion: "9.24",
  mxBuildId: "9.24.1.12345",
  ...overrides,
});

const getEnvironment = (
  id: string,
  status = EnvironmentStatus.READY
): EnvironmentApiModel =>
  ({
    id,
    status,
    projectId: PROJECT_ID,
    createdOn: "2026-02-28T09:00:00Z",
  } as EnvironmentApiModel);

describe("ReferenceScenariosService", () => {
  let service: ReferenceScenariosService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ReferenceScenariosService,
        EnvironmentService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ReferenceScenariosService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("given no group id when fetching reference scenario executions, then should return empty", async () => {
    const result = await firstValueFrom(
      service.fetchReferenceScenarios(PROJECT_ID, "")
    );

    expect(result).toEqual([]);
    httpController.expectNone(scenarioExecutionsUrl);
  });

  it("when fetching reference scenarios executions, then should return scenario executions filtered by group id", async () => {
    const resultPromise = firstValueFrom(
      service.fetchReferenceScenarios(PROJECT_ID, GROUP_ID)
    );

    const scenarioRequest = httpController.expectOne(
      (req) => req.url === scenarioExecutionsUrl
    );
    expect(scenarioRequest.request.method).toBe("GET");
    expect(scenarioRequest.request.params.get("executionGroupId")).toBe(
      GROUP_ID
    );
    scenarioRequest.flush([getReferenceScenario()]);

    httpController
      .expectOne(environmentUrl("environmentId"))
      .flush(getEnvironment("environmentId"));

    const result = await resultPromise;
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      scenarioExecutionId: "scenarioId",
      tpkName: "TPK Alpha",
      scenarioStatus: "EXECUTING",
      tpkCommitId: "abc123",
      environment: {
        id: "environmentId",
        status: "READY",
      },
    });
  });

  it("when fetching reference scenarios executions, then should fetch the environment of each scenario execution accordingly", async () => {
    const resultPromise = firstValueFrom(
      service.fetchReferenceScenarios(PROJECT_ID, GROUP_ID)
    );

    httpController.expectOne(matchScenarioExecutions).flush([
      getReferenceScenario({
        id: "scenarioId",
        envInfo: { environmentId: "environmentId" },
      }),
      getReferenceScenario({
        id: "scenarioId2",
        envInfo: { environmentId: "environmentId2" },
      }),
    ]);

    httpController
      .expectOne(environmentUrl("environmentId"))
      .flush(getEnvironment("environmentId"));
    httpController
      .expectOne(environmentUrl("environmentId2"))
      .flush(getEnvironment("environmentId2"));

    const result = await resultPromise;
    expect(result.map((row) => row.scenarioExecutionId)).toEqual([
      "scenarioId",
      "scenarioId2",
    ]);
    expect(result.map((row) => row.environment?.id)).toEqual([
      "environmentId",
      "environmentId2",
    ]);
  });

  it("given a failure occurs when fetching reference scenario executions, then should propagate the error", async () => {
    const resultPromise = firstValueFrom(
      service.fetchReferenceScenarios(PROJECT_ID, GROUP_ID)
    );

    httpController
      .expectOne(matchScenarioExecutions)
      .flush(
        { message: "scenario boom" },
        { status: 500, statusText: "Server Error" }
      );

    await expect(resultPromise).rejects.toThrow();
  });

  it("given a failure occurs when fetching environment details, then should propagate the error", async () => {
    const resultPromise = firstValueFrom(
      service.fetchReferenceScenarios(PROJECT_ID, GROUP_ID)
    );

    httpController
      .expectOne(matchScenarioExecutions)
      .flush([getReferenceScenario()]);
    httpController
      .expectOne(environmentUrl("environmentId"))
      .flush(
        { message: "env boom" },
        { status: 500, statusText: "Server Error" }
      );

    await expect(resultPromise).rejects.toThrow();
  });
});
