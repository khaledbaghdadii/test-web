import { TestBed } from "@angular/core/testing";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom, lastValueFrom, of, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestUnitService } from "@mxflow/test-management";
import { FetchTestUnitsRequest } from "./fetch-test-units.request";
import {
  TestUnitModel,
  TestUnitScenarioExecutionModel,
} from "./test-unit.model";
import {
  TestUnitApiModel,
  TestUnitScenarioExecutionApiModel,
} from "./test-unit.api.model";

const GATEWAY_URL = "https://gateway/";
const PROJECT_ID = "proj1";
const CONTEXT_ID_1 = "ctx1";
const SUB_CONTEXT_ID_1 = "sub1";
const SCENARIO_DEFINITION_ID_1 = "def1";
const SCENARIO_EXECUTION_ID_1 = "se1";
const SCENARIO_EXECUTION_ID_2 = "se2";
const STATUS_PASSED = "PASSED";
const ENV_STATUS_READY = "READY";
const COMMIT_ID = "commit";
const MX_VERSION = "mxVersion";
const MX_BUILD_ID = "mxBuildId";
const FACTORY_PRODUCT_ID = "factoryProductId";
const ENV_ID = "env";
const TEST_UNIT_ID_1 = "tu1";
const SCENARIO_DEFINITION_ID_TU1 = "def";
const SCENARIO_DEFINITION_NAME_TU1 = "defName";
const CONTEXT_ID_TU1 = "ctx";
const SUB_CONTEXT_ID_TU1 = "sub";
const ASSIGNEE_TU1 = "assignee";
const BRANCH_TU1 = "branch";
const TEST_UNIT_ID_2 = "tu2";
const SCENARIO_DEFINITION_ID_TU2 = "def2";
const SCENARIO_DEFINITION_NAME_TU2 = "defName2";
const CONTEXT_ID_TU2 = "ctx2";
const SUB_CONTEXT_ID_TU2 = "sub2";
const ASSIGNEE_TU2 = "assignee2";
const BRANCH_TU2 = "branch2";
const SCENARIO_EXECUTION_ID_OLD = "seOld";
const SCENARIO_EXECUTION_ID_NEW = "seNew";
const SCENARIO_EXECUTION_ID_MID = "seMid";
const SCENARIO_EXECUTION_ID_1B = "se1b";
const SCENARIO_EXECUTION_ID_2B = "se2b";
const PARAM_CONTEXT_ID = "contextId";
const PARAM_SUB_CONTEXT_ID = "subContextId";
const PARAM_SCENARIO_DEFINITION_ID = "scenarioDefinitionId";
const PARAM_SCENARIO_EXECUTION_IDS = "scenarioExecutionIds";
const PATH_PROJECTS = "projects";
const PATH_TEST_EXECUTION_MANAGER = "test-execution-manager";
const PATH_TEST_UNITS = "test-units";
const START_DATE_SE1 = "2025-10-08T09:30:00.000Z";
const START_DATE_SE2 = "2025-10-08T10:00:00.000Z";
const START_DATE_SE1B = "2025-10-08T09:00:00.000Z";
const START_DATE_SE2B = "2025-10-08T09:45:00.000Z";
const START_DATE_EARLIEST = "2025-10-01T08:00:00.000Z";
const START_DATE_MIDDLE = "2025-10-05T08:00:00.000Z";
const START_DATE_LATEST = "2025-10-09T08:00:00.000Z";
const CLEANING_STATUS = "status";

describe("TestUnitService", () => {
  let service: TestUnitService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [
        TestUnitService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(TestUnitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetch", () => {
    it("should fetch test units if no filters are provided", async () => {
      const request: FetchTestUnitsRequest = { projectId: PROJECT_ID };
      const expectedUrl = buildTestUnitsUrl(request.projectId);
      const expectedParams = new HttpParams();

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of([getTestUnitApiModel1(), getTestUnitApiModel2()]));

      const result = await firstValueFrom(service.fetch(request));

      expect(httpClient.get).toHaveBeenCalledWith(expectedUrl, {
        params: expectedParams,
      });
      expect(result).toEqual([getTestUnit1(), getTestUnit2()]);
    });

    it("should fetch test units if all filters are provided", async () => {
      const request: FetchTestUnitsRequest = {
        projectId: PROJECT_ID,
        contextId: CONTEXT_ID_1,
        subContextId: SUB_CONTEXT_ID_1,
        scenarioDefinitionId: SCENARIO_DEFINITION_ID_1,
        scenarioExecutionIds: [
          SCENARIO_EXECUTION_ID_1,
          SCENARIO_EXECUTION_ID_2,
        ],
      };
      const expectedUrl = buildTestUnitsUrl(request.projectId);
      const expectedParams = new HttpParams()
        .set(PARAM_CONTEXT_ID, request.contextId!)
        .set(PARAM_SUB_CONTEXT_ID, request.subContextId!)
        .set(PARAM_SCENARIO_DEFINITION_ID, request.scenarioDefinitionId!)
        .set(
          PARAM_SCENARIO_EXECUTION_IDS,
          request.scenarioExecutionIds!.join(",")
        );

      const mockResponse: TestUnitModel[] = [];
      jest.spyOn(httpClient, "get").mockReturnValue(of(mockResponse));

      const result = await firstValueFrom(service.fetch(request));
      expect(httpClient.get).toHaveBeenCalledWith(expectedUrl, {
        params: expectedParams,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should sort scenario executions by descending startDate and preserve headScenarioExecution", async () => {
      const request: FetchTestUnitsRequest = { projectId: PROJECT_ID };
      const expectedUrl = buildTestUnitsUrl(request.projectId);

      jest.spyOn(httpClient, "get").mockReturnValue(
        of([
          getTestUnitApiModel1({
            headScenarioExecutionId: SCENARIO_EXECUTION_ID_MID,
            scenarioExecutions: [
              buildScenarioExecutionApiModel(
                SCENARIO_EXECUTION_ID_OLD,
                START_DATE_EARLIEST
              ),
              buildScenarioExecutionApiModel(
                SCENARIO_EXECUTION_ID_NEW,
                START_DATE_LATEST
              ),
              buildScenarioExecutionApiModel(
                SCENARIO_EXECUTION_ID_MID,
                START_DATE_MIDDLE
              ),
            ],
          }),
        ])
      );

      const result = await firstValueFrom(service.fetch(request));
      expect(httpClient.get).toHaveBeenCalledWith(expectedUrl, {
        params: new HttpParams(),
      });
      expect(result.length).toBe(1);
      const testUnit = result[0];
      const orderedIds = testUnit.scenarioExecutions.map((se) => se.id);
      expect(orderedIds).toEqual([
        SCENARIO_EXECUTION_ID_NEW,
        SCENARIO_EXECUTION_ID_MID,
        SCENARIO_EXECUTION_ID_OLD,
      ]);
      expect(testUnit.scenarioExecutions[0].startDate).toBe(START_DATE_LATEST);
      expect(testUnit.scenarioExecutions[1].startDate).toBe(START_DATE_MIDDLE);
      expect(testUnit.scenarioExecutions[2].startDate).toBe(
        START_DATE_EARLIEST
      );
      expect(testUnit.headScenarioExecution.id).toBe(SCENARIO_EXECUTION_ID_MID);
    });

    it("should default analysis objects arrays to empty when analysisObjects is undefined", async () => {
      const request: FetchTestUnitsRequest = { projectId: PROJECT_ID };
      const expectedUrl = buildTestUnitsUrl(request.projectId);

      jest.spyOn(httpClient, "get").mockReturnValue(
        of([
          getTestUnitApiModel1({
            headScenarioExecutionId: "noAO",
            scenarioExecutions: [
              buildScenarioExecutionApiModel("noAO", START_DATE_LATEST, {
                analysisObjects: undefined,
              }),
            ],
          }),
        ])
      );

      const result = await firstValueFrom(service.fetch(request));
      expect(httpClient.get).toHaveBeenCalledWith(expectedUrl, {
        params: new HttpParams(),
      });
      expect(result.length).toBe(1);
      const testUnit = result[0];
      expect(testUnit.scenarioExecutions.length).toBe(1);
      const analysisObject = testUnit.scenarioExecutions[0].analysisObjects;
      const emptyLists = {
        binaryImpacts: [],
        binaryRegressions: [],
        configurationImpacts: [],
        configurationRegressions: [],
        failureReasons: [],
        incidents: [],
      };
      expect(analysisObject).toEqual(emptyLists);
      expect(testUnit.headScenarioExecution.analysisObjects).toEqual(
        emptyLists
      );
    });
  });

  describe("fetchById", () => {
    it("should call the fetch test unit by id endpoint", async () => {
      const expectedUrl = `${GATEWAY_URL}projects/${PROJECT_ID}/test-execution-manager/test-units/${TEST_UNIT_ID_1}`;
      jest.spyOn(httpClient, "get").mockReturnValue(of(getTestUnitApiModel1()));
      await firstValueFrom(service.fetchById(PROJECT_ID, TEST_UNIT_ID_1));
      expect(httpClient.get).toHaveBeenCalledWith(expectedUrl);
    });

    it("should return the fetched test unit", async () => {
      jest.spyOn(httpClient, "get").mockReturnValue(of(getTestUnitApiModel1()));
      const result = await firstValueFrom(
        service.fetchById(PROJECT_ID, TEST_UNIT_ID_1)
      );
      expect(result).toEqual(getTestUnit1());
    });

    it("should throw an error on failure to fetch the test unit", async () => {
      const errorMessage = "Test unit not found";
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      await expect(
        firstValueFrom(service.fetchById(PROJECT_ID, TEST_UNIT_ID_1))
      ).rejects.toThrow(errorMessage);
    });

    it("should sort scenario executions of a test unit by descending startDate and preserve head scenario execution", async () => {
      jest.spyOn(httpClient, "get").mockReturnValue(
        of(
          getTestUnitApiModel1({
            headScenarioExecutionId: SCENARIO_EXECUTION_ID_MID,
            scenarioExecutions: [
              buildScenarioExecutionApiModel(
                SCENARIO_EXECUTION_ID_OLD,
                START_DATE_EARLIEST
              ),
              buildScenarioExecutionApiModel(
                SCENARIO_EXECUTION_ID_NEW,
                START_DATE_LATEST
              ),
              buildScenarioExecutionApiModel(
                SCENARIO_EXECUTION_ID_MID,
                START_DATE_MIDDLE
              ),
            ],
          })
        )
      );

      const result = await lastValueFrom(
        service.fetchById(PROJECT_ID, TEST_UNIT_ID_1)
      );
      const orderedIds = result.scenarioExecutions.map((se) => se.id);
      expect(orderedIds).toEqual([
        SCENARIO_EXECUTION_ID_NEW,
        SCENARIO_EXECUTION_ID_MID,
        SCENARIO_EXECUTION_ID_OLD,
      ]);
      const orderedDates = result.scenarioExecutions.map((se) => se.startDate);
      expect(orderedDates).toEqual([
        START_DATE_LATEST,
        START_DATE_MIDDLE,
        START_DATE_EARLIEST,
      ]);
      expect(result.headScenarioExecution.id).toBe(SCENARIO_EXECUTION_ID_MID);
    });

    it("should default analysis objects arrays to empty when analysisObjects is undefined", async () => {
      jest.spyOn(httpClient, "get").mockReturnValue(
        of(
          getTestUnitApiModel1({
            headScenarioExecutionId: "noAO",
            scenarioExecutions: [
              buildScenarioExecutionApiModel("noAO", START_DATE_LATEST, {
                analysisObjects: undefined,
              }),
            ],
          })
        )
      );

      const result = await lastValueFrom(
        service.fetchById(PROJECT_ID, TEST_UNIT_ID_1)
      );
      const analysisObject = result.scenarioExecutions[0].analysisObjects;
      const emptyLists = {
        binaryImpacts: [],
        binaryRegressions: [],
        configurationImpacts: [],
        configurationRegressions: [],
        failureReasons: [],
        incidents: [],
      };
      expect(analysisObject).toEqual(emptyLists);
      expect(result.headScenarioExecution.analysisObjects).toEqual(emptyLists);
    });
  });

  function getTestUnitApiModel1(
    overrides?: Partial<TestUnitApiModel>
  ): TestUnitApiModel {
    return {
      id: TEST_UNIT_ID_1,
      headScenarioExecutionId: SCENARIO_EXECUTION_ID_1,
      scenarioExecutions: [
        getTestUnit1HeadScenarioExecutionApiModel(),
        getTestUnit1SecondScenarioExecutionApiModel(),
      ],
      repushable: false,
      scenarioDefinitionId: SCENARIO_DEFINITION_ID_TU1,
      scenarioDefinitionName: SCENARIO_DEFINITION_NAME_TU1,
      contextId: CONTEXT_ID_TU1,
      assignee: ASSIGNEE_TU1,
      branch: BRANCH_TU1,
      subContextId: SUB_CONTEXT_ID_TU1,
      disableKeepExecution: true,
      incidentEnabled: true,
      validationScopeEnabled: true,
      ...overrides,
    };
  }

  function getTestUnitApiModel2(
    overrides?: Partial<TestUnitApiModel>
  ): TestUnitApiModel {
    return {
      id: TEST_UNIT_ID_2,
      headScenarioExecutionId: SCENARIO_EXECUTION_ID_2,
      scenarioExecutions: [
        getTestUnit2HeadScenarioExecutionApiModel(),
        getTestUnit2SecondScenarioExecutionApiModel(),
      ],
      repushable: false,
      scenarioDefinitionId: SCENARIO_DEFINITION_ID_TU2,
      scenarioDefinitionName: SCENARIO_DEFINITION_NAME_TU2,
      contextId: CONTEXT_ID_TU2,
      assignee: ASSIGNEE_TU2,
      branch: BRANCH_TU2,
      subContextId: SUB_CONTEXT_ID_TU2,
      disableKeepExecution: false,

      incidentEnabled: false,
      validationScopeEnabled: false,
      ...overrides,
    };
  }

  function getTestUnit1(overrides?: Partial<TestUnitModel>): TestUnitModel {
    return {
      id: TEST_UNIT_ID_1,
      headScenarioExecution: getTestUnit1HeadScenarioExecution(),
      scenarioExecutions: [
        getTestUnit1HeadScenarioExecution(),
        getTestUnit1SecondScenarioExecution(),
      ],
      repushable: false,
      scenarioDefinitionId: SCENARIO_DEFINITION_ID_TU1,
      scenarioDefinitionName: SCENARIO_DEFINITION_NAME_TU1,
      contextId: CONTEXT_ID_TU1,
      assignee: ASSIGNEE_TU1,
      branch: BRANCH_TU1,
      subContextId: SUB_CONTEXT_ID_TU1,
      disableKeepExecution: true,

      incidentEnabled: true,
      validationScopeEnabled: true,
      ...overrides,
    };
  }

  function getTestUnit2(overrides?: Partial<TestUnitModel>): TestUnitModel {
    return {
      id: TEST_UNIT_ID_2,
      headScenarioExecution: getTestUnit2HeadScenarioExecution(),
      scenarioExecutions: [
        getTestUnit2HeadScenarioExecution(),
        getTestUnit2SecondScenarioExecution(),
      ],
      repushable: false,
      scenarioDefinitionId: SCENARIO_DEFINITION_ID_TU2,
      scenarioDefinitionName: SCENARIO_DEFINITION_NAME_TU2,
      contextId: CONTEXT_ID_TU2,
      assignee: ASSIGNEE_TU2,
      branch: BRANCH_TU2,
      subContextId: SUB_CONTEXT_ID_TU2,
      disableKeepExecution: false,

      incidentEnabled: false,
      validationScopeEnabled: false,
      ...overrides,
    };
  }

  function getTestUnit1SecondScenarioExecution(): TestUnitScenarioExecutionModel {
    return buildScenarioExecutionModel(
      SCENARIO_EXECUTION_ID_1B,
      START_DATE_SE1B
    );
  }

  function getTestUnit2SecondScenarioExecution(): TestUnitScenarioExecutionModel {
    return buildScenarioExecutionModel(
      SCENARIO_EXECUTION_ID_2B,
      START_DATE_SE2B
    );
  }

  function getTestUnit1SecondScenarioExecutionApiModel(): TestUnitScenarioExecutionApiModel {
    return buildScenarioExecutionApiModel(
      SCENARIO_EXECUTION_ID_1B,
      START_DATE_SE1B
    );
  }

  function getTestUnit2SecondScenarioExecutionApiModel(): TestUnitScenarioExecutionApiModel {
    return buildScenarioExecutionApiModel(
      SCENARIO_EXECUTION_ID_2B,
      START_DATE_SE2B
    );
  }

  function getTestUnit1HeadScenarioExecution(): TestUnitScenarioExecutionModel {
    return buildScenarioExecutionModel(SCENARIO_EXECUTION_ID_1, START_DATE_SE1);
  }

  function getTestUnit2HeadScenarioExecution(): TestUnitScenarioExecutionModel {
    return buildScenarioExecutionModel(SCENARIO_EXECUTION_ID_2, START_DATE_SE2);
  }

  function getTestUnit1HeadScenarioExecutionApiModel(): TestUnitScenarioExecutionApiModel {
    return buildScenarioExecutionApiModel(
      SCENARIO_EXECUTION_ID_1,
      START_DATE_SE1
    );
  }

  function getTestUnit2HeadScenarioExecutionApiModel(): TestUnitScenarioExecutionApiModel {
    return buildScenarioExecutionApiModel(
      SCENARIO_EXECUTION_ID_2,
      START_DATE_SE2
    );
  }

  function buildScenarioExecutionModel(
    id: string,
    startDate: string,
    overrides?: Partial<TestUnitScenarioExecutionModel>
  ): TestUnitScenarioExecutionModel {
    return {
      id,
      analysisObjects: buildAnalysisObjects(id),
      analysisStatus: STATUS_PASSED,
      status: STATUS_PASSED,
      startDate,
      endDate: undefined,
      commitId: COMMIT_ID,
      mxVersion: MX_VERSION,
      mxBuildId: MX_BUILD_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
      keptExecution: false,
      environment: { id: ENV_ID, status: ENV_STATUS_READY },
      cleaningStatus: CLEANING_STATUS,
      isFailed: true,
      isFinished: true,
      ...overrides,
    };
  }

  function buildScenarioExecutionApiModel(
    id: string,
    startDate: string,
    overrides?: Partial<TestUnitScenarioExecutionApiModel>
  ): TestUnitScenarioExecutionApiModel {
    return {
      scenarioExecutionId: id,
      analysisObjects: buildAnalysisObjects(id),
      analysisStatus: STATUS_PASSED,
      status: STATUS_PASSED,
      startDate,
      endDate: undefined,
      commitId: COMMIT_ID,
      mxVersion: MX_VERSION,
      mxBuildId: MX_BUILD_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
      keptExecution: false,
      failed: true,
      finished: true,
      environment: { environmentId: ENV_ID, status: ENV_STATUS_READY },
      cleaningStatus: CLEANING_STATUS,
      ...overrides,
    };
  }

  function buildTestUnitsUrl(projectId: string): string {
    return `${GATEWAY_URL}${PATH_PROJECTS}/${projectId}/${PATH_TEST_EXECUTION_MANAGER}/${PATH_TEST_UNITS}`;
  }

  function buildAnalysisObjects(id: string) {
    return {
      binaryImpacts: [`${id}-binary-impact`, `${id}-binary-impact2`],
      binaryRegressions: [
        `${id}-binary-regression`,
        `${id}-binary-regression2`,
      ],
      configurationImpacts: [
        `${id}-configuration-impact`,
        `${id}-configuration-impact`,
      ],
      configurationRegressions: [
        `${id}-configuration-regression`,
        `${id}-configuration-regression2`,
      ],
      failureReasons: [`${id}-failure-reason`, `${id}-failure-reason2`],
      incidents: [`${id}-incident`, `${id}-incident2`],
    };
  }
});
