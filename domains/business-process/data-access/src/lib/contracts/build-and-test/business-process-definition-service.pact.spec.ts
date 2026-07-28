import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { BusinessProcessDefinitionService } from "../../build-and-test/business-process-definition/business-process-definition.service";

const PROJECT_ID = "projectId";

describe("Business process definition service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-definition-service",
  });

  let appConfig: AppConfig;
  let definitionService: BusinessProcessDefinitionService;

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
        BusinessProcessDefinitionService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    definitionService = TestBed.inject(BusinessProcessDefinitionService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("fetches executable non-extendable business process definitions", async () => {
    await provider.addInteraction({
      state: "fetching business process definitions with all filters",
      uponReceiving:
        "a request to fetch business process definitions from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/definitions`,
        method: "GET",
        query: {
          executable: "true",
          extendable: "false",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: Matchers.eachLike({
          id: Matchers.string("definitionId"),
          name: Matchers.string("On-demand backport"),
          processName: Matchers.string("Backport"),
          description: Matchers.string("Definition"),
          family: {
            id: Matchers.string("user-story-build-and-test"),
            name: Matchers.string("Build & Test"),
          },
          sourceDefinitionId: Matchers.string("on-demand-backport"),
          providedInputs: Matchers.eachLike({
            inputId: Matchers.string("repositoryId"),
            value: Matchers.like({}),
          }),
        }),
      },
    });

    const definitions = await lastValueFrom(
      definitionService.getBusinessProcessDefinitions({
        projectId: PROJECT_ID,
        executable: true,
        extendable: false,
      })
    );

    expect(definitions.length).toBeGreaterThan(0);
  });
});
