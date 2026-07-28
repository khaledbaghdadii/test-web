import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { AllExecutionsService } from "../../execution/all-executions/all-executions.service";

const PROJECT_ID = "projectId";

describe("All executions service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: AppConfig;

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
        AllExecutionsService,
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

  test("gets all visible business process executions for a project", async () => {
    await provider.addInteraction({
      state: "business process executions with project ID exist",
      uponReceiving:
        "a request for all business process executions for a project from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions`,
        method: "GET",
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: Matchers.eachLike({
          id: Matchers.string("CI_PROCESS__run-1"),
          definitionId: Matchers.string("definition-1"),
          name: Matchers.string("Build run"),
          owner: Matchers.string("owner"),
          status: Matchers.string("PASSED"),
          officiality: Matchers.string("OFFICIAL"),
          startDate: Matchers.string("2026-06-08T11:00:00Z"),
          endDate: Matchers.string("2026-06-08T12:00:00Z"),
          expiryDate: Matchers.string("2026-06-15T11:00:00Z"),
          daysExtended: Matchers.integer(0),
          definitionName: Matchers.string("Build and Test"),
          familyId: Matchers.string("user-story-build-and-test"),
        }),
      },
    });

    const executions = await lastValueFrom(
      TestBed.inject(AllExecutionsService).getAllExecutions(PROJECT_ID)
    );

    expect(executions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "CI_PROCESS__run-1",
          definitionId: "definition-1",
          name: "Build run",
          businessProcessDefinitionName: "Build and Test",
          familyId: "user-story-build-and-test",
        }),
      ])
    );
  });
});
