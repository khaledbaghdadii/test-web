import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { catchError, lastValueFrom, of } from "rxjs";
import { APP_CONFIG } from "@mxflow/config";
import { SendChangesForReviewService } from "../../upgrade-process/send-changes-for-review.service";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";

describe("Send changes for review service contract tests", () => {
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
        SendChangesForReviewService,
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

  test("should send changes for review with reviewers", async () => {
    await provider.addInteraction({
      state: "ci process accepting sending changes for review with reviewers",
      uponReceiving:
        "a request to send changes for review with reviewers from web-bp",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/send-changes-for-review`,
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          mergeJobReviewers: Matchers.eachLike(Matchers.string()),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    const service = TestBed.inject(SendChangesForReviewService);

    await expect(
      lastValueFrom(
        service.sendChangesForReview({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeJobTitle: "Review Changes",
          mergeConfigurationId: "mergeConfig789",
          mergeJobReviewers: ["reviewer1", "reviewer2"],
          shouldCleanDevelopment: false,
          developmentId: "dev123",
          supportsResourceManagement: true,
        })
      )
    ).resolves.not.toThrow();
  });

  test("should send changes for review without reviewers", async () => {
    await provider.addInteraction({
      state:
        "ci process accepting sending changes for review without reviewers",
      uponReceiving:
        "a request to send changes for review without reviewers from web-bp",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/send-changes-for-review`,
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          shouldCleanDevelopment: Matchers.boolean(),
          mergeJobReviewers: [],
          developmentId: Matchers.string(),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    const service = TestBed.inject(SendChangesForReviewService);

    await expect(
      lastValueFrom(
        service.sendChangesForReview({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeJobTitle: "Review Changes",
          mergeConfigurationId: "mergeConfig789",
          mergeJobReviewers: [],
          shouldCleanDevelopment: false,
          developmentId: "dev123",
          supportsResourceManagement: true,
        })
      )
    ).resolves.not.toThrow();
  });

  test("should return an error when sending changes for review is not allowed", async () => {
    await provider.addInteraction({
      state:
        "upgrade process does not allow sending changes for review due to user intervention not being allowed",
      uponReceiving:
        "a request to send changes for review that is rejected from web-bp",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/${PROCESS_ID}/user-input/send-changes-for-review`,
        body: {
          mergeJobTitle: Matchers.string(),
          mergeConfigurationId: Matchers.string(),
          mergeJobReviewers: Matchers.eachLike(Matchers.string()),
          shouldCleanDevelopment: Matchers.boolean(),
          supportsResourceManagement: Matchers.boolean(),
          developmentId: Matchers.string(),
        },
      },
      willRespondWith: {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: Matchers.string(),
        },
      },
    });

    const service = TestBed.inject(SendChangesForReviewService);

    const errorMessage: string = await lastValueFrom(
      service
        .sendChangesForReview({
          projectId: PROJECT_ID,
          processId: PROCESS_ID,
          mergeJobTitle: "Review Changes",
          mergeConfigurationId: "mergeConfig789",
          mergeJobReviewers: ["reviewer1", "reviewer2"],
          shouldCleanDevelopment: false,
          supportsResourceManagement: true,
          developmentId: "dev123",
        })
        .pipe(catchError((error) => of(error.message)))
    );

    expect(errorMessage).toBeTruthy();
  });
});
