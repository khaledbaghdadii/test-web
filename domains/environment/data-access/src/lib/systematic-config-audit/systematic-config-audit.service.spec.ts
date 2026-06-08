import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import { SystematicConfigAuditService } from "./systematic-config-audit.service";
import { SystematicConfigAuditOperationsResponseApiModel } from "./systematic-config-audit-api-model";
import {
  SystematicConfigAuditRequestResultType,
  SystematicConfigAuditRequestStatus,
} from "./systematic-config-audit";

const GATEWAY_URL = "https://api.test.com/";

describe("SystematicConfigAuditService", () => {
  let service: SystematicConfigAuditService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SystematicConfigAuditService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(SystematicConfigAuditService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("sends a GET to the systematic-config-audit endpoint and maps the response", async () => {
    const apiResponse: SystematicConfigAuditOperationsResponseApiModel = {
      operationId: "op-1",
      environmentId: "env-001",
      targetCommitId: "abc123",
      baselineCommitId: "def456",
      requestStatus: "ENDED",
      requestResultStatus: "SUCCESS",
      configurationLintingResult: {
        resultStatus: "PASS",
        artifacts: [
          "https://storage/report.csv",
          "https://storage/report.html",
        ],
        mode: "DELTA",
      },
    };

    const resultPromise = firstValueFrom(
      service.retrieveSystematicConfigAudit("proj-001", "env-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/systematic-config-audit`
    );
    expect(request.request.method).toBe("GET");
    request.flush(apiResponse);

    const result = await resultPromise;

    expect(result.requestStatus).toBe(
      SystematicConfigAuditRequestStatus.ENDED
    );
    expect(result.requestResultStatus).toBe(
      SystematicConfigAuditRequestResultType.SUCCESS
    );
    expect(result.configurationLintingResult?.resultStatus).toBe("PASS");
    expect(result.configurationLintingResult?.artifacts).toEqual([
      "https://storage/report.csv",
      "https://storage/report.html",
    ]);
    expect(result.configurationLintingResult?.mode).toBe("DELTA");
  });

  it("defaults artifacts to an empty array when omitted", async () => {
    const apiResponse: SystematicConfigAuditOperationsResponseApiModel = {
      operationId: "op-2",
      environmentId: "env-001",
      targetCommitId: "abc123",
      requestStatus: "STARTED",
      configurationLintingResult: {
        resultStatus: "PASS",
        mode: "FULL",
      },
    };

    const resultPromise = firstValueFrom(
      service.retrieveSystematicConfigAudit("proj-001", "env-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/systematic-config-audit`
    );
    request.flush(apiResponse);

    const result = await resultPromise;

    expect(result.configurationLintingResult?.artifacts).toEqual([]);
  });

  it("propagates errors as an Error", async () => {
    const resultPromise = firstValueFrom(
      service.retrieveSystematicConfigAudit("proj-001", "env-001")
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/systematic-config-audit`
    );
    request.flush(
      { message: "audit unavailable" },
      { status: 500, statusText: "Internal Server Error" }
    );

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("audit unavailable");
  });
});
