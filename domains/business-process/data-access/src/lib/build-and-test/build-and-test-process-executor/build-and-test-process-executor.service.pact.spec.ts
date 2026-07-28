import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { ExecuteBuildAndTestProcessRequest } from "./execute-build-and-test-process-request";
import { BuildAndTestProcessExecutorService } from "./build-and-test-process-executor.service";

const PROJECT_ID = "project-id";

describe("BuildAndTestProcessExecutorService contract tests", () => {
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
        BuildAndTestProcessExecutorService,
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

  test("executes a build and test process with notification recipients", async () => {
    await provider.addInteraction({
      state: "executing a build & test process with notifications recipients",
      uponReceiving:
        "a request to execute a build and test process with notification recipients",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/ci-process`,
        headers: { "Content-Type": "application/json" },
        body: {
          name: Matchers.string(),
          definitionId: Matchers.string(),
          repositoryId: Matchers.string(),
          configurationBranchName: Matchers.string(),
          configurationParentBranch: Matchers.string(),
          userStoryIds: Matchers.eachLike(Matchers.string()),
          buildEnvironmentInfraGroup: Matchers.string(),
          buildAndTestInfraGroup: Matchers.string(),
          notificationsRecipients: Matchers.eachLike(Matchers.string()),
          skipPrepareBuildEnvironment: false,
        },
      },
      willRespondWith: {
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: { id: Matchers.string() },
      },
    });

    const request: ExecuteBuildAndTestProcessRequest = {
      name: "Build and test process",
      definitionId: "definition-id",
      repositoryId: "repository-id",
      configurationBranchName: "configuration-branch",
      configurationParentBranch: "configuration-parent-branch",
      userStoryIds: ["VAL-1"],
      buildEnvironmentInfraGroup: "build-environment-group",
      buildAndTestInfraGroup: "build-and-test-group",
      notificationsRecipients: ["user@example.com"],
      skipPrepareBuildEnvironment: false,
    };

    const service = TestBed.inject(BuildAndTestProcessExecutorService);
    const response = await lastValueFrom(
      service.executeBuildAndTestProcessDefinition(PROJECT_ID, request)
    );

    expect(response.id).toBeDefined();
  });
});
