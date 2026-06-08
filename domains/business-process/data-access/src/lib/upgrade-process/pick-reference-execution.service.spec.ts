import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { PickReferenceExecutionService } from "./pick-reference-execution.service";
import { AuthenticationService } from "@mxflow/core/auth";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";

describe("PickReferenceExecutionService", () => {
  let service: PickReferenceExecutionService;
  let httpTestingController: HttpTestingController;

  const GATEWAY_URL = "https://api.test.com/";
  const USERNAME = "testuser";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        {
          provide: AuthenticationService,
          useValue: { getUsername: () => USERNAME },
        },
        PickReferenceExecutionService,
      ],
    });

    service = TestBed.inject(PickReferenceExecutionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should post to the pick reference execution endpoint with correct body", () => {
    service
      .pickReferenceExecution("project-1", "process-1", "reference-execution-1")
      .subscribe();
    const request = httpTestingController.expectOne({
      url: `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/process-1/user-input/pick-reference-execution`,
      method: "POST",
    });

    expect(request.request.body).toEqual({
      actionRequester: USERNAME,
      referenceExecution: "reference-execution-1",
    });
    request.flush({});
  });

  it("should throw an error if the HTTP request fails", () => {
    let errorMessage: string | undefined;

    service
      .pickReferenceExecution("project-1", "process-1", "reference-execution-1")
      .subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/project-1/business-process/executions/binary-upgrade/process-1/user-input/pick-reference-execution`
      )
      .flush(
        { message: "Failed to pick reference execution" },
        { status: 409, statusText: "Conflict" }
      );

    expect(errorMessage).toBe("Failed to pick reference execution");
  });
});
