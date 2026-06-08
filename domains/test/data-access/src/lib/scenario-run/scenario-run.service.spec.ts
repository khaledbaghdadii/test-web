import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { ScenarioRunService } from "./scenario-run.service";
import { firstValueFrom } from "rxjs";
import type { ScenarioRunApiResponse } from "../api-models/scenario-run-api-response";

const GATEWAY_URL = "https://api.test.com/";
const PROJECT_ID = "project-1";
const SCENARIO_RUN_ID = "scenario-run-1";
const EXECUTION_GROUP_ID = "execution-group-1";
const BASE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/test-execution-manager/scenario-executions`;
const REPUSH_URL = `${BASE_URL}/${SCENARIO_RUN_ID}/repush`;
const BULK_REPUSH_URL = `${BASE_URL}/repush/bulk`;
const EXECUTE_URL = `${BASE_URL}/execute`;
const CAN_PUSH_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/test-execution-manager/execution-group/${EXECUTION_GROUP_ID}/scenario-execution/can-push`;

const MOCK_API_RESPONSE: ScenarioRunApiResponse = {
  id: "run-1",
  name: "test-scenario",
  status: "Passed",
  analysisStatus: "Passed",
  startDate: "2025-06-01T10:00:00Z",
  endDate: "2025-06-01T11:00:00Z",
  commitId: "abc123",
  assignee: "Test User",
  mxVersion: "3.1.64",
  mxBuildId: "build-1",
  envInfo: { environmentId: "env-1", status: "READY" },
  detections: {
    binaryImpactIds: ["impact-1"],
    configurationImpactIds: [],
    binaryRegressionIds: ["regression-1"],
    configurationRegressionIds: [],
    failureReasonIds: [],
  },
  linkedIncidents: [
    {
      id: "incident-1",
      title: "Test incident",
      status: "Open",
      assignee: "user-1",
      reporter: "user-2",
      externalIssue: {
        id: "ext-1",
        origin: "jira",
        link: "https://jira.example.com/EXT-1",
      },
    },
  ],
};

describe("ScenarioRunService", () => {
  let service: ScenarioRunService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ScenarioRunService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ScenarioRunService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("fetch", () => {
    const CONTEXT_ID = "ctx-1";
    const SUB_CONTEXT_ID = "sub-ctx-1";
    const STATUSES = ["PASSED"];
    const MOCK_RESPONSE = [
      {
        id: "run-1",
        startDate: "2025-01-01T00:00:00Z",
        commitId: "abc123",
        mxVersion: "3.1.0",
        mxBuildId: "build-1",
      },
    ];

    it("sends a GET request to the base URL", () => {
      service
        .fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, STATUSES)
        .subscribe();

      const request = httpController.expectOne(
        (req) => req.url === BASE_URL && req.method === "GET"
      );
      expect(request.request.method).toBe("GET");
      request.flush([]);
    });

    it("passes contextId as a query param", () => {
      service
        .fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, STATUSES)
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("contextId")).toBe(CONTEXT_ID);
      request.flush([]);
    });

    it("passes subContextId as a query param", () => {
      service
        .fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, STATUSES)
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("subContextId")).toBe(SUB_CONTEXT_ID);
      request.flush([]);
    });

    it("passes statuses as a query param", () => {
      service
        .fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, STATUSES)
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("statuses")).toBe("PASSED");
      request.flush([]);
    });

    it("joins multiple statuses with commas", () => {
      service
        .fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, ["PASSED", "FAILED"])
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("statuses")).toBe("PASSED,FAILED");
      request.flush([]);
    });

    it("returns the API response array", async () => {
      const resultPromise = firstValueFrom(
        service.fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, STATUSES)
      );

      httpController
        .expectOne((req) => req.url === BASE_URL)
        .flush(MOCK_RESPONSE);

      expect(await resultPromise).toEqual(MOCK_RESPONSE);
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.fetch(PROJECT_ID, CONTEXT_ID, SUB_CONTEXT_ID, STATUSES)
      );

      httpController
        .expectOne((req) => req.url === BASE_URL)
        .flush("Internal server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow("Internal server error");
    });

    it("sends no query params when none are provided", () => {
      service.fetch(PROJECT_ID).subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.keys().length).toBe(0);
      request.flush([]);
    });
  });

  describe("abortScenarioRun", () => {
    it("posts to the abort endpoint", () => {
      service.abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID).subscribe();

      const request = httpController.expectOne(
        `${BASE_URL}/${SCENARIO_RUN_ID}/abort`
      );
      expect(request.request.method).toBe("POST");
      request.flush(null);
    });

    it("sends an empty body", () => {
      service.abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID).subscribe();

      const request = httpController.expectOne(
        `${BASE_URL}/${SCENARIO_RUN_ID}/abort`
      );
      expect(request.request.body).toEqual({});
      request.flush(null);
    });

    it("completes without emitting a value on success", async () => {
      const resultPromise = firstValueFrom(
        service.abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID)
      );

      httpController
        .expectOne(`${BASE_URL}/${SCENARIO_RUN_ID}/abort`)
        .flush(null);

      expect(await resultPromise).toBeUndefined();
    });

    it("throws an error when the server responds with 404", async () => {
      const resultPromise = firstValueFrom(
        service.abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID)
      );

      httpController
        .expectOne(`${BASE_URL}/${SCENARIO_RUN_ID}/abort`)
        .flush("Not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow("Not found");
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.abortScenarioRun(PROJECT_ID, SCENARIO_RUN_ID)
      );

      httpController
        .expectOne(`${BASE_URL}/${SCENARIO_RUN_ID}/abort`)
        .flush("Internal server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow("Internal server error");
    });
  });

  describe("fetchById", () => {
    it("fetches a scenario run by id", async () => {
      const resultPromise = firstValueFrom(
        service.fetchById(PROJECT_ID, SCENARIO_RUN_ID)
      );

      httpController
        .expectOne(`${BASE_URL}/${SCENARIO_RUN_ID}`)
        .flush(MOCK_API_RESPONSE);

      expect(await resultPromise).toEqual(MOCK_API_RESPONSE);
    });
  });

  describe("runScenario", () => {
    it("posts the legacy scenario execution request body", async () => {
      const resultPromise = firstValueFrom(
        service.runScenario(PROJECT_ID, {
          scenarioDefinitionId: "scenario-definition-1",
          subContextId: "BUILD_AND_TEST",
          branchName: "feature/temp-branch",
          commitId: null,
          executionGroupId: EXECUTION_GROUP_ID,
          machineGroupId: "infra-group-1",
          disableKeepExecution: true,
          stopServices: true,
          disableConfigurationEditor: false,
          supportReconActivities: false,
          validationScopeEnabled: false,
          incidentEnabled: false,
          qualityLevel: "MQG",
        })
      );

      const request = httpController.expectOne(EXECUTE_URL);
      expect(request.request.method).toBe("POST");
      expect(request.request.body).toEqual({
        scenarioDefinitionId: "scenario-definition-1",
        subContextId: "BUILD_AND_TEST",
        branchName: "feature/temp-branch",
        fullMaintenance: false,
        executionGroupId: EXECUTION_GROUP_ID,
        machineGroupId: "infra-group-1",
        disableKeepExecution: true,
        disableConfigurationEditor: false,
        supportReconActivities: false,
        stopServices: true,
        validationScopeEnabled: false,
        incidentEnabled: false,
        qualityLevel: "MQG",
      });
      request.flush({ testExecutionId: "test-execution-1" });

      expect(await resultPromise).toEqual({
        testExecutionId: "test-execution-1",
      });
    });
  });

  describe("isExecutionAllowed", () => {
    it("checks whether the execution group can push a scenario run", async () => {
      const resultPromise = firstValueFrom(
        service.isExecutionAllowed(PROJECT_ID, EXECUTION_GROUP_ID)
      );

      const request = httpController.expectOne(CAN_PUSH_URL);
      expect(request.request.method).toBe("GET");
      request.flush({
        actionAllowed: true,
        rejectionReasons: [],
        warnings: [],
      });

      expect(await resultPromise).toEqual({
        actionAllowed: true,
        rejectionReasons: [],
        warnings: [],
      });
    });
  });

  describe("rerunScenarioFromFactoryProduct", () => {
    const BASE_REQUEST = {
      factoryProductId: "fp-123",
    };

    it("posts to the repush endpoint", () => {
      service
        .rerunScenarioFromFactoryProduct(
          PROJECT_ID,
          SCENARIO_RUN_ID,
          BASE_REQUEST
        )
        .subscribe();

      const request = httpController.expectOne(REPUSH_URL);
      expect(request.request.method).toBe("POST");
      request.flush({ testExecutionId: "exec-1" });
    });

    it("sends the factory product ID in the body", () => {
      service
        .rerunScenarioFromFactoryProduct(
          PROJECT_ID,
          SCENARIO_RUN_ID,
          BASE_REQUEST
        )
        .subscribe();

      const request = httpController.expectOne(REPUSH_URL);
      expect(request.request.body.factoryProductId).toBe("fp-123");
      request.flush({ testExecutionId: "exec-1" });
    });

    it("trims whitespace from factoryProductId", () => {
      service
        .rerunScenarioFromFactoryProduct(PROJECT_ID, SCENARIO_RUN_ID, {
          factoryProductId: "  fp-123  ",
        })
        .subscribe();

      const request = httpController.expectOne(REPUSH_URL);
      expect(request.request.body.factoryProductId).toBe("fp-123");
      request.flush({ testExecutionId: "exec-1" });
    });

    it("trims whitespace from commitId", () => {
      service
        .rerunScenarioFromFactoryProduct(PROJECT_ID, SCENARIO_RUN_ID, {
          ...BASE_REQUEST,
          commitId: "  abc123  ",
        })
        .subscribe();

      const request = httpController.expectOne(REPUSH_URL);
      expect(request.request.body.commitId).toBe("abc123");
      request.flush({ testExecutionId: "exec-1" });
    });

    it("sends undefined commitId when commitId is empty after trimming", () => {
      service
        .rerunScenarioFromFactoryProduct(PROJECT_ID, SCENARIO_RUN_ID, {
          ...BASE_REQUEST,
          commitId: "   ",
        })
        .subscribe();

      const request = httpController.expectOne(REPUSH_URL);
      expect(request.request.body.commitId).toBeUndefined();
      request.flush({ testExecutionId: "exec-1" });
    });

    it("includes optional fields when provided", () => {
      service
        .rerunScenarioFromFactoryProduct(PROJECT_ID, SCENARIO_RUN_ID, {
          ...BASE_REQUEST,
          executionGroupId: "group-1",
          stopServices: true,
        })
        .subscribe();

      const request = httpController.expectOne(REPUSH_URL);
      expect(request.request.body.executionGroupId).toBe("group-1");
      expect(request.request.body.stopServices).toBe(true);
      request.flush({ testExecutionId: "exec-1" });
    });

    it("returns the test execution ID on success", async () => {
      const resultPromise = firstValueFrom(
        service.rerunScenarioFromFactoryProduct(
          PROJECT_ID,
          SCENARIO_RUN_ID,
          BASE_REQUEST
        )
      );

      httpController.expectOne(REPUSH_URL).flush({ testExecutionId: "exec-1" });

      expect(await resultPromise).toEqual({ testExecutionId: "exec-1" });
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.rerunScenarioFromFactoryProduct(
          PROJECT_ID,
          SCENARIO_RUN_ID,
          BASE_REQUEST
        )
      );

      httpController.expectOne(REPUSH_URL).flush("Internal server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(resultPromise).rejects.toThrow("Internal server error");
    });

    it("throws an error when the server responds with 404", async () => {
      const resultPromise = firstValueFrom(
        service.rerunScenarioFromFactoryProduct(
          PROJECT_ID,
          SCENARIO_RUN_ID,
          BASE_REQUEST
        )
      );

      httpController
        .expectOne(REPUSH_URL)
        .flush("Not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow("Not found");
    });
  });

  describe("updateAssignee", () => {
    const ASSIGNEE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/test-execution-manager/scenario-executions/assignee`;
    const BASE_ASSIGNEE_REQUEST = {
      assignee: "user-1",
      scenarioDefinitionId: "sd-1",
      contextId: "ctx-1",
    };

    it("sends a PUT request to the assignee endpoint", () => {
      service.updateAssignee(PROJECT_ID, BASE_ASSIGNEE_REQUEST).subscribe();

      const request = httpController.expectOne(ASSIGNEE_URL);
      expect(request.request.method).toBe("PUT");
      request.flush(null);
    });

    it("sends the assignee in the request body", () => {
      service.updateAssignee(PROJECT_ID, BASE_ASSIGNEE_REQUEST).subscribe();

      const request = httpController.expectOne(ASSIGNEE_URL);
      expect(request.request.body.assignee).toBe("user-1");
      request.flush(null);
    });

    it("sends scenarioDefinitionId and contextId in the body", () => {
      service.updateAssignee(PROJECT_ID, BASE_ASSIGNEE_REQUEST).subscribe();

      const request = httpController.expectOne(ASSIGNEE_URL);
      expect(request.request.body.scenarioDefinitionId).toBe("sd-1");
      expect(request.request.body.contextId).toBe("ctx-1");
      request.flush(null);
    });

    it("sends null assignee when clearing the assignment", () => {
      service
        .updateAssignee(PROJECT_ID, {
          ...BASE_ASSIGNEE_REQUEST,
          assignee: null,
        })
        .subscribe();

      const request = httpController.expectOne(ASSIGNEE_URL);
      expect(request.request.body.assignee).toBeNull();
      request.flush(null);
    });

    it("includes subContextId when provided", () => {
      service
        .updateAssignee(PROJECT_ID, {
          ...BASE_ASSIGNEE_REQUEST,
          subContextId: "sub-ctx-1",
        })
        .subscribe();

      const request = httpController.expectOne(ASSIGNEE_URL);
      expect(request.request.body.subContextId).toBe("sub-ctx-1");
      request.flush(null);
    });

    it("completes without emitting a value on success", async () => {
      const resultPromise = firstValueFrom(
        service.updateAssignee(PROJECT_ID, BASE_ASSIGNEE_REQUEST)
      );

      httpController.expectOne(ASSIGNEE_URL).flush(null);

      expect(await resultPromise).toBeUndefined();
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.updateAssignee(PROJECT_ID, BASE_ASSIGNEE_REQUEST)
      );

      httpController.expectOne(ASSIGNEE_URL).flush("Internal server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(resultPromise).rejects.toThrow("Internal server error");
    });

    it("throws an error when the server responds with 404", async () => {
      const resultPromise = firstValueFrom(
        service.updateAssignee(PROJECT_ID, BASE_ASSIGNEE_REQUEST)
      );

      httpController
        .expectOne(ASSIGNEE_URL)
        .flush("Not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow("Not found");
    });
  });

  describe("fetch with scenarioRunIds", () => {
    it("passes scenarioExecutionIds as a query param", () => {
      service
        .fetch(PROJECT_ID, undefined, undefined, undefined, ["run-1", "run-2"])
        .subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.get("scenarioExecutionIds")).toBe(
        "run-1,run-2"
      );
      request.flush([]);
    });

    it("returns the api response", async () => {
      const resultPromise = firstValueFrom(
        service.fetch(PROJECT_ID, undefined, undefined, undefined, ["run-1"])
      );

      httpController
        .expectOne((req) => req.url === BASE_URL)
        .flush([MOCK_API_RESPONSE]);

      const result = await resultPromise;
      expect(result).toEqual([MOCK_API_RESPONSE]);
    });

    it("returns an empty array when the server responds with no data", async () => {
      const resultPromise = firstValueFrom(
        service.fetch(PROJECT_ID, undefined, undefined, undefined, [
          "run-1",
          "run-2",
        ])
      );

      httpController.expectOne((req) => req.url === BASE_URL).flush([]);

      const result = await resultPromise;
      expect(result).toEqual([]);
    });

    it("does not send scenarioExecutionIds when not provided", () => {
      service.fetch(PROJECT_ID, "ctx-1").subscribe();

      const request = httpController.expectOne((req) => req.url === BASE_URL);
      expect(request.request.params.has("scenarioExecutionIds")).toBe(false);
      request.flush([]);
    });
  });

  describe("bulkRerun", () => {
    const BASE_BULK_REQUEST = {
      factoryProductId: "fp-123",
      scenariosToBeRepushed: ["run-1", "run-2"],
    };

    const MOCK_BULK_RESPONSE = {
      successfulRepushes: [
        {
          originalScenarioExecutionId: "run-1",
          repushedScenarioExecutionId: "new-run-1",
        },
      ],
      failedRepushes: ["run-2"],
    };

    it("posts to the bulk repush endpoint", () => {
      service.bulkRerun(PROJECT_ID, BASE_BULK_REQUEST).subscribe();

      const request = httpController.expectOne(BULK_REPUSH_URL);
      expect(request.request.method).toBe("POST");
      request.flush(MOCK_BULK_RESPONSE);
    });

    it("maps scenariosToBeRepushed to testScenarioExecutions in the body", () => {
      service.bulkRerun(PROJECT_ID, BASE_BULK_REQUEST).subscribe();

      const request = httpController.expectOne(BULK_REPUSH_URL);
      expect(request.request.body.testScenarioExecutions).toEqual([
        "run-1",
        "run-2",
      ]);
      request.flush(MOCK_BULK_RESPONSE);
    });

    it("sends the factory product ID in the body", () => {
      service.bulkRerun(PROJECT_ID, BASE_BULK_REQUEST).subscribe();

      const request = httpController.expectOne(BULK_REPUSH_URL);
      expect(request.request.body.factoryProductId).toBe("fp-123");
      request.flush(MOCK_BULK_RESPONSE);
    });

    it("trims whitespace from factoryProductId", () => {
      service
        .bulkRerun(PROJECT_ID, {
          ...BASE_BULK_REQUEST,
          factoryProductId: "  fp-123  ",
        })
        .subscribe();

      const request = httpController.expectOne(BULK_REPUSH_URL);
      expect(request.request.body.factoryProductId).toBe("fp-123");
      request.flush(MOCK_BULK_RESPONSE);
    });

    it("trims whitespace from commitId", () => {
      service
        .bulkRerun(PROJECT_ID, {
          ...BASE_BULK_REQUEST,
          commitId: "  abc123  ",
        })
        .subscribe();

      const request = httpController.expectOne(BULK_REPUSH_URL);
      expect(request.request.body.commitId).toBe("abc123");
      request.flush(MOCK_BULK_RESPONSE);
    });

    it("sends undefined commitId when commitId is empty after trimming", () => {
      service
        .bulkRerun(PROJECT_ID, {
          ...BASE_BULK_REQUEST,
          commitId: "   ",
        })
        .subscribe();

      const request = httpController.expectOne(BULK_REPUSH_URL);
      expect(request.request.body.commitId).toBeUndefined();
      request.flush(MOCK_BULK_RESPONSE);
    });

    it("returns the bulk rerun response on success", async () => {
      const resultPromise = firstValueFrom(
        service.bulkRerun(PROJECT_ID, BASE_BULK_REQUEST)
      );

      httpController.expectOne(BULK_REPUSH_URL).flush(MOCK_BULK_RESPONSE);

      expect(await resultPromise).toEqual(MOCK_BULK_RESPONSE);
    });

    it("throws an error when the server responds with 500", async () => {
      const resultPromise = firstValueFrom(
        service.bulkRerun(PROJECT_ID, BASE_BULK_REQUEST)
      );

      httpController.expectOne(BULK_REPUSH_URL).flush("Internal server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(resultPromise).rejects.toThrow("Internal server error");
    });

    it("throws an error when the server responds with 404", async () => {
      const resultPromise = firstValueFrom(
        service.bulkRerun(PROJECT_ID, BASE_BULK_REQUEST)
      );

      httpController
        .expectOne(BULK_REPUSH_URL)
        .flush("Not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow("Not found");
    });
  });
});
