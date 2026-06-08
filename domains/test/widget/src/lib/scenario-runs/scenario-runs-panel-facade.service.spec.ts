import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, throwError } from "rxjs";
import { ScenarioRunsPanelFacadeService } from "./scenario-runs-panel-facade.service";
import type {
  ScenarioRunApiResponse,
  TestUnitApiModel,
} from "@mxevolve/domains/test/data-access";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestUnitService,
} from "@mxevolve/domains/test/data-access";
import {
  type Environment,
  EnvironmentService,
  type ManagementRequest,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { UserService } from "@mxevolve/domains/user/data-access";

function createTestUnit(
  overrides: Partial<TestUnitApiModel> = {}
): TestUnitApiModel {
  return {
    id: "tu-1",
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
    headScenarioExecutionId: "se-head",
    scenarioExecutions: [
      {
        scenarioExecutionId: "se-head",
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

function createApiResponse(
  overrides: Partial<ScenarioRunApiResponse> = {}
): ScenarioRunApiResponse {
  return {
    id: "run-1",
    name: "test-scenario",
    status: "Passed",
    analysisStatus: "PASSED",
    startDate: "2025-06-01T10:00:00Z",
    endDate: "2025-06-01T11:00:00Z",
    commitId: "abc123",
    assignee: "Test User",
    mxVersion: "3.1.64",
    mxBuildId: "build-1",
    envInfo: { environmentId: "env-1", status: "CREATED" },
    detections: {
      binaryImpactIds: [],
      configurationImpactIds: [],
      binaryRegressionIds: [],
      configurationRegressionIds: [],
      failureReasonIds: [],
    },
    linkedIncidents: [],
    ...overrides,
  } as ScenarioRunApiResponse;
}

function createEnvironment(id: string, status: EnvironmentStatus): Environment {
  return {
    id,
    status,
    projectId: "project-1",
    databases: [],
  };
}

describe("ScenarioRunsPanelFacadeService", () => {
  let service: ScenarioRunsPanelFacadeService;
  let scenarioRunService: jest.Mocked<Pick<ScenarioRunService, "fetch">>;
  let environmentService: jest.Mocked<
    Pick<EnvironmentService, "fetchByEnvironmentIds">
  >;
  let testUnitService: jest.Mocked<Pick<TestUnitService, "fetch">>;
  let scenarioDefinitionService: jest.Mocked<
    Pick<ScenarioDefinitionService, "getScenarioDefinitionById">
  >;
  let managementRequestService: jest.Mocked<
    Pick<ManagementRequestService, "fetchByProjectAndEnvironmentId">
  >;

  beforeEach(() => {
    scenarioRunService = {
      fetch: jest.fn(),
    };
    environmentService = {
      fetchByEnvironmentIds: jest.fn().mockReturnValue(of([])),
    };
    testUnitService = {
      fetch: jest.fn(),
    };
    scenarioDefinitionService = {
      getScenarioDefinitionById: jest.fn().mockReturnValue(
        of({
          id: "sd-1",
          projectId: "project-1",
          bpcs: [],
          name: "test",
          archived: false,
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          environmentDefinitionId: "",
          heaviness: "",
        })
      ),
    };
    managementRequestService = {
      fetchByProjectAndEnvironmentId: jest.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        ScenarioRunsPanelFacadeService,
        { provide: ScenarioRunService, useValue: scenarioRunService },
        { provide: EnvironmentService, useValue: environmentService },
        {
          provide: UserService,
          useValue: {
            fetchByIds: jest.fn().mockReturnValue(of([])),
          },
        },
        { provide: TestUnitService, useValue: testUnitService },
        {
          provide: ScenarioDefinitionService,
          useValue: scenarioDefinitionService,
        },
        {
          provide: ManagementRequestService,
          useValue: managementRequestService,
        },
      ],
    });

    service = TestBed.inject(ScenarioRunsPanelFacadeService);
  });

  describe("fetch with context params", () => {
    beforeEach(() => {
      scenarioRunService.fetch.mockReturnValue(of([]));
    });

    it("calls the test unit service with context params", async () => {
      testUnitService.fetch.mockReturnValue(of([]));

      await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(testUnitService.fetch).toHaveBeenCalledWith({
        projectId: "project-1",
        contextId: "ctx-1",
        subContextId: "sub-1",
      });
    });

    it("returns an empty array when no test units exist", async () => {
      testUnitService.fetch.mockReturnValue(of([]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results).toEqual([]);
    });

    it("returns one result per test unit", async () => {
      const tu1 = createTestUnit({
        id: "tu-1",
        scenarioDefinitionName: "scenario-A",
      });
      const tu2 = createTestUnit({
        id: "tu-2",
        scenarioDefinitionName: "scenario-B",
      });
      testUnitService.fetch.mockReturnValue(of([tu1, tu2]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results).toHaveLength(2);
      expect(results[0].head.name).toBe("scenario-A");
      expect(results[1].head.name).toBe("scenario-B");
    });

    it("separates head from previous runs within a test unit", async () => {
      const tu = createTestUnit({
        scenarioExecutions: [
          {
            ...createTestUnit().scenarioExecutions[0],
            scenarioExecutionId: "se-head",
          },
          {
            ...createTestUnit().scenarioExecutions[0],
            scenarioExecutionId: "se-prev",
            startDate: "2025-05-31T10:00:00Z",
          },
        ],
      });
      testUnitService.fetch.mockReturnValue(of([tu]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].head.id).toBe("se-head");
      expect(results[0].previousRuns).toHaveLength(1);
      expect(results[0].previousRuns[0].id).toBe("se-prev");
    });

    it("enriches environment statuses from the environment service", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      environmentService.fetchByEnvironmentIds.mockReturnValue(
        of([createEnvironment("env-1", EnvironmentStatus.READY)])
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].head.environmentStatus).toBe(EnvironmentStatus.READY);
      expect(environmentService.fetchByEnvironmentIds).toHaveBeenCalledWith([
        "env-1",
      ]);
    });

    it("skips environment fetch when no runs have environment IDs", async () => {
      const tu = createTestUnit({
        scenarioExecutions: [
          {
            ...createTestUnit().scenarioExecutions[0],
            environment: { environmentId: "", status: "" },
          },
        ],
      });
      testUnitService.fetch.mockReturnValue(of([tu]));

      await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(environmentService.fetchByEnvironmentIds).not.toHaveBeenCalled();
    });

    it("populates incident statuses from scenario run data", async () => {
      const tu = createTestUnit({
        scenarioExecutions: [
          {
            ...createTestUnit().scenarioExecutions[0],
            scenarioExecutionId: "se-head",
            analysisObjects: {
              binaryImpacts: [],
              binaryRegressions: [],
              configurationImpacts: [],
              configurationRegressions: [],
              failureReasons: [],
              incidents: ["inc-1"],
            },
          },
        ],
      });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(
        of([
          createApiResponse({
            id: "se-head",
            linkedIncidents: [
              {
                id: "inc-1",
                title: "issue",
                status: "Draft",
                assignee: "",
                reporter: "",
                creationDate: "",
                externalIssue: { id: "", origin: "", link: "" },
              },
            ],
          }),
        ])
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].filterData.hasIncidents).toBe(true);
      expect(results[0].filterData.incidentStatuses).toEqual(["Draft"]);
    });

    it("also fetches scenario runs when fetching by context", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));

      await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(scenarioRunService.fetch).toHaveBeenCalledWith(
        "project-1",
        "ctx-1",
        "sub-1"
      );
    });
  });

  describe("fetch with scenario run IDs", () => {
    it("calls the test unit service with scenarioExecutionIds", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1", "run-2"],
        })
      );

      expect(testUnitService.fetch).toHaveBeenCalledWith({
        projectId: "project-1",
        scenarioExecutionIds: ["run-1", "run-2"],
      });
    });

    it("calls the scenario run service with scenarioRunIds", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1", "run-2"],
        })
      );

      expect(scenarioRunService.fetch).toHaveBeenCalledWith(
        "project-1",
        undefined,
        undefined,
        undefined,
        ["run-1", "run-2"]
      );
    });

    it("returns an empty array when no test units exist", async () => {
      testUnitService.fetch.mockReturnValue(of([]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1"],
        })
      );

      expect(results).toEqual([]);
    });

    it("returns one result per test unit", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1"],
        })
      );

      expect(results).toHaveLength(1);
      expect(results[0].head.id).toBe("se-head");
    });

    it("enriches environment statuses via scenario run IDs path", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      environmentService.fetchByEnvironmentIds.mockReturnValue(
        of([createEnvironment("env-1", EnvironmentStatus.READY)])
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1"],
        })
      );

      expect(results[0].head.environmentStatus).toBe(EnvironmentStatus.READY);
    });

    it("prefers scenario run IDs over context when both provided", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
          scenarioRunIds: ["run-1"],
        })
      );

      expect(testUnitService.fetch).toHaveBeenCalledWith({
        projectId: "project-1",
        scenarioExecutionIds: ["run-1"],
      });
    });
  });

  describe("filterData", () => {
    it("populates filterData from test unit detections via context path", async () => {
      const tu = createTestUnit({
        scenarioExecutions: [
          {
            ...createTestUnit().scenarioExecutions[0],
            analysisObjects: {
              binaryImpacts: ["bi-1"],
              binaryRegressions: [],
              configurationImpacts: [],
              configurationRegressions: [],
              failureReasons: [],
              incidents: [],
            },
          },
        ],
      });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].filterData.hasImpacts).toBe(true);
      expect(results[0].filterData.hasRegressions).toBe(false);
    });

    it("populates filterData from test unit detections via scenario run IDs path", async () => {
      const tu = createTestUnit({
        scenarioExecutions: [
          {
            ...createTestUnit().scenarioExecutions[0],
            analysisObjects: {
              binaryImpacts: [],
              binaryRegressions: ["br-1"],
              configurationImpacts: [],
              configurationRegressions: [],
              failureReasons: [],
              incidents: [],
            },
          },
        ],
      });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1"],
        })
      );

      expect(results[0].filterData.hasRegressions).toBe(true);
      expect(results[0].filterData.hasImpacts).toBe(false);
    });

    it("fetches BPC IDs from scenario definitions for context path", async () => {
      const tu = createTestUnit({ scenarioDefinitionId: "sd-1" });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      scenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
        of({
          id: "sd-1",
          projectId: "project-1",
          bpcs: ["bpc-1", "bpc-2"],
          name: "test",
          archived: false,
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          environmentDefinitionId: "",
          heaviness: "",
        })
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(
        scenarioDefinitionService.getScenarioDefinitionById
      ).toHaveBeenCalledWith("sd-1", "project-1");
      expect(results[0].filterData.businessProcessChainIds).toEqual([
        "bpc-1",
        "bpc-2",
      ]);
    });

    it("fetches BPC IDs from scenario definition for scenario run IDs path", async () => {
      const tu = createTestUnit({ scenarioDefinitionId: "sd-99" });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      scenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
        of({
          id: "sd-99",
          projectId: "project-1",
          bpcs: ["bpc-x"],
          name: "test",
          archived: false,
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          environmentDefinitionId: "",
          heaviness: "",
        })
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          scenarioRunIds: ["run-1"],
        })
      );

      expect(
        scenarioDefinitionService.getScenarioDefinitionById
      ).toHaveBeenCalledWith("sd-99", "project-1");
      expect(results[0].filterData.businessProcessChainIds).toEqual(["bpc-x"]);
    });

    it("returns empty businessProcessChainIds when scenario definition has no bpcs", async () => {
      const tu = createTestUnit({ scenarioDefinitionId: "sd-1" });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      scenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
        of({
          id: "sd-1",
          projectId: "project-1",
          bpcs: [],
          name: "test",
          archived: false,
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          environmentDefinitionId: "",
          heaviness: "",
        })
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].filterData.businessProcessChainIds).toEqual([]);
    });
  });

  describe("duration breakdown enrichment", () => {
    it("populates testExecutionTimings from scenario run response via context path", async () => {
      const tu = createTestUnit({ headScenarioExecutionId: "se-head" });
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(
        of([
          createApiResponse({
            id: "se-head",
            testExecutions: [
              {
                startDate: "2025-06-01T10:00:00Z",
                endDate: "2025-06-01T10:30:00Z",
              },
            ],
          }),
        ])
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].durationBreakdown?.testExecutionTimings).toEqual([
        { startDate: "2025-06-01T10:00:00Z", endDate: "2025-06-01T10:30:00Z" },
      ]);
    });

    it("populates testExecutionTimings from scenario run response via scenarioRunIds path", async () => {
      testUnitService.fetch.mockReturnValue(of([createTestUnit()]));
      scenarioRunService.fetch.mockReturnValue(
        of([
          createApiResponse({
            id: "se-head",
            testExecutions: [
              {
                startDate: "2025-06-01T10:00:00Z",
                endDate: "2025-06-01T10:45:00Z",
              },
            ],
          }),
        ])
      );

      const results = await firstValueFrom(
        service.fetch({ projectId: "project-1", scenarioRunIds: ["run-1"] })
      );

      expect(results[0].durationBreakdown?.testExecutionTimings).toEqual([
        { startDate: "2025-06-01T10:00:00Z", endDate: "2025-06-01T10:45:00Z" },
      ]);
    });

    it("populates deploymentStartedOn and deploymentEndedOn from management requests", async () => {
      const tu = createTestUnit();
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      const deploymentRequest: ManagementRequest = {
        id: "req-1",
        type: "deployment",
        status: "COMPLETED",
        createdOn: "2025-06-01T09:00:00Z",
        startedOn: "2025-06-01T09:05:00Z",
        endedOn: "2025-06-01T09:20:00Z",
      };
      managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
        of([deploymentRequest])
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].durationBreakdown?.deploymentStartedOn).toBe(
        "2025-06-01T09:05:00Z"
      );
      expect(results[0].durationBreakdown?.deploymentEndedOn).toBe(
        "2025-06-01T09:20:00Z"
      );
    });

    it("sets deploymentStartedOn and deploymentEndedOn to undefined when no deployment request exists", async () => {
      const tu = createTestUnit();
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
        of([])
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results[0].durationBreakdown?.deploymentStartedOn).toBeUndefined();
      expect(results[0].durationBreakdown?.deploymentEndedOn).toBeUndefined();
    });

    it("gracefully handles ManagementRequestService error and still returns the panel", async () => {
      const tu = createTestUnit();
      testUnitService.fetch.mockReturnValue(of([tu]));
      scenarioRunService.fetch.mockReturnValue(of([]));
      managementRequestService.fetchByProjectAndEnvironmentId.mockReturnValue(
        throwError(() => new Error("network error"))
      );

      const results = await firstValueFrom(
        service.fetch({
          projectId: "project-1",
          contextId: "ctx-1",
          subContextId: "sub-1",
        })
      );

      expect(results).toHaveLength(1);
      expect(results[0].head.id).toBe("se-head");
    });
  });
});
