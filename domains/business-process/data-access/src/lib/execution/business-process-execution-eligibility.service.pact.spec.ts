import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { APP_CONFIG } from "@mxflow/config";
import { BusinessProcessExecutionEligibilityService } from "./business-process-execution-eligibility.service";

const projectId = "projectId";

describe("Business process execution eligibility service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        BusinessProcessExecutionEligibilityService,
        { provide: GATEWAY_CONFIG, useValue: appConfig },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("fetching the user execution eligibility returns the eligibility and load-limit constraint", async () => {
    await provider.addInteraction({
      state:
        "fetch user business process execution eligibility with load eligibility constraint",
      uponReceiving:
        "a request to fetch user business process execution eligibility",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/business-process/executions/eligibility`,
        query: {
          familyId: Matchers.string(),
          baseDefinitionId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          eligible: Matchers.boolean(),
          ineligibilityResult: {
            reason: "LOAD_LIMIT_EXCEEDED",
            ineligibilityData: {
              type: Matchers.string(),
              currentRunning: Matchers.integer(),
              maximumSupported: Matchers.integer(),
            },
          },
        },
      },
    });

    const service = TestBed.inject(BusinessProcessExecutionEligibilityService);

    const eligibility = await lastValueFrom(
      service.getBusinessProcessExecutionEligibility(
        projectId,
        "binary-upgrade",
        "base-definition-id"
      )
    );

    expect(eligibility.ineligibilityResult?.reason).toBe("LOAD_LIMIT_EXCEEDED");
  });
});
