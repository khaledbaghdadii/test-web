import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Matchers, Pact } from "@pact-foundation/pact";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import { BuildAndTestUserInputService } from "../../build-and-test/build-and-test-user-input/build-and-test-user-input.service";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";

describe("Build and test user input service contract tests", () => {
  const provider = new Pact({
    consumer: "web-bp",
    provider: "business-process-execution-service",
  });

  let appConfig: AppConfig;
  let userInputService: BuildAndTestUserInputService;

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
        BuildAndTestUserInputService,
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    userInputService = TestBed.inject(BuildAndTestUserInputService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("sends changes for review with v2 on-demand backport inputs", async () => {
    await provider.addInteraction({
      state:
        "a ci process exists and can send changes for review with backport",
      uponReceiving:
        "a request to send CI changes for review with on-demand backport inputs from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string("VAL-1"),
          mergeConfigurationId: Matchers.string("mergeConfigId"),
          mergeJobReviewers: Matchers.eachLike(Matchers.string("reviewer")),
          backportChanges: true,
          backportInputs: Matchers.eachLike({
            definitionId: Matchers.string("definitionId"),
            repositoryId: Matchers.string("repositoryId"),
            mergeConfigurationId: Matchers.string("backportMergeConfigId"),
            buildAndTestInfraGroupId: Matchers.string("infraGroup"),
          }),
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string("developmentId"),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: { status: 204 },
    });

    const result = await lastValueFrom(
      userInputService.sendChangesForReview({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeJobTitle: "VAL-1",
        mergeConfigurationId: "mergeConfigId",
        mergeJobReviewers: ["reviewer"],
        backportChanges: true,
        backportInputs: [
          {
            definitionId: "definitionId",
            repositoryId: "repositoryId",
            mergeConfigurationId: "backportMergeConfigId",
            buildAndTestInfraGroupId: "infraGroup",
          },
        ],
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
        supportsResourceManagement: true,
      })
    );

    expect(result).toBeFalsy();
  });

  test("sends changes for review without backport", async () => {
    await provider.addInteraction({
      state:
        "a ci process exists and can send changes for review without backport",
      uponReceiving:
        "a request to send CI changes for review without backport from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/send-changes-for-review`,
        method: "POST",
        body: {
          mergeJobTitle: Matchers.string("VAL-1"),
          mergeConfigurationId: Matchers.string("mergeConfigId"),
          mergeJobReviewers: Matchers.eachLike(Matchers.string("reviewer")),
          backportChanges: false,
          backportInputs: [],
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string("developmentId"),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: { status: 204 },
    });

    const result = await lastValueFrom(
      userInputService.sendChangesForReview({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeJobTitle: "VAL-1",
        mergeConfigurationId: "mergeConfigId",
        mergeJobReviewers: ["reviewer"],
        backportChanges: false,
        backportInputs: [],
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
        supportsResourceManagement: true,
      })
    );

    expect(result).toBeFalsy();
  });

  test("proceeds with predefined inputs", async () => {
    await provider.addInteraction({
      state:
        "a ci process exists and waiting for a user to proceed with predefined inputs",
      uponReceiving: "a request to proceed-with-predefined-inputs from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/proceed-with-predefined-inputs`,
        method: "POST",
        body: {
          shouldCleanDevelopment: Matchers.boolean(),
          developmentId: Matchers.string("developmentId"),
          supportsResourceManagement: Matchers.boolean(),
        },
      },
      willRespondWith: { status: 204 },
    });

    const result = await lastValueFrom(
      userInputService.proceedWithPredefinedInputs({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
        supportsResourceManagement: true,
      })
    );

    expect(result).toBeFalsy();
  });

  test("reopens merge request", async () => {
    await provider.addInteraction({
      state: "a ci process accepts reopen-merge-request",
      uponReceiving: "a request to reopen-merge-request from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/reopen-merge-request`,
        method: "POST",
        body: {},
      },
      willRespondWith: { status: 200 },
    });

    const result = await lastValueFrom(
      userInputService.reopenMergeRequest({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
      })
    );

    expect(result).toBeFalsy();
  });

  test("fixes integration issues", async () => {
    await provider.addInteraction({
      state: "a ci process accepts fix-integration-issues",
      uponReceiving: "a request to fix-integration-issues from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/fix-integration-issues`,
        method: "POST",
      },
      willRespondWith: { status: 204 },
    });

    const result = await lastValueFrom(
      userInputService.fixIntegrationIssues(PROJECT_ID, PROCESS_ID)
    );

    expect(result).toBeFalsy();
  });

  test("marks commits as cherry picked", async () => {
    await provider.addInteraction({
      state: "a ci process accepts commits-cherry-picked",
      uponReceiving: "a request to commits-cherry-picked from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/commits-cherry-picked`,
        method: "POST",
        body: {
          mergeConfigurationId: Matchers.string("mergeConfigId"),
        },
      },
      willRespondWith: { status: 204 },
    });

    const result = await lastValueFrom(
      userInputService.commitsCherryPicked({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeConfigurationId: "mergeConfigId",
      })
    );

    expect(result).toBeFalsy();
  });

  test("repushes backport merge job", async () => {
    await provider.addInteraction({
      state: "a ci process accepts repush-backport-merge-job",
      uponReceiving: "a request to repush-backport-merge-job from web-bp",
      withRequest: {
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/${PROCESS_ID}/user-input/repush-backport-merge-job`,
        method: "POST",
        body: {
          mergeConfigurationId: Matchers.string("mergeConfigId"),
        },
      },
      willRespondWith: { status: 204 },
    });

    const result = await lastValueFrom(
      userInputService.repushBackportMergeRequest({
        projectId: PROJECT_ID,
        processId: PROCESS_ID,
        mergeConfigurationId: "mergeConfigId",
      })
    );

    expect(result).toBeFalsy();
  });
});
