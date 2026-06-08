import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { v4 as uuid } from "uuid";
import { ExecutionResourcesService } from "./execution-resources.service";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";

describe("ExecutionResourcesService", () => {
  const gatewayUrl = "https://gateway/";
  const projectId = uuid();
  const processId = uuid();

  let httpTesting: HttpTestingController;
  let service: ExecutionResourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExecutionResourcesService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl } },
      ],
    });

    service = TestBed.inject(ExecutionResourcesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("sends a GET request to the correct resources URL with process ID param", () => {
    const expectedUrl = `${gatewayUrl}projects/${projectId}/business-process/executions/resources?processId=${processId}`;

    service.getExecutionResources(projectId, processId).subscribe();

    const request = httpTesting.expectOne(expectedUrl);
    expect(request.request.method).toBe("GET");
    request.flush([]);
  });

  it("throws the error message from the API response", async () => {
    const errorMessage = uuid();

    const result = lastValueFrom(
      service.getExecutionResources(projectId, processId)
    );

    const request = httpTesting.expectOne(
      `${gatewayUrl}projects/${projectId}/business-process/executions/resources?processId=${processId}`
    );
    request.flush(
      { message: errorMessage },
      { status: 500, statusText: "Error" }
    );

    await expect(result).rejects.toThrow(errorMessage);
  });
});
