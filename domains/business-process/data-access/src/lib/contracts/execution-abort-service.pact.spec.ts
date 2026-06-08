import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, lastValueFrom, of } from "rxjs";
import { ExecutionAbortService } from "../execution-abort/execution-abort.service";

const PROJECT_ID = "projectId";
const EXECUTION_ID = "executionId";

describe("Execution abort service contract tests", () => {
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
        ExecutionAbortService,
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

  test("should abort a business process execution", async () => {
    await provider.addInteraction({
      state: "abort a business process execution",
      uponReceiving:
        "a request to abort a business process execution from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/${EXECUTION_ID}/abort`,
        method: "POST",
        body: {
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 200,
      },
    });

    const service = TestBed.inject(ExecutionAbortService);

    await expect(
      lastValueFrom(
        service.abort({
          projectId: PROJECT_ID,
          processId: EXECUTION_ID,
          shouldCleanDevelopment: true,
          developmentId: "developmentId",
        })
      )
    ).resolves.not.toThrow();
  });

  test("should return an error when aborting a business process execution fails", async () => {
    await provider.addInteraction({
      state: "failed to abort a business process execution",
      uponReceiving:
        "a request to abort a business process execution that fails from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/${EXECUTION_ID}/abort`,
        method: "POST",
        body: {
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const service = TestBed.inject(ExecutionAbortService);

    const errorMessage = await lastValueFrom(
      service
        .abort({
          projectId: PROJECT_ID,
          processId: EXECUTION_ID,
          shouldCleanDevelopment: true,
          developmentId: "developmentId",
        })
        .pipe(catchError((error) => of(error.message)))
    );

    expect(errorMessage).toBeTruthy();
  });
});
