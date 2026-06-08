import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { v4 as uuid } from "uuid";
import { ExecutionAbortService } from "./execution-abort.service";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { AbortExecutionRequest } from "./abort-execution-request";

describe("ExecutionAbortService", () => {
  const gatewayUrl = "https://gateway/";
  const projectId = uuid();
  const processId = uuid();
  const developmentId = uuid();

  let httpTesting: HttpTestingController;
  let service: ExecutionAbortService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExecutionAbortService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl } },
      ],
    });

    service = TestBed.inject(ExecutionAbortService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("sends a POST request to the correct abort URL", () => {
    const expectedUrl = `${gatewayUrl}projects/${projectId}/business-process/executions/${processId}/abort`;

    service.abort(buildAbortRequest()).subscribe();

    const request = httpTesting.expectOne(expectedUrl);
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      shouldCleanDevelopment: true,
      developmentId,
    });
    request.flush(null);
  });

  it("throws the error message from the API response", async () => {
    const errorMessage = uuid();

    const result = lastValueFrom(service.abort(buildAbortRequest()));

    const request = httpTesting.expectOne(
      `${gatewayUrl}projects/${projectId}/business-process/executions/${processId}/abort`
    );
    request.flush(
      { message: errorMessage },
      { status: 500, statusText: "Error" }
    );

    await expect(result).rejects.toThrow(errorMessage);
  });

  function buildAbortRequest(): AbortExecutionRequest {
    return {
      projectId,
      processId,
      shouldCleanDevelopment: true,
      developmentId,
    };
  }
});
