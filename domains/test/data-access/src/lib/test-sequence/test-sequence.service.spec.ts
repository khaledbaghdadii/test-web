import { TestSequenceService } from "./test-sequence.service";
import { APP_CONFIG } from "@mxflow/config";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import {
  FetchTestSelectionsRequest,
  TestSelectionTreeNode,
} from "@mxevolve/domains/test/model";

const PROJECT_ID = "project-1";
const SOURCE = "main";
const TEST_SEQUENCE_NAME = "sequence-a";
const REPOSITORY_ID = "repo-1";
const GATEWAY_URL = "apiUrl/";

const testSelectionTreeNode: TestSelectionTreeNode = {
  id: "n2",
  name: "Child",
  parentId: "n1",
  type: "TEST",
  children: [],
};

const testSelectionTreeRootNode: TestSelectionTreeNode = {
  id: "n1",
  name: "Root",
  parentId: null,
  type: "SUITE",
  children: [testSelectionTreeNode],
};

describe("TestSequenceService", () => {
  let service: TestSequenceService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TestSequenceService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(TestSequenceService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  function getRequest(): FetchTestSelectionsRequest {
    return {
      projectId: PROJECT_ID,
      testSequenceName: TEST_SEQUENCE_NAME,
      repositoryId: REPOSITORY_ID,
      source: SOURCE,
    };
  }

  function getExpectedUrl(): string {
    return `${GATEWAY_URL}projects/${PROJECT_ID}/test-sequences/${TEST_SEQUENCE_NAME}/test-selections?repositoryId=${REPOSITORY_ID}&source=${SOURCE}`;
  }

  describe("fetch test selections", () => {
    it("should return the mapped root node on success", async () => {
      const serviceResult = firstValueFrom(
        service.fetchTestSelections(getRequest())
      );

      const httpRequest = httpController.expectOne(getExpectedUrl());
      httpRequest.flush(testSelectionTreeRootNode);
      expect(httpRequest.request.method).toBe("GET");

      expect(await serviceResult).toEqual(testSelectionTreeRootNode);
    });

    it("should propagate http errors", async () => {
      const serviceResult = firstValueFrom(
        service.fetchTestSelections(getRequest())
      );

      const errorMessage = "errorMessage";
      httpController.expectOne(getExpectedUrl()).flush(errorMessage, {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(serviceResult).rejects.toThrow(errorMessage);
    });
  });

  describe("fetch test sequences", () => {
    const testSequences = [
      { id: "seq-1", name: "test/mxtest/ALL_Init/config" },
      { id: "seq-2", name: "test/mxtest/RATES/config" },
    ];

    it("given a valid project id and repository id, then test sequences should be fetched correctly", async () => {
      const serviceResult = firstValueFrom(
        service.fetchTestSequences(PROJECT_ID, REPOSITORY_ID, SOURCE)
      );

      const httpRequest = httpController.expectOne(getSequencesExpectedUrl());
      httpRequest.flush(testSequences);
      expect(httpRequest.request.method).toBe("GET");

      expect(await serviceResult).toEqual(testSequences);
    });

    it("given that a technical failure occur when fetching test sequences, then the system should emit a failure for the user", async () => {
      const serviceResult = firstValueFrom(
        service.fetchTestSequences(PROJECT_ID, REPOSITORY_ID, SOURCE)
      );

      const errorMessage = "Error fetching test definitions";
      httpController.expectOne(getSequencesExpectedUrl()).flush(errorMessage, {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(serviceResult).rejects.toThrow(errorMessage);
    });
  });

  function getSequencesExpectedUrl(): string {
    return `${GATEWAY_URL}projects/${PROJECT_ID}/test-sequences?repositoryId=${REPOSITORY_ID}&source=${SOURCE}`;
  }
});
