import { TestBed } from "@angular/core/testing";
import { EnvironmentConfigAuditService } from "./environment-config-audit.service";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import {
  RequestResultType,
  RequestStatus,
  SystematicConfigAuditOperationsResponse,
} from "../models/systematic-config-audit.models";

const gatewayUrl = "https://gateway/";

describe("Environment Config Audit Service", () => {
  let configAuditService: EnvironmentConfigAuditService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: { gatewayUrl } },
        provideHttpClient(),
        provideHttpClientTesting(),
        EnvironmentConfigAuditService,
      ],
    });

    configAuditService = TestBed.inject(EnvironmentConfigAuditService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should call retrieve systematic config audits endpoint and return operation id", async () => {
    const promise = firstValueFrom(
      configAuditService.retrieveSystematicConfigAudits("project-1", "env-1")
    );

    const req = httpController.expectOne(
      `${gatewayUrl}projects/project-1/environments/env-1/systematic-config-audit`
    );
    expect(req.request.method).toBe("GET");

    const response = getSystematicConfigAuditOperationsResponse();

    req.flush(response);
    await expect(promise).resolves.toEqual(response);
  });

  it("should throw backend error message when retrieve systematic config audit call fails", async () => {
    const promise = firstValueFrom(
      configAuditService.retrieveSystematicConfigAudits("project-1", "env-1")
    );

    const req = httpController.expectOne(
      `${gatewayUrl}projects/project-1/environments/env-1/systematic-config-audit`
    );
    req.flush(
      { message: "failed to retrieve config audits" },
      {
        status: 400,
        statusText: "Bad Request",
      }
    );

    await expect(promise).rejects.toThrow("failed to retrieve config audits");
  });

  function getSystematicConfigAuditOperationsResponse(): SystematicConfigAuditOperationsResponse {
    return {
      baselineCommitId: "baselineCommitId",
      configurationLintingResult: {
        mode: "DELTA",
        resultStatus: "PASS",
      },
      environmentId: "environmentId",
      operationId: "operationId",
      requestResultMessage: "requestResultMessage",
      requestResultStatus: RequestResultType.SUCCESS,
      requestStatus: RequestStatus.STARTED,
      requestStatusMessage: "requestStatusMessage",
      targetCommitId: "targetCommitId",
    };
  }
});
