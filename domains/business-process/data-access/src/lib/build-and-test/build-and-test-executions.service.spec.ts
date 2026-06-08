import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { BuildAndTestExecutionsService } from "./build-and-test-executions.service";

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

    service.getBuildAndTestExecutions(PROJECT_ID, { ids: ["exec-1"] }).subscribe({
      next: (response) => (result = response),
    });

    httpTestingController.expectOne((req) => req.url === URL).flush({
      totalElements: 1,
      content: [
        {
          id: "exec-1",
          name: "Backport execution",
          owner: "owner",
          status: "PASSED",
          definitionName: "Build and Test",
          processName: "CI",
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
          name: "Backport execution",
          owner: "owner",
          status: ExecutionStatus.PASSED,
          endDate: undefined,
          startDate: undefined,
          expiryDate: undefined,
          daysExtended: undefined,
          processName: "CI",
          businessProcessDefinitionName: "Build and Test",
          userStoryIds: ["VAL-1"],
          configurationBranchName: "branch",
        },
      ],
    });
  });
});
