import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { ExecuteValidationProcessRequest } from "./execute-validation-process-request";
import { ValidationProcessExecutorService } from "./validation-process-executor.service";

const PROJECT_ID = "project-id";

describe("ValidationProcessExecutorService contract tests", () => {
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
        ValidationProcessExecutorService,
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

  test("executes a validation process with notification recipients", async () => {
    await provider.addInteraction({
      state: "executing a validation process with notifications recipients",
      uponReceiving:
        "a request to execute a validation process with notification recipients",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/master-validation/execute`,
        headers: { "Content-Type": "application/json" },
        body: {
          name: Matchers.string(),
          definitionId: Matchers.string(),
          official: Matchers.boolean(),
          notificationsRecipients: Matchers.eachLike(Matchers.string()),
          configurationParameters: {
            businessProcessQualityLevel: "MQG",
            repositoryId: Matchers.string(),
            parentBranchName: Matchers.string(),
            archivalBranchName: Matchers.string(),
            createBranch: Matchers.boolean(),
            configCommitId: Matchers.string(),
            rtpCommitId: Matchers.string(),
            finalProductId: Matchers.string(),
          },
          testParameters: {
            qualityGateScenarioDefinitionIds: Matchers.eachLike(
              Matchers.string()
            ),
            nightlyRepusherEnabled: Matchers.boolean(),
          },
          infrastructureParameters: {
            qualityGateInfraGroupId: Matchers.string(),
          },
          validationScopeParameters: {
            startCommitId: Matchers.string(),
          },
        },
      },
      willRespondWith: {
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: { id: Matchers.string() },
      },
    });

    const request: ExecuteValidationProcessRequest = {
      name: "Validation process",
      definitionId: "definition-id",
      official: true,
      notificationsRecipients: ["user@example.com"],
      configurationParameters: {
        businessProcessQualityLevel: "MQG",
        repositoryId: "repository-id",
        parentBranchName: "parent-branch",
        archivalBranchName: "archival-branch",
        createBranch: false,
        configCommitId: "configuration-commit",
        rtpCommitId: "rtp-commit",
        finalProductId: "final-product-id",
      },
      testParameters: {
        qualityGateScenarioDefinitionIds: ["quality-gate-scenario-id"],
        nightlyRepusherEnabled: false,
      },
      infrastructureParameters: { qualityGateInfraGroupId: "infra-group-id" },
      validationScopeParameters: { startCommitId: "start-commit-id" },
    };

    const service = TestBed.inject(ValidationProcessExecutorService);
    const response = await lastValueFrom(
      service.executeValidationProcessDefinition(PROJECT_ID, request)
    );

    expect(response.id).toBeDefined();
  });
});
