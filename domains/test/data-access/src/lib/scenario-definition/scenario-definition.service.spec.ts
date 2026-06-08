import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { ScenarioDefinitionService } from "./scenario-definition.service";
import { TestDefinitionService } from "../test-definition/test-definition.service";
import { firstValueFrom, of } from "rxjs";
import { ScenarioDefinitionActivityStatus } from "@mxevolve/domains/test/model";

const GATEWAY_URL = "https://api.test.com/";

describe("ScenarioDefinitionService", () => {
  let service: ScenarioDefinitionService;
  let httpController: HttpTestingController;
  let mockTestDefinitionService: jest.Mocked<TestDefinitionService>;

  beforeEach(() => {
    mockTestDefinitionService = {
      fetchAll: jest.fn(),
    } as unknown as jest.Mocked<TestDefinitionService>;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ScenarioDefinitionService,
        { provide: TestDefinitionService, useValue: mockTestDefinitionService },
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ScenarioDefinitionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("createScenarioDefinition", () => {
    it("posts the request to the correct endpoint", async () => {
      const request = {
        name: "scenario",
        tests: [],
        idempotent: true,
        nonFunctionalTest: false,
        bpcs: [],
        environmentDefinitionId: "env-1",
        heaviness: "LIGHT",
        qualityLevel: "MQG",
      };

      const resultPromise = firstValueFrom(
        service.createScenarioDefinition("project-1", request)
      );

      const req = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/test-scenario`
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(request);
      req.flush({ id: "new-id" });

      await expect(resultPromise).resolves.toBe("new-id");
    });

    it("returns the created scenario definition id", async () => {
      const resultPromise = firstValueFrom(
        service.createScenarioDefinition("project-1", {
          name: "scenario",
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          bpcs: [],
          environmentDefinitionId: "env-1",
          heaviness: "NA",
          qualityLevel: "MQG",
        })
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario`)
        .flush({ id: "created-id" });

      expect(await resultPromise).toBe("created-id");
    });

    it("fails when the server rejects the request", async () => {
      const resultPromise = firstValueFrom(
        service.createScenarioDefinition("project-1", {
          name: "scenario",
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          bpcs: [],
          environmentDefinitionId: "env-1",
          heaviness: "NA",
          qualityLevel: "MQG",
        })
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario`)
        .flush("creation failed", { status: 400, statusText: "Bad Request" });

      await expect(resultPromise).rejects.toThrow("creation failed");
    });
  });

  describe("editScenarioDefinition", () => {
    it("sends a PUT request to the correct endpoint", async () => {
      const request = {
        name: "updated scenario",
        tests: [],
        idempotent: true,
        nonFunctionalTest: true,
        bpcs: ["bpc-1"],
        environmentDefinitionId: "env-2",
        heaviness: "HEAVY",
        qualityLevel: "MQG",
      };

      const resultPromise = firstValueFrom(
        service.editScenarioDefinition("project-1", request, "scenario-1")
      );

      const req = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/test-scenario/scenario-1`
      );
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual(request);
      req.flush({ id: "scenario-1" });

      await expect(resultPromise).resolves.toBe("scenario-1");
    });

    it("returns the updated scenario definition id", async () => {
      const resultPromise = firstValueFrom(
        service.editScenarioDefinition(
          "project-1",
          {
            name: "updated",
            tests: [],
            idempotent: false,
            nonFunctionalTest: false,
            bpcs: [],
            environmentDefinitionId: "env-1",
            heaviness: "NA",
            qualityLevel: "MQG",
          },
          "scenario-1"
        )
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario/scenario-1`)
        .flush({ id: "scenario-1" });

      expect(await resultPromise).toBe("scenario-1");
    });

    it("fails when the server rejects the update", async () => {
      const resultPromise = firstValueFrom(
        service.editScenarioDefinition(
          "project-1",
          {
            name: "updated",
            tests: [],
            idempotent: false,
            nonFunctionalTest: false,
            bpcs: [],
            environmentDefinitionId: "env-1",
            heaviness: "NA",
            qualityLevel: "MQG",
          },
          "scenario-1"
        )
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario/scenario-1`)
        .flush("update failed", { status: 400, statusText: "Bad Request" });

      await expect(resultPromise).rejects.toThrow("update failed");
    });
  });

  describe("getTestDefinitions", () => {
    it("delegates to TestDefinitionService", async () => {
      const expectedDefinitions = [
        {
          id: "td-1",
          name: "Test Def 1",
          projectId: "p1",
          repoId: "r1",
          path: "/path",
          description: "desc",
          timeoutDuration: { days: 0, hours: 1, minutes: 0 },
          testSelections: [],
        },
      ];
      mockTestDefinitionService.fetchAll.mockReturnValue(
        of(expectedDefinitions)
      );

      const result = await firstValueFrom(
        service.getTestDefinitions("project-1", ["td-1"])
      );

      expect(mockTestDefinitionService.fetchAll).toHaveBeenCalledWith(
        "project-1",
        ["td-1"]
      );
      expect(result).toEqual(expectedDefinitions);
    });
  });

  describe("getScenarioDefinitionById", () => {
    it("returns the scenario definition matching the given id", async () => {
      const apiResponse = {
        id: "scenario-1",
        projectId: "project-1",
        name: "Scenario One",
        tests: [],
        idempotent: true,
        nonFunctionalTest: false,
        qualityLevel: "MQG",
        qualityGate: "CQG",
        bpcs: [],
        environmentDefinitionId: "env-1",
        heaviness: "LIGHT",
      };

      const resultPromise = firstValueFrom(
        service.getScenarioDefinitionById("scenario-1", "project-1")
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario/scenario-1`)
        .flush(apiResponse);

      expect(await resultPromise).toEqual(apiResponse);
    });

    it("fails when the scenario definition does not exist", async () => {
      const resultPromise = firstValueFrom(
        service.getScenarioDefinitionById("scenario-1", "project-1")
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario/scenario-1`)
        .flush("not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow("not found");
    });
  });

  describe("getScenarioDefinitions", () => {
    it("returns all scenario definitions for a project", async () => {
      const apiResponse = [
        {
          id: "s1",
          projectId: "project-1",
          name: "Scenario 1",
          tests: [],
          idempotent: false,
          nonFunctionalTest: false,
          bpcs: [],
          qualityGate: "CQG",
          environmentDefinitionId: "env-1",
          heaviness: "NA",
        },
      ];

      const resultPromise = firstValueFrom(
        service.getScenarioDefinitions("project-1")
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario`)
        .flush(apiResponse);

      expect(await resultPromise).toEqual(apiResponse);
    });

    it("fails when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.getScenarioDefinitions("project-1")
      );

      httpController
        .expectOne(`${GATEWAY_URL}projects/project-1/test-scenario`)
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow("server error");
    });

    it.each([
      ScenarioDefinitionActivityStatus.ACTIVE,
      ScenarioDefinitionActivityStatus.INACTIVE,
    ])(
      "includes activity status as query param when provided",
      async (status) => {
        const resultPromise = firstValueFrom(
          service.getScenarioDefinitions("project-1", status)
        );
        const req = httpController.expectOne(
          (request) =>
            request.url === `${GATEWAY_URL}projects/project-1/test-scenario`
        );
        expect(req.request.params.get("status")).toBe(status);
        req.flush([]);

        await expect(resultPromise).resolves.toEqual([]);
      }
    );

    it("should not include activity status query param when not provided", async () => {
      const resultPromise = firstValueFrom(
        service.getScenarioDefinitions("project-1")
      );
      const req = httpController.expectOne(
        (request) =>
          request.url === `${GATEWAY_URL}projects/project-1/test-scenario`
      );
      expect(req.request.params.has("status")).toBeFalsy();
      req.flush([]);

      await expect(resultPromise).resolves.toEqual([]);
    });
  });

  describe("fetchCrossProjectScenarioDefinition", () => {
    it("returns cross-project scenario definitions matching the given ids", async () => {
      const liteDefinitions = [
        { id: "s1", name: "Lite Scenario 1" },
        { id: "s2", name: "Lite Scenario 2" },
      ];

      const resultPromise = firstValueFrom(
        service.fetchCrossProjectScenarioDefinition({ ids: ["s1", "s2"] })
      );

      const req = httpController.expectOne(
        (request) =>
          request.url === `${GATEWAY_URL}test-definition/scenario-definitions`
      );
      expect(req.request.params.getAll("ids")).toEqual(["s1", "s2"]);
      req.flush(liteDefinitions);

      expect(await resultPromise).toEqual(liteDefinitions);
    });

    it("fails when the cross-project fetch encounters a server error", async () => {
      const resultPromise = firstValueFrom(
        service.fetchCrossProjectScenarioDefinition({
          scenarioDefinitionNamePhrases: ["search"],
        })
      );

      httpController
        .expectOne(
          (request) =>
            request.url === `${GATEWAY_URL}test-definition/scenario-definitions`
        )
        .flush("cross project error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow("cross project error");
    });
  });

  describe("archiveScenarioDefinition", () => {
    it("should send a patch request to the correct endpoint", async () => {
      const resultPromise = firstValueFrom(
        service.archiveScenarioDefinition("project-1", "scenario-1")
      );

      const req = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/test-scenario/scenario-1/archive`
      );
      expect(req.request.method).toBe("PATCH");
      expect(req.request.body).toEqual({});
      req.flush(null, { status: 204, statusText: "No Content" });

      await expect(resultPromise).resolves.toBeNull();
    });

    it("should fail when the scenario definition does not exist", async () => {
      const resultPromise = firstValueFrom(
        service.archiveScenarioDefinition("project-1", "scenario-1")
      );

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/project-1/test-scenario/scenario-1/archive`
        )
        .flush("not found", { status: 404, statusText: "Not Found" });

      await expect(resultPromise).rejects.toThrow("not found");
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.archiveScenarioDefinition("project-1", "scenario-1")
      );

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/project-1/test-scenario/scenario-1/archive`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow("server error");
    });
  });
});
