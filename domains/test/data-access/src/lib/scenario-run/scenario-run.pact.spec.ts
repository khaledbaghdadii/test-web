import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { ScenarioRunService } from "./scenario-run.service";
import { ScenarioDefinitionService } from "../scenario-definition/scenario-definition.service";
import { TestDefinitionService } from "../test-definition/test-definition.service";
import { TestUnitService } from "../test-unit/test-unit.service";

const PROJECT_ID = "project_1";
const SCENARIO_RUN_ID = "scenarioRunId";

describe("scenario run service contract tests", () => {
  const provider = new Pact({
    consumer: "web-test",
    provider: "test-execution-manager",
  });

  let appConfig: AppConfig;
  let scenarioRunService: ScenarioRunService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = { gatewayUrl: `http://127.0.0.1:${port}/` } as AppConfig;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ScenarioRunService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    scenarioRunService = TestBed.inject(ScenarioRunService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validate contract for aborting a non existing scenario run", async () => {
    await provider.addInteraction({
      state: "abort scenario execution by id that does not exist",
      uponReceiving: "a request to abort a non existing scenario run",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_RUN_ID}/abort`,
        body: {},
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    expect(
      await lastValueFrom(
        scenarioRunService
          .abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID)
          .pipe(catchError((error) => of(error.message)))
      )
    ).toBeTruthy();
  });

  test("validate contract for a failed abort of a scenario run", async () => {
    await provider.addInteraction({
      state: "failed to abort scenario execution by id",
      uponReceiving: "a request to abort a scenario run that fails",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_RUN_ID}/abort`,
        body: {},
      },
      willRespondWith: {
        status: 500,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    expect(
      await lastValueFrom(
        scenarioRunService
          .abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID)
          .pipe(catchError((error) => of(error.message)))
      )
    ).toBeTruthy();
  });

  test("validate contract for aborting a scenario run", async () => {
    await provider.addInteraction({
      state: "abort scenario execution by id",
      uponReceiving: "a request to abort a scenario run",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_RUN_ID}/abort`,
        body: {},
      },
      willRespondWith: {
        status: 200,
        body: null,
      },
    });

    expect(
      await lastValueFrom(
        scenarioRunService
          .abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID)
          .pipe(catchError((error) => of(error.message)))
      )
    ).toBeUndefined();
  });

  test("validate contract for rerunning a scenario from factory product", async () => {
    await provider.addInteraction({
      state: "a user is repushing a scenario execution",
      uponReceiving:
        "a request to rerun a scenario execution from a factory product",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_RUN_ID}/repush`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          factoryProductId: Matchers.string("fp-1"),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          testExecutionId: Matchers.string("exec-1"),
        },
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.rerunScenarioFromFactoryProduct(
        PROJECT_ID,
        SCENARIO_RUN_ID,
        { factoryProductId: "fp-1" }
      )
    );

    expect(result.testExecutionId).toBeTruthy();
  });

  test("validate contract for fetching a scenario run by id", async () => {
    await provider.addInteraction({
      state: "scenario execution exists by id",
      uponReceiving: "a request to fetch a scenario run by id",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/${SCENARIO_RUN_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string(SCENARIO_RUN_ID),
          mxVersion: Matchers.string("3.1.65"),
        },
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.fetchById(PROJECT_ID, SCENARIO_RUN_ID)
    );

    expect(result.mxVersion).toBeTruthy();
  });

  test("validate contract for running a scenario", async () => {
    const executionGroupId = "executionGroupId";

    await provider.addInteraction({
      state: "a user is running a scenario execution",
      uponReceiving: "a request to run a scenario execution",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/execute`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          scenarioDefinitionId: Matchers.string("scenario-definition-1"),
          subContextId: Matchers.string("BUILD_AND_TEST"),
          branchName: Matchers.string("feature/temp-branch"),
          fullMaintenance: Matchers.boolean(false),
          executionGroupId: Matchers.string(executionGroupId),
          machineGroupId: Matchers.string("infra-group-1"),
          disableKeepExecution: Matchers.boolean(true),
          disableConfigurationEditor: Matchers.boolean(false),
          supportReconActivities: Matchers.boolean(false),
          stopServices: Matchers.boolean(true),
          validationScopeEnabled: Matchers.boolean(false),
          incidentEnabled: Matchers.boolean(false),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          testExecutionId: Matchers.string("test-execution-1"),
        },
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.runScenario(PROJECT_ID, {
        scenarioDefinitionId: "scenario-definition-1",
        subContextId: "BUILD_AND_TEST",
        branchName: "feature/temp-branch",
        commitId: null,
        executionGroupId,
        machineGroupId: "infra-group-1",
        disableKeepExecution: true,
        disableConfigurationEditor: false,
        supportReconActivities: false,
        stopServices: true,
        validationScopeEnabled: false,
        incidentEnabled: false,
      })
    );

    expect(result.testExecutionId).toBeTruthy();
  });

  test("validate contract for checking if scenario execution is allowed", async () => {
    const executionGroupId = "executionGroupId";

    await provider.addInteraction({
      state: "scenario executions are allowed",
      uponReceiving: "a request to check if scenario execution is allowed",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/test-execution-manager/execution-group/${executionGroupId}/scenario-execution/can-push`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          actionAllowed: Matchers.boolean(true),
          rejectionReasons: [],
          warnings: [],
        },
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.isExecutionAllowed(PROJECT_ID, executionGroupId)
    );

    expect(result.actionAllowed).toBeDefined();
    expect(result.rejectionReasons).toBeDefined();
    expect(result.warnings).toBeDefined();
  });

  test("validate contract for updating scenario execution assignee", async () => {
    await provider.addInteraction({
      state: "A scenario aggregation that can be assigned to a user exists",
      uponReceiving: "a request to update scenario execution assignee",
      withRequest: {
        method: "PUT",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/assignee`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          assignee: Matchers.string("user-1"),
          scenarioDefinitionId: Matchers.string("sd-1"),
          contextId: Matchers.string("ctx-1"),
        },
      },
      willRespondWith: {
        status: 200,
      },
    });

    const result = await lastValueFrom(
      scenarioRunService
        .updateAssignee(PROJECT_ID, {
          assignee: "user-1",
          scenarioDefinitionId: "sd-1",
          contextId: "ctx-1",
        })
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeUndefined();
  });

  test("validate contract for checking if repush is allowed", async () => {
    const executionGroupId = "executionGroupId";

    await provider.addInteraction({
      state: "scenario executions are allowed",
      uponReceiving: "a request to check if repush is allowed",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/test-execution-manager/execution-group/${executionGroupId}/scenario-execution/${SCENARIO_RUN_ID}/can-repush`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          actionAllowed: Matchers.boolean(true),
          rejectionReasons: Matchers.eachLike(Matchers.string("reason")),
          warnings: Matchers.eachLike(Matchers.string("warning")),
        },
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.isRepushAllowed(
        PROJECT_ID,
        executionGroupId,
        SCENARIO_RUN_ID
      )
    );

    expect(result.actionAllowed).toBeDefined();
    expect(result.rejectionReasons).toBeDefined();
    expect(result.warnings).toBeDefined();
  });

  test("validate contract for bulk rerunning scenario executions", async () => {
    await provider.addInteraction({
      state: "a user is repushing a bulk of scenario executions",
      uponReceiving: "a request to bulk rerun scenario executions",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions/repush/bulk`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          factoryProductId: Matchers.string("fp-1"),
          testScenarioExecutions: Matchers.eachLike(
            Matchers.string("scenario-run-1")
          ),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          successfulRepushes: Matchers.eachLike({
            originalScenarioExecutionId: Matchers.string("scenario-run-1"),
            repushedScenarioExecutionId: Matchers.string("new-scenario-run-1"),
          }),
          failedRepushes: Matchers.eachLike(Matchers.string("scenario-run-2")),
        },
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.bulkRerun(PROJECT_ID, {
        factoryProductId: "fp-1",
        scenariosToBeRepushed: ["scenario-run-1"],
      })
    );

    expect(result.successfulRepushes).toBeDefined();
    expect(result.failedRepushes).toBeDefined();
  });

  test("validate contract for fetching scenario runs by context", async () => {
    const contextId = "ctx-1";
    const subContextId = "sub-ctx-1";
    const statuses = ["PASSED"];

    await provider.addInteraction({
      state: "Scenario executions exist given filters",
      uponReceiving:
        "a request to fetch scenario runs by context, subContext and statuses",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions`,
        query: {
          contextId: Matchers.string(contextId),
          subContextId: Matchers.string(subContextId),
          statuses: Matchers.string(statuses.join(",")),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.eachLike({
          id: Matchers.string(SCENARIO_RUN_ID),
          startDate: Matchers.iso8601DateTimeWithMillis(
            "2023-07-28T14:35:22.123Z"
          ),
          commitId: Matchers.string("abc123"),
          mxVersion: Matchers.string("3.1.65"),
          mxBuildId: Matchers.string("build-001"),
          analysisStatus: Matchers.string("Passed"),
          detections: {
            binaryImpactIds: Matchers.eachLike(Matchers.string("impact-1")),
            configurationImpactIds: Matchers.eachLike(
              Matchers.string("config-impact-1")
            ),
            binaryRegressionIds: Matchers.eachLike(
              Matchers.string("regression-1")
            ),
            configurationRegressionIds: Matchers.eachLike(
              Matchers.string("config-regression-1")
            ),
            failureReasonIds: Matchers.eachLike(
              Matchers.string("failure-reason-1")
            ),
          },
          linkedIncidents: Matchers.eachLike({
            id: Matchers.string("incident-1"),
            title: Matchers.string("Incident title"),
            status: Matchers.string("Open"),
            assignee: Matchers.string("user-1"),
            reporter: Matchers.string("user-2"),
            externalIssue: {
              id: Matchers.string("ext-1"),
              origin: Matchers.string("jira"),
              link: Matchers.string("https://jira.example.com/EXT-1"),
            },
          }),
        }),
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.fetch(PROJECT_ID, contextId, subContextId, statuses)
    );

    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBeTruthy();
    expect(result[0].startDate).toBeTruthy();
    expect(result[0].commitId).toBeTruthy();
    expect(result[0].mxVersion).toBeTruthy();
    expect(result[0].mxBuildId).toBeTruthy();
    expect(result[0].analysisStatus).toBeTruthy();
    expect(result[0].detections).toBeTruthy();
    expect(result[0].detections.binaryImpactIds.length).toBeGreaterThanOrEqual(
      1
    );
    expect(
      result[0].detections.configurationImpactIds.length
    ).toBeGreaterThanOrEqual(1);
    expect(
      result[0].detections.binaryRegressionIds.length
    ).toBeGreaterThanOrEqual(1);
    expect(
      result[0].detections.configurationRegressionIds.length
    ).toBeGreaterThanOrEqual(1);
    expect(result[0].detections.failureReasonIds.length).toBeGreaterThanOrEqual(
      1
    );
    expect(result[0].linkedIncidents.length).toBeGreaterThanOrEqual(1);
    expect(result[0].linkedIncidents[0].id).toBeTruthy();
    expect(result[0].linkedIncidents[0].status).toBeTruthy();
  });

  test("validate contract for fetching scenario runs by IDs", async () => {
    const scenarioRunIds = ["run-1", "run-2"];

    await provider.addInteraction({
      state: "Scenario executions exist given filters",
      uponReceiving: "a request to fetch scenario runs by scenarioExecutionIds",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/test-execution-manager/scenario-executions`,
        query: {
          scenarioExecutionIds: Matchers.string(scenarioRunIds.join(",")),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: Matchers.eachLike({
          id: Matchers.string(SCENARIO_RUN_ID),
          startDate: Matchers.iso8601DateTimeWithMillis(
            "2023-07-28T14:35:22.123Z"
          ),
          commitId: Matchers.string("abc123"),
          mxVersion: Matchers.string("3.1.65"),
          mxBuildId: Matchers.string("build-001"),
          analysisStatus: Matchers.string("Passed"),
          detections: {
            binaryImpactIds: Matchers.eachLike(Matchers.string("impact-1")),
            configurationImpactIds: Matchers.eachLike(
              Matchers.string("config-impact-1")
            ),
            binaryRegressionIds: Matchers.eachLike(
              Matchers.string("regression-1")
            ),
            configurationRegressionIds: Matchers.eachLike(
              Matchers.string("config-regression-1")
            ),
            failureReasonIds: Matchers.eachLike(
              Matchers.string("failure-reason-1")
            ),
          },
          linkedIncidents: Matchers.eachLike({
            id: Matchers.string("incident-1"),
            title: Matchers.string("Incident title"),
            status: Matchers.string("Open"),
            assignee: Matchers.string("user-1"),
            reporter: Matchers.string("user-2"),
            externalIssue: {
              id: Matchers.string("ext-1"),
              origin: Matchers.string("jira"),
              link: Matchers.string("https://jira.example.com/EXT-1"),
            },
          }),
        }),
      },
    });

    const result = await lastValueFrom(
      scenarioRunService.fetch(
        PROJECT_ID,
        undefined,
        undefined,
        undefined,
        scenarioRunIds
      )
    );

    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBeTruthy();
    expect(result[0].analysisStatus).toBeTruthy();
    expect(result[0].detections).toBeTruthy();
    expect(result[0].detections.binaryImpactIds.length).toBeGreaterThanOrEqual(
      1
    );
    expect(
      result[0].detections.configurationImpactIds.length
    ).toBeGreaterThanOrEqual(1);
    expect(
      result[0].detections.binaryRegressionIds.length
    ).toBeGreaterThanOrEqual(1);
    expect(
      result[0].detections.configurationRegressionIds.length
    ).toBeGreaterThanOrEqual(1);
    expect(result[0].detections.failureReasonIds.length).toBeGreaterThanOrEqual(
      1
    );
    expect(result[0].linkedIncidents.length).toBeGreaterThanOrEqual(1);
    expect(result[0].linkedIncidents[0].id).toBeTruthy();
    expect(result[0].linkedIncidents[0].status).toBeTruthy();
  });
});

const SCENARIO_DEFINITION_PROJECT_ID = "projectId";
const SCENARIO_DEFINITION_ID = "scenarioDefinitionId";

describe("ScenarioDefinitionService contract tests", () => {
  const provider = new Pact({
    consumer: "web-test",
    provider: "test-definition-service",
  });

  let appConfig: AppConfig;
  let service: ScenarioDefinitionService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    } as AppConfig;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ScenarioDefinitionService,
        { provide: TestDefinitionService, useValue: {} },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(ScenarioDefinitionService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should fetch a scenario definition by id", async () => {
    await provider.addInteraction({
      state: "Scenario definition exists",
      uponReceiving: "a request to get a scenario definition by id",
      withRequest: {
        method: "GET",
        path: `/projects/${SCENARIO_DEFINITION_PROJECT_ID}/test-scenario/${SCENARIO_DEFINITION_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string(SCENARIO_DEFINITION_ID),
          name: Matchers.string("scenario-name"),
          archived: Matchers.boolean(false),
          idempotent: Matchers.boolean(true),
          nonFunctionalTest: Matchers.boolean(false),
          heaviness: Matchers.string("LIGHT"),
          environmentDefinitionId: Matchers.string("envDefId"),
          bpcs: Matchers.eachLike(Matchers.string("bpc")),
          tests: Matchers.eachLike({
            testDefinitionId: Matchers.string("testDefId"),
            full: Matchers.boolean(true),
            testSelectionIds: Matchers.eachLike(
              Matchers.string("testSelectionId")
            ),
          }),
        },
      },
    });

    const scenario = await lastValueFrom(
      service.getScenarioDefinitionById(
        SCENARIO_DEFINITION_ID,
        SCENARIO_DEFINITION_PROJECT_ID
      )
    );

    expect(scenario).not.toBeNull();
    expect(scenario.id).toBeTruthy();
    expect(scenario.name).toBeTruthy();
  });

  test("should fail when the scenario definition does not exist", async () => {
    await provider.addInteraction({
      state: "Scenario definition does not exist",
      uponReceiving: "a request to get a non-existing scenario definition",
      withRequest: {
        method: "GET",
        path: `/projects/${SCENARIO_DEFINITION_PROJECT_ID}/test-scenario/${SCENARIO_DEFINITION_ID}`,
      },
      willRespondWith: {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      },
    });

    const result = await lastValueFrom(
      service
        .getScenarioDefinitionById(
          SCENARIO_DEFINITION_ID,
          SCENARIO_DEFINITION_PROJECT_ID
        )
        .pipe(catchError((error) => of(error.message)))
    );

    expect(result).toBeTruthy();
  });
});

const TEST_UNIT_PROJECT_ID = "project_1";

describe("TestUnitService contract tests", () => {
  const provider = new Pact({
    consumer: "web-test",
    provider: "test-execution-manager",
  });

  let appConfig: AppConfig;
  let service: TestUnitService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = { gatewayUrl: `http://127.0.0.1:${port}/` } as AppConfig;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        TestUnitService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(TestUnitService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  function testUnitScenarioExecutionMatcher() {
    return {
      scenarioExecutionId: Matchers.string("se-1"),
      analysisObjects: {
        binaryImpacts: Matchers.eachLike(Matchers.string("bi-1")),
        binaryRegressions: Matchers.eachLike(Matchers.string("br-1")),
        configurationImpacts: Matchers.eachLike(Matchers.string("ci-1")),
        configurationRegressions: Matchers.eachLike(Matchers.string("cr-1")),
        failureReasons: Matchers.eachLike(Matchers.string("fr-1")),
        incidents: Matchers.eachLike(Matchers.string("inc-1")),
      },
      analysisStatus: Matchers.string("Passed"),
      status: Matchers.string("Passed"),
      startDate: Matchers.string("2025-06-01T10:00:00Z"),
      endDate: Matchers.string("2025-06-01T11:00:00Z"),
      commitId: Matchers.string("abc123"),
      mxVersion: Matchers.string("3.1.64"),
      mxBuildId: Matchers.string("build-1"),
      factoryProductId: Matchers.string(""),
      keptExecution: Matchers.boolean(false),
      environment: {
        environmentId: Matchers.string("env-1"),
        status: Matchers.string("CREATED"),
      },
      cleaningStatus: Matchers.string(""),
      failed: Matchers.boolean(false),
      finished: Matchers.boolean(true),
    };
  }

  function testUnitBodyMatcher() {
    return {
      id: Matchers.string("tu-1"),
      headScenarioExecutionId: Matchers.string("se-1"),
      scenarioDefinitionId: Matchers.string("sd-1"),
      scenarioDefinitionName: Matchers.string("test-scenario"),
      contextId: Matchers.string("ctx-1"),
      assignee: Matchers.string("user-1"),
      branch: Matchers.string("main"),
      repushable: Matchers.boolean(false),
      disableKeepExecution: Matchers.boolean(false),
      validationScopeEnabled: Matchers.boolean(false),
      incidentEnabled: Matchers.boolean(false),
      scenarioExecutions: Matchers.eachLike(testUnitScenarioExecutionMatcher()),
    };
  }

  test("validates contract for fetching test units by context", async () => {
    await provider.addInteraction({
      state: "fetch test units",
      uponReceiving: "a request to fetch test units by context",
      withRequest: {
        method: "GET",
        path: `/projects/${TEST_UNIT_PROJECT_ID}/test-execution-manager/test-units`,
        query: {
          contextId: "ctx-1",
          subContextId: "sub-1",
          scenarioDefinitionId: "sd-1",
          scenarioExecutionIds: "se-1",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: Matchers.eachLike(testUnitBodyMatcher()),
      },
    });

    const result = await lastValueFrom(
      service.fetch({
        projectId: TEST_UNIT_PROJECT_ID,
        contextId: "ctx-1",
        subContextId: "sub-1",
        scenarioDefinitionId: "sd-1",
        scenarioExecutionIds: ["se-1"],
      })
    );

    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBeTruthy();
    expect(result[0].scenarioDefinitionName).toBeTruthy();
    expect(result[0].scenarioExecutions.length).toBeGreaterThanOrEqual(1);
    expect(result[0].scenarioExecutions[0].scenarioExecutionId).toBeTruthy();
    expect(
      result[0].scenarioExecutions[0].environment.environmentId
    ).toBeTruthy();
  });

  test("validates contract for fetching test units with no results", async () => {
    await provider.addInteraction({
      state: "no test units exist for context",
      uponReceiving: "a request to fetch test units that returns empty",
      withRequest: {
        method: "GET",
        path: `/projects/${TEST_UNIT_PROJECT_ID}/test-execution-manager/test-units`,
        query: {
          contextId: "non-existent",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: [],
      },
    });

    const result = await lastValueFrom(
      service.fetch({
        projectId: TEST_UNIT_PROJECT_ID,
        contextId: "non-existent",
      })
    );

    expect(result).toEqual([]);
  });
});
