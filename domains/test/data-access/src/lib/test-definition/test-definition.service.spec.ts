import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { TestDefinitionService } from "./test-definition.service";
import { firstValueFrom } from "rxjs";
import {
  CreateTestDefinitionRequest,
  EditTestDefinitionRequest,
} from "@mxevolve/domains/test/model";
import { TestDefinitionApiModel } from "../api-models/test-definition-api-model";

const PROJECT_ID = "project-1";
const TEST_DEFINITION_ID = "td-1";
const GATEWAY_URL = "https://api.test.com/";
const TEST_SELECTION_1 = {
  id: "ts-1",
  name: "Selection A",
  path: "/sel-a",
  tags: ["regression", "smoke"],
};
const TEST_SELECTION_2 = {
  id: "ts-2",
  name: "Selection B",
  path: "/sel-b",
  tags: [],
};
const TEST_DEFINITION = {
  id: TEST_DEFINITION_ID,
  name: "Test Package 1",
  projectId: PROJECT_ID,
  repoId: "repo-1",
  path: "/tests/package1",
  description: "First test package",
  timeoutDuration: { days: 0, hours: 1, minutes: 30 },
  testSelections: [TEST_SELECTION_1],
};

describe("TestDefinitionService", () => {
  let service: TestDefinitionService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TestDefinitionService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(TestDefinitionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("fetch all test definitions", () => {
    it("returns mapped test definitions for a project", async () => {
      const apiResponse = [TEST_DEFINITION];

      const resultPromise = firstValueFrom(service.fetchAll(PROJECT_ID));

      httpController
        .expectOne(`${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`)
        .flush(apiResponse);

      expect(await resultPromise).toEqual([TEST_DEFINITION]);
    });

    it("includes test definition ids as a query parameter when provided", () => {
      service.fetchAll(PROJECT_ID, ["td-1", "td-2"]).subscribe();

      const req = httpController.expectOne(
        (request) =>
          request.url === `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`
      );
      expect(req.request.params.get("testDefinitionIds")).toBe("td-1,td-2");
      req.flush([]);
    });

    it("omits test definition ids when none are provided", () => {
      service.fetchAll(PROJECT_ID).subscribe();

      const req = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`
      );
      expect(req.request.params.has("testDefinitionIds")).toBe(false);
      req.flush([]);
    });

    it("preserves timeout duration from the api response", async () => {
      const resultPromise = firstValueFrom(service.fetchAll(PROJECT_ID));

      httpController
        .expectOne(`${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`)
        .flush([
          {
            id: "td-1",
            name: "Timeout Test",
            projectId: PROJECT_ID,
            repoId: "r1",
            path: "/p",
            description: "d",
            timeoutDuration: { days: 2, hours: 5, minutes: 45 },
            testSelections: [],
          },
        ]);

      const result = await resultPromise;
      expect(result[0].timeoutDuration).toEqual({
        days: 2,
        hours: 5,
        minutes: 45,
      });
    });

    it("preserves test selection details from the api response", async () => {
      const resultPromise = firstValueFrom(service.fetchAll(PROJECT_ID));

      httpController
        .expectOne(`${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`)
        .flush([
          {
            ...TEST_DEFINITION,
            testSelections: [TEST_SELECTION_1, TEST_SELECTION_2],
          },
        ]);

      const result = await resultPromise;
      expect(result[0].testSelections).toEqual([
        TEST_SELECTION_1,
        TEST_SELECTION_2,
      ]);
    });

    it("fails when the server returns an error", async () => {
      const resultPromise = firstValueFrom(service.fetchAll(PROJECT_ID));

      httpController
        .expectOne(`${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`)
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow();
    });

    it("returns an empty array when no definitions exist", async () => {
      const resultPromise = firstValueFrom(service.fetchAll(PROJECT_ID));

      httpController
        .expectOne(`${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`)
        .flush([]);

      expect(await resultPromise).toEqual([]);
    });
  });

  describe("create test definition", () => {
    const CREATE_TEST_DEFINITION_REQUEST: CreateTestDefinitionRequest = {
      name: "name1",
      repoId: "efdf17cd-ca84-44e2-b4b2-0be159b35e6f",
      path: "test/mxtest/ALL_Init/config/",
      description: "desc",
      timeoutDuration: {
        days: 0,
        hours: 1,
        minutes: 0,
      },
    };

    it("returns the id of the created test definition on success", async () => {
      const resultPromise = firstValueFrom(
        service.create(PROJECT_ID, CREATE_TEST_DEFINITION_REQUEST)
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`
      );
      httpRequest.flush(TEST_DEFINITION_ID);
      expect(httpRequest.request.method).toBe("POST");
      expect(httpRequest.request.body).toEqual(CREATE_TEST_DEFINITION_REQUEST);
      expect(await resultPromise).toBe(TEST_DEFINITION_ID);
    });

    it("fails when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.create(PROJECT_ID, CREATE_TEST_DEFINITION_REQUEST)
      );
      httpController
        .expectOne(`${GATEWAY_URL}projects/${PROJECT_ID}/test-definition`)
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(resultPromise).rejects.toThrow("server error");
    });
  });

  describe("edit test definition", () => {
    const EDIT_TEST_DEFINITION_REQUEST: EditTestDefinitionRequest = {
      name: "name1",
      repoId: "efdf17cd-ca84-44e2-b4b2-0be159b35e6f",
      path: "test/mxtest/ALL_Init/config/",
      description: "desc",
      timeoutDuration: {
        days: 0,
        hours: 1,
        minutes: 0,
      },
    };

    it("should return the updated test definition on success", async () => {
      const apiResponse: TestDefinitionApiModel = {
        ...TEST_DEFINITION,
      };
      const resultPromise = firstValueFrom(
        service.edit(
          PROJECT_ID,
          TEST_DEFINITION_ID,
          EDIT_TEST_DEFINITION_REQUEST
        )
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}`
      );
      httpRequest.flush(apiResponse);
      expect(httpRequest.request.method).toBe("PUT");
      expect(httpRequest.request.body).toEqual(EDIT_TEST_DEFINITION_REQUEST);
      expect(await resultPromise).toEqual(TEST_DEFINITION);
    });

    it("should trim description when editing test definition", async () => {
      const editRequestWithTrailingWhiteSpace: EditTestDefinitionRequest = {
        ...EDIT_TEST_DEFINITION_REQUEST,
        description: "desc ",
      };
      firstValueFrom(
        service.edit(
          PROJECT_ID,
          TEST_DEFINITION_ID,
          editRequestWithTrailingWhiteSpace
        )
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}`
      );
      expect(httpRequest.request.body.description).toBe("desc");
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.edit(
          PROJECT_ID,
          TEST_DEFINITION_ID,
          EDIT_TEST_DEFINITION_REQUEST
        )
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      await expect(resultPromise).rejects.toThrow("server error");
    });
  });

  describe("fetch test definition by id", () => {
    it("should send a GET request to the correct url", async () => {
      firstValueFrom(service.fetch(TEST_DEFINITION_ID, PROJECT_ID));
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}`
      );
      expect(httpRequest.request.method).toBe("GET");
    });

    it("should return the test definition on success", async () => {
      const resultPromise = firstValueFrom(
        service.fetch(TEST_DEFINITION_ID, PROJECT_ID)
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}`
        )
        .flush(TEST_DEFINITION);
      expect(await resultPromise).toEqual(TEST_DEFINITION);
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.fetch(TEST_DEFINITION_ID, PROJECT_ID)
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      await expect(resultPromise).rejects.toThrow("server error");
    });
  });

  describe("add test selection to test definition", () => {
    const CREATE_TEST_SELECTION_REQUEST = {
      name: "case1",
      path: "test/mxtest/ALL_Init/config/case1",
    };

    it("should return the test selections added to the test definition on success", async () => {
      const resultPromise = firstValueFrom(
        service.addTestSelectionToTestDefinition(
          PROJECT_ID,
          TEST_DEFINITION_ID,
          CREATE_TEST_SELECTION_REQUEST
        )
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}/test-selection`
      );
      httpRequest.flush(TEST_SELECTION_1);
      expect(httpRequest.request.method).toBe("POST");
      expect(httpRequest.request.body).toEqual(CREATE_TEST_SELECTION_REQUEST);
      expect(await resultPromise).toEqual(TEST_SELECTION_1);
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.addTestSelectionToTestDefinition(
          PROJECT_ID,
          TEST_DEFINITION_ID,
          CREATE_TEST_SELECTION_REQUEST
        )
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}/test-selection`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      await expect(resultPromise).rejects.toThrow("server error");
    });
  });

  describe("edit test selection in test definition", () => {
    const EDIT_TEST_SELECTION_REQUEST = {
      name: "case1",
      path: "test/mxtest/ALL_Init/config/case1",
    };

    it("should return the edited test selection on success", async () => {
      const resultPromise = firstValueFrom(
        service.editTestSelectionInTestDefinition(
          PROJECT_ID,
          "testSelectionId",
          EDIT_TEST_SELECTION_REQUEST
        )
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/test-selection/testSelectionId`
      );
      httpRequest.flush(TEST_SELECTION_1);
      expect(httpRequest.request.method).toBe("PUT");
      expect(httpRequest.request.body).toEqual(EDIT_TEST_SELECTION_REQUEST);
      expect(await resultPromise).toEqual(TEST_SELECTION_1);
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.editTestSelectionInTestDefinition(
          PROJECT_ID,
          "testSelectionId",
          EDIT_TEST_SELECTION_REQUEST
        )
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/test-selection/testSelectionId`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      await expect(resultPromise).rejects.toThrow("server error");
    });
  });

  describe("remove test selection from test definition", () => {
    it("should send a DELETE request to the correct url", async () => {
      firstValueFrom(
        service.removeTestSelectionFromTestDefinition(
          PROJECT_ID,
          "testSelectionId"
        )
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/test-selection/testSelectionId`
      );
      httpRequest.flush({});
      expect(httpRequest.request.method).toBe("DELETE");
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.removeTestSelectionFromTestDefinition(
          PROJECT_ID,
          "testSelectionId"
        )
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/test-selection/testSelectionId`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      await expect(resultPromise).rejects.toThrow("server error");
    });
  });

  describe("delete all test selections from test definition", () => {
    it("should send a DELETE request to the correct url", async () => {
      firstValueFrom(
        service.deleteAllTestSelections(PROJECT_ID, TEST_DEFINITION_ID)
      );
      const httpRequest = httpController.expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}/test-selections`
      );
      httpRequest.flush({});
      expect(httpRequest.request.method).toBe("DELETE");
    });

    it("should fail when the server returns an error", async () => {
      const resultPromise = firstValueFrom(
        service.deleteAllTestSelections(PROJECT_ID, TEST_DEFINITION_ID)
      );
      httpController
        .expectOne(
          `${GATEWAY_URL}projects/${PROJECT_ID}/test-definition/${TEST_DEFINITION_ID}/test-selections`
        )
        .flush("server error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      await expect(resultPromise).rejects.toThrow("server error");
    });
  });
});
