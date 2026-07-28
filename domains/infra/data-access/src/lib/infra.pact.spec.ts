import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { InfraGroupService } from "./infra-group.service";

const PROJECT_ID = "projectId";
const GROUP_ID = "groupId";

describe("InfraGroupService contract tests", () => {
  const provider = new Pact({
    consumer: "web-infra",
    provider: "infra-management-service",
  });

  let appConfig: AppConfig;
  let service: InfraGroupService;

  beforeAll(async () => {
    await provider.setup();
    const port = provider.opts.port;
    appConfig = {
      gatewayUrl: `http://127.0.0.1:${port}/`,
    } as AppConfig;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        InfraGroupService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(InfraGroupService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("should fetch an infra group by id", async () => {
    await provider.addInteraction({
      state: "group exists",
      uponReceiving: "a request to get an infra group by id",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/infra/registry/groups/${GROUP_ID}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          id: Matchers.string(GROUP_ID),
          name: Matchers.string("group-name"),
        },
      },
    });

    const group = await lastValueFrom(service.getGroup(PROJECT_ID, GROUP_ID));

    expect(group).not.toBeNull();
    expect(group.id).toBeTruthy();
    expect(group.name).toBeTruthy();
  });

  test("should fetch paginated infra groups", async () => {
    await provider.addInteraction({
      state: "groups exist",
      uponReceiving: "a request to get paginated infra groups",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/infra/registry/groups`,
        query: { page: "0", size: "20" },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          content: Matchers.eachLike({
            id: Matchers.string(GROUP_ID),
            projectId: Matchers.string(PROJECT_ID),
            name: Matchers.string("group-name"),
          }),
          totalPages: Matchers.integer(1),
          totalElements: Matchers.integer(1),
          size: Matchers.integer(20),
          number: Matchers.integer(0),
          last: Matchers.boolean(true),
        },
      },
    });

    const response = await lastValueFrom(service.getGroups(PROJECT_ID, 20, 0));

    expect(response.content).toBeDefined();
  });

  test("should filter infra groups", async () => {
    await provider.addInteraction({
      state: "can filter groups with all fields",
      uponReceiving: "a request to filter infra groups",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/infra/registry/groups/filter`,
        query: { page: "0", size: "20", sort: "name" },
        headers: { "Content-Type": "application/json" },
        body: {
          searchKey: Matchers.string(),
          groupIds: Matchers.eachLike(Matchers.string()),
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          content: Matchers.eachLike({
            id: Matchers.string(GROUP_ID),
            projectId: Matchers.string(PROJECT_ID),
            name: Matchers.string("group-name"),
          }),
          totalPages: Matchers.integer(1),
          totalElements: Matchers.integer(1),
          size: Matchers.integer(20),
          number: Matchers.integer(0),
          last: Matchers.boolean(true),
        },
      },
    });

    const response = await lastValueFrom(
      service.searchGroups(PROJECT_ID, 20, 0, {
        searchKey: "build",
        groupIds: [GROUP_ID],
      })
    );

    expect(response.content).toBeDefined();
  });

  test("should get the project infra registry configuration", async () => {
    await provider.addInteraction({
      state: "can get project infra config",
      uponReceiving: "a request to get a project infra registry configuration",
      withRequest: {
        method: "GET",
        path: `/projects/${PROJECT_ID}/infra/registry/config`,
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          projectId: Matchers.string(PROJECT_ID),
          defaultInfraPlugin: Matchers.string("murex"),
          defaultAllocationRetryDelay: Matchers.integer(60),
          defaultGroup: {
            id: Matchers.string(GROUP_ID),
            name: Matchers.string("group-name"),
            projectId: Matchers.string(PROJECT_ID),
          },
        },
      },
    });

    const response = await lastValueFrom(
      service.getProjectInfraRegistryConfig(PROJECT_ID)
    );

    expect(response.id).toBeDefined();
  });
});
