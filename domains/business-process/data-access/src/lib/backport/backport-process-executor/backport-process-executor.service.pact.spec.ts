import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { BackportProcessExecutorService } from "./backport-process-executor.service";
import { ExecuteBackportProcessRequest } from "./execute-backport-process-request";

const PROJECT_ID = "project-id";

describe("BackportProcessExecutorService contract tests", () => {
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
        BackportProcessExecutorService,
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

  test("executes an on-demand backport process", async () => {
    await provider.addInteraction({
      state: "executing on demand backport process",
      uponReceiving: "a request to execute an on-demand backport process",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process/backport`,
        headers: { "Content-Type": "application/json" },
        body: {
          name: Matchers.string(),
          definitionId: Matchers.string(),
          repositoryId: Matchers.string(),
          destinationMergeConfigurationId: Matchers.string(),
          pullRequestToBeBackported: Matchers.string(),
          pullRequestTitle: Matchers.string(),
          pullRequestReviewers: Matchers.eachLike(Matchers.string()),
          userStoryIds: Matchers.eachLike(Matchers.string()),
          buildAndTestInfraGroup: Matchers.string(),
          notificationsRecipients: Matchers.eachLike(Matchers.string()),
        },
      },
      willRespondWith: {
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: { id: Matchers.string() },
      },
    });

    const request: ExecuteBackportProcessRequest = {
      name: "On-demand backport",
      definitionId: "definition-id",
      repositoryId: "repository-id",
      destinationMergeConfigurationId: "destination-merge-configuration-id",
      pullRequestToBeBackported: "123",
      pullRequestTitle: "Backport fix",
      pullRequestReviewers: ["reviewer@example.com"],
      userStoryIds: ["VAL-1"],
      buildAndTestInfraGroup: "build-and-test-infra-group-id",
      notificationsRecipients: ["user@example.com"],
    };

    const service = TestBed.inject(BackportProcessExecutorService);
    const response = await lastValueFrom(
      service.executeBackportProcessDefinition(PROJECT_ID, request)
    );

    expect(response.id).toBeDefined();
  });
});
