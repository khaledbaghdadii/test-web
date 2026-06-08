import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { TestUnitService } from "./test-unit.service";
import type { TestUnitApiModel } from "./test-unit-api-model";

const GATEWAY_URL = "https://api.test.com/";

function createTestUnitApiModel(
  overrides: Partial<TestUnitApiModel> = {}
): TestUnitApiModel {
  return {
    id: "tu-1",
    headScenarioExecutionId: "se-1",
    scenarioDefinitionId: "sd-1",
    scenarioDefinitionName: "test-scenario",
    contextId: "ctx-1",
    subContextId: "sub-1",
    assignee: "user-1",
    branch: "main",
    repushable: false,
    disableKeepExecution: false,
    validationScopeEnabled: false,
    incidentEnabled: false,
    scenarioExecutions: [
      {
        scenarioExecutionId: "se-1",
        analysisObjects: {
          binaryImpacts: [],
          binaryRegressions: [],
          configurationImpacts: [],
          configurationRegressions: [],
          failureReasons: [],
          incidents: [],
        },
        analysisStatus: "Passed",
        status: "Passed",
        startDate: "2025-06-01T10:00:00Z",
        endDate: "2025-06-01T11:00:00Z",
        commitId: "abc123",
        mxVersion: "3.1.64",
        mxBuildId: "build-1",
        factoryProductId: "",
        keptExecution: false,
        environment: { environmentId: "env-1", status: "CREATED" },
        cleaningStatus: "",
        failed: false,
        finished: true,
      },
    ],
    ...overrides,
  } as TestUnitApiModel;
}

describe("TestUnitService", () => {
  let service: TestUnitService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TestUnitService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(TestUnitService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("fetch", () => {
    it("sends contextId and subContextId as query params", async () => {
      const result$ = firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      const req = httpController.expectOne(
        (r) =>
          r.url ===
            `${GATEWAY_URL}projects/project-1/test-execution-manager/test-units` &&
          r.params.get("contextId") === "ctx-1" &&
          r.params.get("subContextId") === "sub-1"
      );
      req.flush([createTestUnitApiModel()]);

      const result = await result$;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("tu-1");
    });

    it("returns API model fields directly without mapping", async () => {
      const result$ = firstValueFrom(
        service.fetch({ projectId: "project-1", contextId: "ctx-1" })
      );

      httpController
        .expectOne(
          (r) =>
            r.url ===
            `${GATEWAY_URL}projects/project-1/test-execution-manager/test-units`
        )
        .flush([createTestUnitApiModel()]);

      const result = await result$;
      const tu = result[0];

      expect(tu.scenarioDefinitionName).toBe("test-scenario");
      expect(tu.assignee).toBe("user-1");
      expect(tu.scenarioExecutions[0].scenarioExecutionId).toBe("se-1");
      expect(tu.scenarioExecutions[0].environment.environmentId).toBe("env-1");
      expect(tu.scenarioExecutions[0].failed).toBe(false);
      expect(tu.scenarioExecutions[0].finished).toBe(true);
    });

    it("returns an empty array when no test units exist", async () => {
      const result$ = firstValueFrom(
        service.fetch({ projectId: "project-1", contextId: "ctx-1" })
      );

      httpController
        .expectOne(
          (r) =>
            r.url ===
            `${GATEWAY_URL}projects/project-1/test-execution-manager/test-units`
        )
        .flush([]);

      const result = await result$;
      expect(result).toEqual([]);
    });
  });
});
