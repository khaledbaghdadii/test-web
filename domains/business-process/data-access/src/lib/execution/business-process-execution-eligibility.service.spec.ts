import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { v4 as uuid } from "uuid";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { BusinessProcessExecutionEligibilityService } from "./business-process-execution-eligibility.service";
import { EligibilityResponse } from "./eligibility-response";

describe("BusinessProcessExecutionEligibilityService", () => {
  const gatewayUrl = "https://gateway/";
  const projectId = uuid();
  const familyId = uuid();
  const baseDefinitionId = uuid();
  const expectedUrl = `${gatewayUrl}projects/${projectId}/business-process/executions/eligibility`;

  let httpTesting: HttpTestingController;
  let service: BusinessProcessExecutionEligibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BusinessProcessExecutionEligibilityService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl } },
      ],
    });

    service = TestBed.inject(BusinessProcessExecutionEligibilityService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("sends a GET request to the eligibility URL with family and base definition params", async () => {
    const response: EligibilityResponse = { eligible: true };

    const result = lastValueFrom(
      service.getBusinessProcessExecutionEligibility(
        projectId,
        familyId,
        baseDefinitionId
      )
    );

    const request = httpTesting.expectOne(
      (req) => req.url === expectedUrl && req.method === "GET"
    );
    expect(request.request.params.get("familyId")).toBe(familyId);
    expect(request.request.params.get("baseDefinitionId")).toBe(
      baseDefinitionId
    );
    request.flush(response);

    await expect(result).resolves.toEqual(response);
  });

  it("returns the ineligibility result when the user is not eligible", async () => {
    const response: EligibilityResponse = {
      eligible: false,
      ineligibilityResult: {
        reason: "LOAD_LIMIT_EXCEEDED",
        ineligibilityData: {
          type: "default-binary-upgrade-limit-group",
          currentRunning: 5,
          maximumSupported: 5,
        },
      },
    };

    const result = lastValueFrom(
      service.getBusinessProcessExecutionEligibility(
        projectId,
        familyId,
        baseDefinitionId
      )
    );

    httpTesting.expectOne((req) => req.url === expectedUrl).flush(response);

    await expect(result).resolves.toEqual(response);
  });

  it("throws the error message from the API response", async () => {
    const errorMessage = uuid();

    const result = lastValueFrom(
      service.getBusinessProcessExecutionEligibility(
        projectId,
        familyId,
        baseDefinitionId
      )
    );

    httpTesting
      .expectOne((req) => req.url === expectedUrl)
      .flush(errorMessage, { status: 500, statusText: "Error" });

    await expect(result).rejects.toThrow(errorMessage);
  });
});
