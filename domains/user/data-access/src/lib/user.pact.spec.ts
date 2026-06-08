import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { UserService } from "./user/user.service";

function getUserBodyMatcher() {
  return {
    id: Matchers.string("user-1"),
    displayName: Matchers.string("Alice Smith"),
    mail: Matchers.string("alice@example.com"),
  };
}

describe("user service contract tests", () => {
  const provider = new Pact({
    consumer: "web-user",
    provider: "project-definition-service",
  });

  let service: UserService;

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
        UserService,
      ],
    });
    service = TestBed.inject(UserService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  describe("fetchByIds", () => {
    test("validates contract for fetching a user by ID", async () => {
      await provider.addInteraction({
        state: "a user exists",
        uponReceiving: "a request to fetch a user by ID",
        withRequest: {
          method: "GET",
          path: "/projects/project-1/users/user-1",
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: getUserBodyMatcher(),
        },
      });

      const result = await lastValueFrom(
        service.fetchByIds("project-1", ["user-1"])
      );

      expect(result).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBeTruthy();
      expect(result[0].displayName).toBeTruthy();
      expect(result[0].mail).toBeTruthy();
    });
  });
});
