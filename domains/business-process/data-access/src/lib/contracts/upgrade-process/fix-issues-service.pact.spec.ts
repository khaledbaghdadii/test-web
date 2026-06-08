import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { catchError, lastValueFrom, of } from "rxjs";
import { APP_CONFIG } from "@mxflow/config";
import { FixIssuesService } from "../../upgrade-process/fix-issues.service";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";

describe("Fix issues service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: { gatewayUrl: string };
  let fixIssuesService: FixIssuesService;

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
        FixIssuesService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    fixIssuesService = TestBed.inject(FixIssuesService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validate contract for pausing and fixing integrate changes", async () => {
    await provider.addInteraction({
      state: "success in pausing and fix integrate changes",
      uponReceiving: "a request to pause and fix integrate changes",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/fix-issues`,
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(fixIssuesService.fixIssues(PROJECT_ID, PROCESS_ID))
    ).resolves.not.toThrow();
  });

  test("validate contract for failing to pause and fixing integrate changes", async () => {
    await provider.addInteraction({
      state: "failing to pause and fix integrate changes",
      uponReceiving: "a request to pause and fix integrate changes",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/fix-issues`,
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

    const errorMessage = await lastValueFrom(
      fixIssuesService
        .fixIssues(PROJECT_ID, PROCESS_ID)
        .pipe(catchError((error) => of(error.message)))
    );

    expect(errorMessage).not.toBeNull();
  });
});
