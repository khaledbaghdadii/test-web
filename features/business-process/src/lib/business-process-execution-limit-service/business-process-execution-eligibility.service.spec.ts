import { AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import {
  EligibilityResponse,
  BusinessProcessExecutionEligibilityService,
} from "@mxflow/features/business-process";
import { lastValueFrom, of } from "rxjs";
import { ElgibilityApiResponse } from "./elgibility-api-response";

function getBusinessProcessExecutionElgibilityResponse(): ElgibilityApiResponse {
  return {
    eligible: false,
    ineligibilityResult: {
      reason: "FAILURE",
      ineligibilityData: {
        currentRunning: 1,
        type: "type",
        maximumSupported: 3,
      },
    },
  };
}

function getExpectedResponse(): EligibilityResponse {
  return {
    eligible: false,
    ineligibilityResult: {
      reason: "FAILURE",
      ineligibilityData: {
        currentRunning: 1,
        type: "type",
        maximumSupported: 3,
      },
    },
  };
}

describe("Business Process Elgibility Service Test", () => {
  let service: BusinessProcessExecutionEligibilityService;
  let appConfig: AppConfig;
  let httpClient: HttpClient;

  beforeEach(() => {
    appConfig = {
      gatewayUrl: "gateway/",
    } as AppConfig;

    httpClient = {
      get: jest.fn(() => of(getBusinessProcessExecutionElgibilityResponse())),
    } as unknown as HttpClient;

    service = new BusinessProcessExecutionEligibilityService(
      httpClient,
      appConfig
    );
  });

  it("should create service", () => {
    expect(service).toBeTruthy();
  });

  it("should return correct eligibility response given correct params", async () => {
    const actualResult = await lastValueFrom(
      service.getBusinessProcessExecutionEligibility(
        "projectId",
        "familyId",
        "baseDefinitionId"
      )
    );

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        "projects/projectId/business-process/executions/eligibility",
      {
        params: {
          familyId: "familyId",
          baseDefinitionId: "baseDefinitionId",
        },
      }
    );

    expect(actualResult).toEqual(getExpectedResponse());
  });
});
