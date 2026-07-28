import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { ProjectUsersService } from "./project-users.service";

const PROJECT_ID = "project-id";
const SEARCH_KEY = "alice";

describe("ProjectUsersService contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "user-management-service",
  });

  let appConfig: { gatewayUrl: string };

  beforeAll(async () => {
    await provider.setup();
    appConfig = { gatewayUrl: `http://127.0.0.1:${provider.opts.port}/` };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ProjectUsersService,
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

  test("fetches paginated project users with a search key", async () => {
    await provider.addInteraction({
      state: "can get users with search key filter",
      uponReceiving:
        "a request to fetch paginated project users with a search key",
      withRequest: {
        method: "GET",
        path: `/user-management/projects/${PROJECT_ID}/users`,
        query: {
          searchKey: SEARCH_KEY,
          page: "1",
          size: "10",
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          content: Matchers.eachLike({
            id: Matchers.string(),
            displayName: Matchers.string(),
            mail: Matchers.string(),
          }),
          last: Matchers.boolean(),
        },
      },
    });

    const service = TestBed.inject(ProjectUsersService);
    const response = await lastValueFrom(
      service.getProjectUsers({
        projectId: PROJECT_ID,
        pageIndex: 1,
        pageSize: 10,
        searchKey: SEARCH_KEY,
      })
    );

    expect(response.content).toBeDefined();
  });
});
