import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import { AllExecutionsService } from "./all-executions.service";

describe("AllExecutionsService", () => {
  const gatewayUrl = "https://api.test/";
  const projectId = "project-1";
  const url = `${gatewayUrl}projects/${projectId}/business-process/executions`;

  let service: AllExecutionsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl } },
        AllExecutionsService,
      ],
    });
    service = TestBed.inject(AllExecutionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it("gets all project executions and maps the legacy response fields", () => {
    let result: unknown;

    service.getAllExecutions(projectId).subscribe((executions) => {
      result = executions;
    });

    httpTestingController.expectOne(url).flush([
      {
        id: "CI_PROCESS__run-1",
        definitionId: "definition-1",
        name: "Nightly build",
        owner: "alice",
        status: "RUNNING",
        officiality: "OFFICIAL",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-01T01:00:00.000Z",
        expiryDate: "2026-01-02T00:00:00.000Z",
        daysExtended: 2,
        definitionName: "Build definition",
        processName: "Build process",
        familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
        sourceDefinitionId: "source-1",
      },
    ]);

    expect(result).toEqual([
      {
        id: "CI_PROCESS__run-1",
        definitionId: "definition-1",
        name: "Nightly build",
        owner: "alice",
        status: ExecutionStatus.RUNNING,
        officiality: "OFFICIAL",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-01T01:00:00.000Z",
        expiryDate: "2026-01-02T00:00:00.000Z",
        daysExtended: 2,
        businessProcessDefinitionName: "Build definition",
        processName: "Build process",
        familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
        sourceDefinitionId: "source-1",
      },
    ]);
  });

  it("converts an API failure into an Error", () => {
    let error: Error | undefined;

    service.getAllExecutions(projectId).subscribe({
      error: (responseError) => {
        error = responseError;
      },
    });

    httpTestingController
      .expectOne(url)
      .flush(
        { message: "Unable to load executions" },
        { status: 500, statusText: "Server Error" }
      );

    expect(error).toEqual(new Error("Unable to load executions"));
  });
});
