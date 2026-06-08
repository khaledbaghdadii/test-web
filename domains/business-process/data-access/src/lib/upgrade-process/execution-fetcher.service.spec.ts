import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ExecutionFetcherService } from "./execution-fetcher.service";

describe("binary upgrade execution service", () => {
  const PROJECT_ID = "projectId";
  const GATEWAY_URL = "https://api.test.com/";

  let service: ExecutionFetcherService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        ExecutionFetcherService,
      ],
    });

    service = TestBed.inject(ExecutionFetcherService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should call fetch execution endpoint correctly", () => {
    service.fetchExecution(PROJECT_ID, "id").subscribe();

    httpTestingController.expectOne({
      method: "GET",
      url: `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/binary-upgrade/id`,
    });
  });

  it("should return an error message when a failure occur when attempting to fetch execution", async () => {
    let errorMessage: string | undefined;

    service.fetchExecution(PROJECT_ID, "id").subscribe({
      error: (error) => {
        errorMessage = error.message;
      },
    });

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/binary-upgrade/id`
      )
      .flush(
        { message: "Execution not found" },
        { status: 404, statusText: "Not Found" }
      );

    expect(errorMessage).toBe("Execution not found");
  });
});
