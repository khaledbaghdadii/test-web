import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { BuildAndTestExecutionsService } from "./build-and-test-executions.service";
import { BuildAndTestExecutionsQueryResult } from "./models/build-and-test-executions-query.model";

describe("BuildAndTestExecutionsService", () => {
  const GATEWAY_URL = "https://api.test/";
  const PROJECT_ID = "project-1";
  const URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/ci-process`;

  let service: BuildAndTestExecutionsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BuildAndTestExecutionsService,
      ],
    });

    service = TestBed.inject(BuildAndTestExecutionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("queries CI executions with repeated array query params", () => {
    service
      .getBuildAndTestExecutions(PROJECT_ID, {
        ids: ["exec-1", "exec-2"],
        statuses: [ExecutionStatus.PASSED, ExecutionStatus.FAILED],
        page: 0,
        pageSize: 20,
      })
      .subscribe();

    const request = httpTestingController.expectOne((req) => req.url === URL);

    expect(request.request.method).toBe("GET");
    expect(request.request.params.getAll("ids")).toEqual(["exec-1", "exec-2"]);
    expect(request.request.params.getAll("statuses")).toEqual([
      ExecutionStatus.PASSED,
      ExecutionStatus.FAILED,
    ]);
    expect(request.request.params.get("page")).toBe("0");
    expect(request.request.params.get("pageSize")).toBe("20");
  });

  it("maps the legacy listing response to the summary model", () => {
    let result: unknown;

    service
      .getBuildAndTestExecutions(PROJECT_ID, { ids: ["exec-1"] })
      .subscribe({
        next: (response) => (result = response),
      });

    httpTestingController
      .expectOne((req) => req.url === URL)
      .flush({
        totalElements: 1,
        content: [
          {
            id: "exec-1",
            definitionId: "definition-1",
            name: "Backport execution",
            owner: "owner",
            status: "PASSED",
            definitionName: "Build and Test",
            processName: "CI",
            sourceDefinitionId: "configuration-build-and-test",
            input: {
              configurationBranchName: "branch",
              userStoryIds: ["VAL-1"],
            },
          },
        ],
      });

    expect(result).toEqual({
      totalElements: 1,
      content: [
        {
          id: "exec-1",
          definitionId: "definition-1",
          name: "Backport execution",
          owner: "owner",
          status: ExecutionStatus.PASSED,
          endDate: undefined,
          startDate: undefined,
          expiryDate: undefined,
          daysExtended: undefined,
          processName: "CI",
          businessProcessDefinitionName: "Build and Test",
          sourceDefinitionId: "configuration-build-and-test",
          userStoryIds: ["VAL-1"],
          configurationBranchName: "branch",
        },
      ],
    });
  });

  it("defaults userStoryIds to an empty array when input is missing", async () => {
    let result: BuildAndTestExecutionsQueryResult | undefined;

    service
      .getBuildAndTestExecutions(PROJECT_ID, { ids: ["exec-1"] })
      .subscribe({ next: (response) => (result = response) });

    httpTestingController
      .expectOne((req) => req.url === URL)
      .flush({
        totalElements: 1,
        content: [{ id: "exec-1" }],
      });

    expect(result?.content[0].userStoryIds).toEqual([]);
    expect(result?.content[0].configurationBranchName).toBeUndefined();
  });

  it("skips undefined, null and empty-string query params", () => {
    service
      .getBuildAndTestExecutions(PROJECT_ID, {
        ids: ["exec-1"],
        page: 0,
        ownerPhrase: undefined,
        configurationBranchNamePhrase: "",
      })
      .subscribe();

    const request = httpTestingController.expectOne((req) => req.url === URL);

    expect(request.request.params.has("ownerPhrase")).toBe(false);
    expect(request.request.params.has("configurationBranchNamePhrase")).toBe(
      false
    );
    expect(request.request.params.get("page")).toBe("0");
    request.flush({ totalElements: 0, content: [] });
  });

  it("sets scalar query params with a single value", () => {
    service
      .getBuildAndTestExecutions(PROJECT_ID, {
        page: 2,
        pageSize: 50,
      })
      .subscribe();

    const request = httpTestingController.expectOne((req) => req.url === URL);

    expect(request.request.params.get("page")).toBe("2");
    expect(request.request.params.get("pageSize")).toBe("50");
    request.flush({ totalElements: 0, content: [] });
  });

  it("throws the server string error when the request fails", async () => {
    const resultPromise = firstValueFrom(
      service.getBuildAndTestExecutions(PROJECT_ID, { ids: ["exec-1"] })
    );

    httpTestingController
      .expectOne((req) => req.url === URL)
      .flush("executions unavailable", {
        status: 500,
        statusText: "Internal Server Error",
      });

    await expect(resultPromise).rejects.toThrow("executions unavailable");
  });

  it("throws the server error message object when the request fails", async () => {
    const resultPromise = firstValueFrom(
      service.getBuildAndTestExecutions(PROJECT_ID, { ids: ["exec-1"] })
    );

    httpTestingController
      .expectOne((req) => req.url === URL)
      .flush(
        { message: "forbidden" },
        { status: 403, statusText: "Forbidden" }
      );

    await expect(resultPromise).rejects.toThrow("forbidden");
  });

  describe("fetchExecution", () => {
    const EXECUTION_URL = `${URL}/id`;

    it("calls the ci-process fetch execution endpoint correctly", () => {
      service.fetchExecution(PROJECT_ID, "id").subscribe();

      const request = httpTestingController.expectOne({
        method: "GET",
        url: EXECUTION_URL,
      });

      expect(request.request.method).toBe("GET");
      expect(request.request.url).toBe(EXECUTION_URL);
    });

    it("maps the response body to the execution", () => {
      const body = { id: "id", name: "CI run" };
      let result: unknown;

      service.fetchExecution(PROJECT_ID, "id").subscribe((execution) => {
        result = execution;
      });

      httpTestingController.expectOne(EXECUTION_URL).flush(body);

      expect(result).toEqual(body);
    });

    it("surfaces the error message on failure", () => {
      let errorMessage: string | undefined;

      service.fetchExecution(PROJECT_ID, "id").subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      httpTestingController
        .expectOne(EXECUTION_URL)
        .flush(
          { message: "Execution not found" },
          { status: 404, statusText: "Not Found" }
        );

      expect(errorMessage).toBe("Execution not found");
    });
  });
});
