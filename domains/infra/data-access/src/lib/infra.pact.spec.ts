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
});
