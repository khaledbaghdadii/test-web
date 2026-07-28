import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { ValidateUserStoryService } from "./validate-user-story.service";

const PROJECT_ID = "project-id";

describe("ValidateUserStoryService contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
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
        ValidateUserStoryService,
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

  test("validates a user story for a CI process", async () => {
    await provider.addInteraction({
      state: "validating user stories for ci process",
      uponReceiving: "a request to validate a user story for a CI process",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/validate/user-story`,
        headers: { "Content-Type": "application/json" },
        body: { userStoryId: Matchers.string() },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          valid: Matchers.boolean(),
          errorMessage: null,
        },
      },
    });

    const service = TestBed.inject(ValidateUserStoryService);
    const response = await lastValueFrom(
      service.validateUserStory(PROJECT_ID, { userStoryId: "VAL-1" })
    );

    expect(response.valid).toBe(true);
  });
});
