import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { BuildAndTestExecutionFetcherService } from "./build-and-test-execution-fetcher.service";

describe("BuildAndTestExecutionFetcherService", () => {
  const PROJECT_ID = "projectId";
  const GATEWAY_URL = "https://api.test.com/";
  const EXPECTED_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/ci-process/id`;

  let service: BuildAndTestExecutionFetcherService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BuildAndTestExecutionFetcherService,
      ],
    });

    service = TestBed.inject(BuildAndTestExecutionFetcherService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should call the ci-process fetch execution endpoint correctly", () => {
    service.fetchExecution(PROJECT_ID, "id").subscribe();

    httpTestingController.expectOne({ method: "GET", url: EXPECTED_URL });
  });

  it("should map the response body to the execution", () => {
    const body = { id: "id", name: "CI run" };
    let result: unknown;

    service.fetchExecution(PROJECT_ID, "id").subscribe((execution) => {
      result = execution;
    });

    httpTestingController.expectOne(EXPECTED_URL).flush(body);

    expect(result).toEqual(body);
  });

  it("should surface the error message on failure", () => {
    let errorMessage: string | undefined;

    service.fetchExecution(PROJECT_ID, "id").subscribe({
      error: (error) => {
        errorMessage = error.message;
      },
    });

    httpTestingController
      .expectOne(EXPECTED_URL)
      .flush(
        { message: "Execution not found" },
        { status: 404, statusText: "Not Found" }
      );

    expect(errorMessage).toBe("Execution not found");
  });
});
