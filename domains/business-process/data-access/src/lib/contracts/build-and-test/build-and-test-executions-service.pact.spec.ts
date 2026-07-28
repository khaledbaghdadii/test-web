import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { BuildAndTestExecutionsService } from "../../build-and-test/build-and-test-executions/build-and-test-executions.service";

const PROJECT_ID = "projectId";

describe("Build and test executions service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: AppConfig;
  let executionsService: BuildAndTestExecutionsService;

  beforeAll(async () => {
    await provider.setup();
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${provider.opts.port}/`,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        BuildAndTestExecutionsService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    executionsService = TestBed.inject(BuildAndTestExecutionsService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("queries CI executions by ids for backport summary", async () => {
    await provider.addInteraction({
      state: "fetching ci process executions by ids",
      uponReceiving:
        "a request to query CI executions by ids for backport summary from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process`,
        method: "GET",
        query: {
          ids: ["backportExecutionId"],
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          totalElements: Matchers.integer(1),
          content: Matchers.eachLike({
            id: Matchers.string("backportExecutionId"),
            name: Matchers.string("Backport execution"),
            startDate: Matchers.string("2026-06-08T11:00:00Z"),
            endDate: Matchers.string("2026-06-08T12:00:00Z"),
            expiryDate: Matchers.string("2026-06-15T11:00:00Z"),
            status: Matchers.string("PASSED"),
            owner: Matchers.string("owner"),
            definitionName: Matchers.string("Build and Test"),
            processName: Matchers.string("CI"),
            sourceDefinitionId: Matchers.string("configuration-build-and-test"),
            input: {
              configurationBranchName: Matchers.string("branch"),
              userStoryIds: Matchers.eachLike(Matchers.string("VAL-1")),
            },
          }),
        },
      },
    });

    const executions = await lastValueFrom(
      executionsService.getBuildAndTestExecutions(PROJECT_ID, {
        ids: ["backportExecutionId"],
      })
    );

    expect(executions.content.length).toBeGreaterThan(0);
  });
});
