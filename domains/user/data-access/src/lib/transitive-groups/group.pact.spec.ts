import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { GroupService } from "./group.service";

describe("groups service contract tests", () => {
  const provider = new Pact({
    consumer: "web-user",
    provider: "user-management-service",
  });

  let service: GroupService;

  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: GATEWAY_CONFIG,
          useValue: {
            gatewayUrl: `http://127.0.0.1:${provider.opts.port}/`,
          },
        },
        GroupService,
      ],
    });
    service = TestBed.inject(GroupService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  test("contract for fetching current user transitive groups", async () => {
    await provider.addInteraction({
      state: "user has transitive groups",
      uponReceiving: "a request for current user transitive groups",
      withRequest: {
        method: "GET",
        path: "/user-management/current-user/transitive-groups",
        query: { page: "0", size: "100" },
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          content: Matchers.eachLike({
            id: Matchers.string("group-id"),
            name: Matchers.string("Group Name"),
          }),
          last: Matchers.boolean(true),
        },
      },
    });

    const result = await lastValueFrom(service.getTransitiveGroups());

    expect(result).not.toBeNull();
    expect(result.content.length).toBeGreaterThanOrEqual(1);
    expect(result.content[0].id).toBeTruthy();
    expect(result.content[0].name).toBeTruthy();
    expect(result.last).toBeDefined();
  });
});
