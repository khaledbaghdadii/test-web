import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { lastValueFrom } from "rxjs";
import { ExecutionResourcesService } from "../execution-resources/execution-resources.service";

const PROJECT_ID = "projectId";
const EXECUTION_ID = "executionId";

describe("Execution resources service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let gatewayConfig: GatewayConfig;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    gatewayConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ExecutionResourcesService,
        { provide: GATEWAY_CONFIG, useValue: gatewayConfig },
      ],
    });
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should fetch business process execution resources", async () => {
    await provider.addInteraction({
      state: "fetch business process resources",
      uponReceiving:
        "a request to fetch business process resources from web-bp",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/business-process/executions/resources`,
        query: {
          processId: EXECUTION_ID,
        },
      },
      willRespondWith: {
        status: 200,
        body: Matchers.eachLike({
          resourceId: Matchers.string(),
          projectId: Matchers.string(),
          resourceType: Matchers.term({
            generate: "DEVELOPMENT",
            matcher: "SCENARIO|ENVIRONMENT|MERGE_JOB|DEVELOPMENT",
          }),
          usageTags: Matchers.eachLike(
            Matchers.term({
              generate: "BACKPORT",
              matcher: "BACKPORT|REFERENCE_ENVIRONMENT",
            })
          ),
        }),
      },
    });

    const service = TestBed.inject(ExecutionResourcesService);

    const result = await lastValueFrom(
      service.getExecutionResources(PROJECT_ID, EXECUTION_ID)
    );

    expect(result).not.toBeNull();
  });
});
