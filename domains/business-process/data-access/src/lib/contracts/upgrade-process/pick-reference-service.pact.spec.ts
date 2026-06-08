import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { PickReferenceExecutionService } from "../../upgrade-process/pick-reference-execution.service";
import { catchError, lastValueFrom, of } from "rxjs";
import { AuthenticationService } from "@mxflow/core/auth";
import { APP_CONFIG } from "@mxflow/config";

const projectId = "projectId";
const processId = "processId";

describe("Pick reference service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };
  let authService: AuthenticationService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    };
    authService = {
      getUsername: jest.fn(() => "username"),
    } as unknown as AuthenticationService;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        PickReferenceExecutionService,
        { provide: AuthenticationService, useValue: authService },
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

  test("validate contract for picking the reference and proceeding with the process", async () => {
    await provider.addInteraction({
      state: "a binary upgrade process is running",
      uponReceiving:
        "a request to pick the technical upgrade reference scenario",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${processId}/user-input/pick-reference-execution`,
        body: {
          actionRequester: Matchers.string(),
          referenceExecution: Matchers.string(),
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    const service = TestBed.inject(PickReferenceExecutionService);

    await expect(
      lastValueFrom(
        service.pickReferenceExecution(projectId, processId, "central perk")
      )
    ).resolves.not.toThrow();
  });

  test("validate contract for picking the reference and proceeding with the process failed", async () => {
    await provider.addInteraction({
      state: "bu process pick reference execution on RTU stage failed",
      uponReceiving:
        "a request to pick the technical upgrade reference scenario",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${processId}/user-input/pick-reference-execution`,
        body: {
          actionRequester: Matchers.string(),
          referenceExecution: Matchers.string(),
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const service = TestBed.inject(PickReferenceExecutionService);

    const errorMessage = await lastValueFrom(
      service
        .pickReferenceExecution(projectId, processId, "central perk")
        .pipe(catchError((error) => of(error.message)))
    );
    expect(errorMessage).not.toBeNull();
  });
});
