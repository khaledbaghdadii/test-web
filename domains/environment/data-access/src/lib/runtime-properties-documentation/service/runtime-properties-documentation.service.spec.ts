import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { RuntimePropertiesDocumentationService } from "@mxevolve/domains/environment/data-access";
import { firstValueFrom } from "rxjs";
import { RuntimePropertiesDocumentationApiResponse } from "../model/runtime-properties-documentation-api-model";

const GATEWAY_URL = "https://api.test.com/";

describe("Runtime Properties Documentation Service", () => {
  let service: RuntimePropertiesDocumentationService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RuntimePropertiesDocumentationService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(RuntimePropertiesDocumentationService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("fetches runtime properties documentation and maps the response", async () => {
    const apiResponse: RuntimePropertiesDocumentationApiResponse = {
      requestType: "deployment",
      properties: [
        {
          name: "timeout",
          kind: "INTEGER",
          optional: true,
          description: "Timeout in seconds",
          deprecated: false,
        },
      ],
    };

    const resultPromise = firstValueFrom(
      service.getRuntimePropertiesDocumentation("proj-001", "deployment")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/management-requests/runtime-properties/deployment`
    );
    request.flush(apiResponse);

    const result = await resultPromise;

    expect(result.requestType).toBe("deployment");
    expect(result.properties.length).toBe(1);
    expect(result.properties[0].name).toBe("timeout");
  });

  it("should return error if the api fails to return data", async () => {
    const resultPromise = firstValueFrom(
      service.getRuntimePropertiesDocumentation("proj-001", "deployment")
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/management-requests/runtime-properties/deployment`
    );
    request.flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const error = await resultPromise;

    expect(error).toBeInstanceOf(Error);
  });
});
