import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { lastValueFrom } from "rxjs";
import { UserService } from "./user/user.service";

const PROJECT_ID = "project-id";
const EMAILS = ["alice@example.com", "bob@example.com"];

/**
 * Contract test for `UserService.fetchUsersByEmails`, which hits a different
 * provider (`user-management-service`) than `user.pact.spec.ts`'s
 * `fetchByIds` (`project-definition-service`) — kept as a separate pact/file
 * per provider. Consolidated from business-process's
 * `ProjectUsersFetcherService` pact (VAL-27132 follow-up cleanup).
 */
describe("UserService.fetchUsersByEmails contract tests", () => {
  const provider = new Pact({
    consumer: "web-user",
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
        UserService,
        { provide: GATEWAY_CONFIG, useValue: appConfig },
      ],
    });
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("fetches users by email", async () => {
    await provider.addInteraction({
      state: "can get users with user emails filter",
      uponReceiving: "a request to fetch users by email",
      withRequest: {
        method: "GET",
        path: `/user-management/projects/${PROJECT_ID}/users`,
        query: { userEmails: EMAILS },
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
        },
      },
    });

    const service = TestBed.inject(UserService);
    const response = await lastValueFrom(
      service.fetchUsersByEmails(PROJECT_ID, EMAILS)
    );

    expect(response.content).toBeDefined();
  });
});
