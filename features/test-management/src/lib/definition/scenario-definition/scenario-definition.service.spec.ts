import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  EnvironmentDefinitionStatus,
  EnvironmentService,
} from "@mxflow/features/environment";
import { StreamsService } from "@mxflow/features/streams";

import { lastValueFrom, of, throwError } from "rxjs";
import { ScenarioDefinitionService } from "./scenario-definition.service";
import { ScenarioDefinitionApiResponse } from "./response/scenario-definition-api-response.model";
import {
  Heaviness,
  ScenarioDefinition,
  ActivityStatus,
} from "./scenario-definition";
import { TestBed } from "@angular/core/testing";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition } from "@mxevolve/domains/test/model";

const scenarioDefinitionId = "scenarioDefinitionId";
const projectId = "projectId";

describe("Service: TestScenarios", () => {
  let scenariosService: ScenarioDefinitionService;
  let testDefinitionService: TestDefinitionService;
  let streamService: StreamsService;
  let environmentService: EnvironmentService;
  let httpClient: HttpClient;

  const appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  beforeEach(() => {
    environmentService = {
      getEnvironmentDefinitions: jest.fn(() =>
        of([
          {
            id: "env_id",
            name: "env_name",
            status: EnvironmentDefinitionStatus.ACTIVE,
          },
        ])
      ),
      getEnvironmentDefinitionById: jest.fn(() =>
        of({
          id: "env_id",
          name: "env_name",
          status: EnvironmentDefinitionStatus.ACTIVE,
        })
      ),
    } as unknown as EnvironmentService;

    streamService = {
      getListOfBpcsByProjectId: jest.fn(() =>
        of([{ id: "bpc_id", name: "bpc" }])
      ),
    } as unknown as StreamsService;

    testDefinitionService = {
      fetch: jest.fn(),
      fetchAll: jest.fn(() => of(TestScenarioTestHelper.getTestDefinitions())),
    } as unknown as TestDefinitionService;

    httpClient = {
      post: jest.fn(() => of({ id: scenarioDefinitionId })),
      get: jest.fn(() =>
        of(TestScenarioTestHelper.getScenarioDefinitionApiResponse())
      ),
      put: jest.fn(() => of({ id: scenarioDefinitionId })),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [
        ScenarioDefinitionService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: StreamsService, useValue: streamService },
        { provide: EnvironmentService, useValue: environmentService },
      ],
    });

    scenariosService = TestBed.inject(ScenarioDefinitionService);
  });
  describe("getScenarioDefinitionById", () => {
    it("should fetch the scenario definition", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          of(TestScenarioTestHelper.getScenarioDefinitionApiResponse())
        );

      scenariosService.getScenarioDefinitionById(
        scenarioDefinitionId,
        projectId
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          "projects/projectId/test-scenario/" +
          scenarioDefinitionId
      );
    });

    it("should fetch the scenario definition with no tests and return it correctly", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          of(
            TestScenarioTestHelper.getScenarioDefinitionApiResponseWithNoTests()
          )
        );

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).resolves.toStrictEqual(
        TestScenarioTestHelper.getScenarioDefinitionWithNoTest()
      );
    });

    it("should throw an error on failure to fetch scenario definition", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).rejects.toThrow("failed");
    });

    it("should fetch test definitions of a scenario definition", async () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValueOnce(of(TestScenarioTestHelper.getTestDefinitions()[0]))
        .mockReturnValueOnce(
          of(TestScenarioTestHelper.getTestDefinitions()[1])
        );

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).resolves.toBeDefined();

      expect(testDefinitionService.fetchAll).toHaveBeenCalledTimes(1);
      expect(testDefinitionService.fetchAll).toHaveBeenCalledWith(projectId, [
        "testDefinitionId1",
        "testDefinitionId2",
      ]);
    });

    it("should throw an error on failure to fetch a test definition", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(testDefinitionService, "fetchAll")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).rejects.toThrow("failed");
    });

    it("should fetch all bpcs of a project", async () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValueOnce(of(TestScenarioTestHelper.getTestDefinitions()[0]))
        .mockReturnValueOnce(
          of(TestScenarioTestHelper.getTestDefinitions()[1])
        );

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).resolves.toBeDefined();

      expect(streamService.getListOfBpcsByProjectId).toHaveBeenCalledWith(
        projectId
      );
    });

    it("should throw an error on failure to fetch bpcs of a project", async () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValueOnce(of(TestScenarioTestHelper.getTestDefinitions()[0]))
        .mockReturnValueOnce(
          of(TestScenarioTestHelper.getTestDefinitions()[1])
        );

      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(streamService, "getListOfBpcsByProjectId")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).rejects.toThrow("failed");
    });

    it("should fetch environment definition", async () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValueOnce(of(TestScenarioTestHelper.getTestDefinitions()[0]))
        .mockReturnValueOnce(
          of(TestScenarioTestHelper.getTestDefinitions()[1])
        );

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).resolves.toBeDefined();

      expect(
        environmentService.getEnvironmentDefinitionById
      ).toHaveBeenCalledWith(projectId, "env_id");
    });

    it("should throw an error on failure to fetch an env definition", async () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValueOnce(of(TestScenarioTestHelper.getTestDefinitions()[0]))
        .mockReturnValueOnce(
          of(TestScenarioTestHelper.getTestDefinitions()[1])
        );

      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(environmentService, "getEnvironmentDefinitionById")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).rejects.toThrow("failed");
    });

    it("should return the aggregated scenario definition data", async () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValueOnce(of(TestScenarioTestHelper.getTestDefinitions()[0]))
        .mockReturnValueOnce(
          of(TestScenarioTestHelper.getTestDefinitions()[1])
        );

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionById(
            scenarioDefinitionId,
            projectId
          )
        )
      ).resolves.toStrictEqual(TestScenarioTestHelper.getScenarioDefinition());
    });
  });

  describe("getScenarioDefinitions", () => {
    beforeEach(() => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          of(TestScenarioTestHelper.getScenarioDefinitionsApiResponse())
        );
    });

    it("should fetch scenario definitions of a project", () => {
      scenariosService.getScenarioDefinitions(projectId).subscribe(() => {
        expect(httpClient.get).toHaveBeenCalledWith(
          appConfig.gatewayUrl + "projects/projectId/test-scenario",
          { params: new HttpParams().set("status", "ACTIVE") }
        );
      });
    });

    it("should fetch active scenario definitions by default", async () => {
      await lastValueFrom(scenariosService.getScenarioDefinitions(projectId));

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl + "projects/projectId/test-scenario",
        { params: new HttpParams().set("status", "ACTIVE") }
      );
    });

    it.each([
      [ActivityStatus.ALL, "ALL"],
      [ActivityStatus.ACTIVE, "ACTIVE"],
      [ActivityStatus.INACTIVE, "INACTIVE"],
    ])(
      "should use the scenario status filter when defined - %s",
      async (status, expectedStatus) => {
        await lastValueFrom(
          scenariosService.getScenarioDefinitions(projectId, status)
        );

        expect(httpClient.get).toHaveBeenCalledWith(
          appConfig.gatewayUrl + "projects/projectId/test-scenario",
          { params: new HttpParams().set("status", expectedStatus) }
        );
      }
    );

    it("should throw an error on failure to fetch the scenario definitions of a project", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).rejects.toThrow("failed");
    });

    it("should fetch test definitions of a project", async () => {
      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).resolves.toBeDefined();

      expect(testDefinitionService.fetchAll).toHaveBeenCalledWith(projectId);
    });

    it("should throw an error on failure to fetch the test definitions of a project", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(testDefinitionService, "fetchAll")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).rejects.toThrow("failed");
    });

    it("should fetch environment definitions of a project", async () => {
      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).resolves.toBeDefined();

      expect(environmentService.getEnvironmentDefinitions).toHaveBeenCalledWith(
        projectId,
        true
      );
    });

    it("should throw an error on failure to fetch the scenario definitions of a project due to a fetch environment failure", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(environmentService, "getEnvironmentDefinitions")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).rejects.toThrow("failed");
    });

    it("should fetch bpc of a project", async () => {
      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).resolves.toBeDefined();
      expect(streamService.getListOfBpcsByProjectId).toHaveBeenCalledWith(
        projectId
      );
    });

    it("should throw an error on failure to bpcs of a project", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest
        .spyOn(streamService, "getListOfBpcsByProjectId")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).rejects.toThrow("failed");
    });

    it("should return the aggregated scenario definitions data", async () => {
      await expect(
        lastValueFrom(scenariosService.getScenarioDefinitions(projectId))
      ).resolves.toStrictEqual(TestScenarioTestHelper.getScenarioDefinitions());
    });
  });

  describe("getScenarioDefinitionLite", () => {
    it("given that a scenario definition id is provided, then the system should fetch the corresponding scenario definition", async () => {
      const apiResponse =
        TestScenarioTestHelper.getScenarioDefinitionApiResponse();
      jest.spyOn(httpClient, "get").mockReturnValue(of(apiResponse));

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionLite(
            scenarioDefinitionId,
            projectId
          )
        )
      ).resolves.toStrictEqual(apiResponse);

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          "projects/projectId/test-scenario/" +
          scenarioDefinitionId
      );
    });

    it("given that the http call to fetch the scenario fails, then an error is thrown", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 404,
        error: "not found",
      });
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(
          scenariosService.getScenarioDefinitionLite(
            scenarioDefinitionId,
            projectId
          )
        )
      ).rejects.toThrow("not found");
    });
  });
  describe("fetch cross project scenario definition", () => {
    it("should fetch scenario definitions", async () => {
      const liteScenarioDefinitions = [
        { id: "id1", name: "Scenario 1" },
        { id: "id2", name: "Scenario 2" },
      ];
      const request = {
        ids: ["id1", "id2"],
        scenarioDefinitionNamePhrases: ["scenario 1", "scenario 2"],
        status: ActivityStatus.ACTIVE,
      };
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of(liteScenarioDefinitions));

      await expect(
        lastValueFrom(
          scenariosService.fetchCrossProjectScenarioDefinition(request)
        )
      ).resolves.toStrictEqual(liteScenarioDefinitions);

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl + "test-definition/scenario-definitions",
        { params: new HttpParams({ fromObject: { ...request } }) }
      );
    });

    it.each([
      [ActivityStatus.ALL, "ALL"],
      [ActivityStatus.ACTIVE, "ACTIVE"],
      [ActivityStatus.INACTIVE, "INACTIVE"],
    ])(
      "should use the scenario status filter when defined - %s",
      async (status) => {
        const liteScenarioDefinitions = [
          { id: "id1", name: "Scenario 1" },
          { id: "id2", name: "Scenario 2" },
        ];

        jest
          .spyOn(httpClient, "get")
          .mockReturnValue(of(liteScenarioDefinitions));

        const request = {
          ids: ["id1", "id2"],
          status,
          scenarioDefinitionNamePhrases: ["scenario 1", "scenario 2"],
        };

        await expect(
          lastValueFrom(
            scenariosService.fetchCrossProjectScenarioDefinition(request)
          )
        ).resolves.toStrictEqual(liteScenarioDefinitions);

        expect(httpClient.get).toHaveBeenCalledWith(
          appConfig.gatewayUrl + "test-definition/scenario-definitions",
          { params: new HttpParams({ fromObject: { ...request } }) }
        );
      }
    );

    it("should throw an error on failure to fetch lite scenario definitions", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      const request = { ids: ["id1", "id2"] };
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(
          scenariosService.fetchCrossProjectScenarioDefinition(request)
        )
      ).rejects.toThrow("failed");
    });
  });
});

class TestScenarioTestHelper {
  static getScenarioDefinition(): ScenarioDefinition {
    return {
      id: "response1",
      name: "scenario1",
      active: true,
      bpcs: [{ id: "bpc_id", name: "bpc" }],
      environmentDefinition: {
        id: "env_id",
        name: "env_name",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
      heaviness: Heaviness.HEAVY,
      idempotent: false,
      nonFunctionalTest: false,
      archived: false,
      tests: [
        {
          full: false,
          testSelections: [
            {
              id: "testSelection1_1",
              name: "test selection 11",
              path: "/p",
              tags: ["tag1"],
            },
            {
              id: "testSelection1_2",
              name: "test selection 12",
              path: "/p",
              tags: ["tag1"],
            },
          ],
          testDefinition: {
            description: "description",
            id: "testDefinitionId1",
            name: "test package 1",
            path: "2r",
            projectId: "projectId",
            repoId: "1aw",
            timeoutDuration: {
              days: 0,
              hours: 1,
              minutes: 0,
            },
            testSelections: [
              {
                id: "testSelection1_1",
                name: "test selection 11",
                path: "/p",
                tags: ["tag1"],
              },
              {
                id: "testSelection1_2",
                name: "test selection 12",
                path: "/p",
                tags: ["tag1"],
              },
            ],
          },
        },
        {
          full: false,
          testSelections: [
            {
              id: "testSelection2_1",
              name: "test selection 21",
              path: "/p",
              tags: ["tag1"],
            },
            {
              id: "testSelection2_2",
              name: "test selection 22",
              path: "/p",
              tags: ["tag1"],
            },
          ],
          testDefinition: {
            description: "description",
            id: "testDefinitionId2",
            name: "test package 2",
            path: "2r",
            projectId: "projectId",
            repoId: "1aw",
            timeoutDuration: {
              days: 0,
              hours: 1,
              minutes: 0,
            },
            testSelections: [
              {
                id: "testSelection2_1",
                name: "test selection 21",
                path: "/p",
                tags: ["tag1"],
              },
              {
                id: "testSelection2_2",
                name: "test selection 22",
                path: "/p",
                tags: ["tag1"],
              },
            ],
          },
        },
      ],
    };
  }

  static getScenarioDefinitionWithNoTest(): ScenarioDefinition {
    return {
      id: "response1",
      name: "scenario1",
      active: true,
      bpcs: [{ id: "bpc_id", name: "bpc" }],
      environmentDefinition: {
        id: "env_id",
        name: "env_name",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
      heaviness: Heaviness.HEAVY,
      idempotent: false,
      nonFunctionalTest: false,
      archived: false,
      tests: [],
    };
  }

  static getScenarioDefinitions(): ScenarioDefinition[] {
    return [
      this.getScenarioDefinition(),
      { ...this.getScenarioDefinition(), id: "response2", name: "scenario2" },
    ];
  }

  static getScenarioDefinitionApiResponse(): ScenarioDefinitionApiResponse {
    return {
      id: "response1",
      name: "scenario1",
      active: true,
      bpcs: ["bpc_id"],
      heaviness: "HEAVY",
      environmentDefinitionId: "env_id",
      idempotent: false,
      nonFunctionalTest: false,
      archived: false,
      projectId: "projectId",
      tests: [
        {
          testDefinitionId: "testDefinitionId1",
          full: true,
          testSelectionIds: ["testSelection1_1", "testSelection1_2"],
        },
        {
          testDefinitionId: "testDefinitionId2",
          full: true,
          testSelectionIds: ["testSelection2_1", "testSelection2_2"],
        },
      ],
    };
  }

  static getScenarioDefinitionApiResponseWithNoTests(): ScenarioDefinitionApiResponse {
    return {
      id: "response1",
      name: "scenario1",
      active: true,
      bpcs: ["bpc_id"],
      heaviness: "HEAVY",
      environmentDefinitionId: "env_id",
      idempotent: false,
      nonFunctionalTest: false,
      archived: false,
      projectId: "projectId",
      tests: [],
    };
  }

  static getScenarioDefinitionsApiResponse(): ScenarioDefinitionApiResponse[] {
    return [
      this.getScenarioDefinitionApiResponse(),
      {
        ...this.getScenarioDefinitionApiResponse(),
        id: "response2",
        name: "scenario2",
      },
    ];
  }

  static getTestDefinitions(): TestDefinition[] {
    return [
      {
        id: "testDefinitionId1",
        name: "test package 1",
        projectId: "projectId",
        repoId: "1aw",
        path: "2r",
        timeoutDuration: {
          days: 0,
          hours: 1,
          minutes: 0,
        },
        testSelections: [
          {
            id: "testSelection1_1",
            name: "test selection 11",
            path: "/p",
            tags: ["tag1"],
          },
          {
            id: "testSelection1_2",
            name: "test selection 12",
            path: "/p",
            tags: ["tag1"],
          },
        ],
        description: "description",
      },
      {
        id: "testDefinitionId2",
        name: "test package 2",
        projectId: "projectId",
        repoId: "1aw",
        path: "2r",
        timeoutDuration: {
          days: 0,
          hours: 1,
          minutes: 0,
        },
        testSelections: [
          {
            id: "testSelection2_1",
            name: "test selection 21",
            path: "/p",
            tags: ["tag1"],
          },
          {
            id: "testSelection2_2",
            name: "test selection 22",
            path: "/p",
            tags: ["tag1"],
          },
        ],
        description: "description",
      },
    ];
  }
}
