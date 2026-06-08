import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { APP_CONFIG } from "@mxflow/config";
import { FurtherAnalysisService } from "../../upgrade-process/further-analysis.service";
import { eachLike } from "@pact-foundation/pact/src/dsl/matchers";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";
const SCENARIO_ID = "scenarioId";
const ENVIRONMENT_ID = "environmentId";

describe("Further analysis service contract tests", () => {
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
        FurtherAnalysisService,
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

  test("validate contract for fetching further analysis candidates", async () => {
    await provider.addInteraction({
      state: "further analysis candidates exist for an upgrade process",
      uponReceiving: "a request to fetch further analysis candidates",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/further-analysis/candidates`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          candidates: eachLike({
            id: Matchers.string(),
            tags: eachLike(Matchers.string()),
            linkedScenario: {
              id: Matchers.string(),
              name: Matchers.string(),
              linkedIncidents: eachLike({
                id: Matchers.string(),
                externalIssueId: Matchers.string(),
                externalIssueLink: Matchers.string(),
              }),
            },
          }),
        },
      },
    });

    const service = TestBed.inject(FurtherAnalysisService);

    const result = await lastValueFrom(
      service.getFurtherAnalysisCandidates(PROJECT_ID, PROCESS_ID)
    );

    expect(result.candidates).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  test("validate contract for marking resources for further analysis", async () => {
    await provider.addInteraction({
      state: "an upgrade process execution exists for further analysis",
      uponReceiving: "a request to mark resources for further analysis",
      withRequest: {
        method: "PUT",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/further-analysis/resources`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          scenarioIds: eachLike(Matchers.string()),
          environmentIds: eachLike(Matchers.string()),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    const service = TestBed.inject(FurtherAnalysisService);

    await expect(
      lastValueFrom(
        service.markResourcesForFurtherAnalysis(PROJECT_ID, PROCESS_ID, {
          scenarioIds: [SCENARIO_ID],
          environmentIds: [ENVIRONMENT_ID],
        })
      )
    ).resolves.not.toThrow();
  });

  test("validate contract for fetching selected further analysis resources", async () => {
    await provider.addInteraction({
      state: "selected further analysis resources exist for an upgrade process",
      uponReceiving: "a request to fetch selected further analysis resources",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/further-analysis/resources`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          resources: eachLike({
            id: Matchers.string(),
            tags: eachLike(Matchers.string()),
            linkedScenario: {
              id: Matchers.string(),
              name: Matchers.string(),
              linkedIncidents: eachLike({
                id: Matchers.string(),
                externalIssueId: Matchers.string(),
                externalIssueLink: Matchers.string(),
              }),
            },
          }),
        },
      },
    });

    const service = TestBed.inject(FurtherAnalysisService);

    const result = await lastValueFrom(
      service.getSelectedResources(PROJECT_ID, PROCESS_ID)
    );

    expect(result.resources).toBeDefined();
    expect(result.resources.length).toBeGreaterThan(0);
  });
});
