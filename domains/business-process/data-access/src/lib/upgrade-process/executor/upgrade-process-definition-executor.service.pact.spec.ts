import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { Matchers, Pact } from "@pact-foundation/pact";
import { lastValueFrom } from "rxjs";
import { ExecuteUpgradeProcessDefinitionRequest } from "./execute-upgrade-process-definition-request";
import { UpgradeProcessDefinitionExecutorService } from "./upgrade-process-definition-executor.service";

const PROJECT_ID = "project-id";

describe("UpgradeProcessDefinitionExecutorService contract tests", () => {
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
        UpgradeProcessDefinitionExecutorService,
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

  test("executes an upgrade process with optional inputs", async () => {
    await provider.addInteraction({
      state: "executing an upgrade process with optional inputs",
      uponReceiving:
        "a request to execute an upgrade process with optional inputs",
      withRequest: {
        method: "POST",
        path: `/projects/${PROJECT_ID}/business-process/executions/binary-upgrade/execute`,
        headers: { "Content-Type": "application/json" },
        body: {
          name: Matchers.string(),
          definitionId: Matchers.string(),
          official: Matchers.boolean(),
          notificationsRecipients: Matchers.eachLike(Matchers.string()),
          mxParameters: {
            parentMxArchivalBranch: Matchers.string(),
            upgradeJump: Matchers.string(),
            conversionFactoryProduct: {
              id: Matchers.string(),
              mxVersion: Matchers.string(),
              mxBuildId: Matchers.string(),
              bipVersion: Matchers.string(),
              bipBuildId: Matchers.string(),
            },
          },
          configurationParameters: {
            repositoryId: Matchers.string(),
            createBranch: Matchers.boolean(),
            configurationBranchName: Matchers.string(),
            configurationParentBranchName: Matchers.string(),
            businessProcessQualityLevel: Matchers.term({
              generate: "MQG",
              matcher: "MQG|DQG",
            }),
          },
          infrastructureParameters: {
            qualityGateExecutionInfraGroupId: Matchers.string(),
            binaryConversionInfraGroupId: Matchers.string(),
          },
          testParameters: {
            binaryConversionScenarioDefinitionId: Matchers.string(),
            qualityGateScenarioDefinitionIds: Matchers.eachLike(
              Matchers.string()
            ),
          },
          referenceEnvironmentParameters: {
            referenceCommitId: Matchers.string(),
            referenceFactoryProduct: {
              id: Matchers.string(),
              mxVersion: Matchers.string(),
              mxBuildId: Matchers.string(),
              bipVersion: Matchers.string(),
              bipBuildId: Matchers.string(),
            },
            referenceEnvironmentDefinitionId: Matchers.string(),
            referenceEnvironmentInfraGroupId: Matchers.string(),
          },
        },
      },
      willRespondWith: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { id: Matchers.string() },
      },
    });

    const request: ExecuteUpgradeProcessDefinitionRequest = {
      projectId: PROJECT_ID,
      name: "Upgrade process",
      definitionId: "definition-id",
      official: true,
      notificationsRecipients: ["user@example.com"],
      mxParameters: {
        parentMxArchivalBranch: "archival-branch",
        upgradeJump: "MINOR",
        conversionFactoryProduct: {
          id: "conversion-product-id",
          mxVersion: "mx-version",
          mxBuildId: "mx-build-id",
          bipVersion: "bip-version",
          bipBuildId: "bip-build-id",
        },
      },
      configurationParameters: {
        repositoryId: "repository-id",
        createBranch: true,
        configurationBranchName: "configuration-branch",
        configurationParentBranchName: "parent-branch",
        businessProcessQualityLevel: "MQG",
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId: "quality-gate-infra-group-id",
        binaryConversionInfraGroupId: "binary-conversion-infra-group-id",
      },
      testParameters: {
        binaryConversionScenarioDefinitionId: "binary-conversion-scenario-id",
        qualityGateScenarioDefinitionIds: ["quality-gate-scenario-id"],
      },
      referenceEnvironmentParameters: {
        referenceCommitId: "reference-commit-id",
        referenceFactoryProduct: {
          id: "reference-product-id",
          mxVersion: "reference-mx-version",
          mxBuildId: "reference-mx-build-id",
          bipVersion: "reference-bip-version",
          bipBuildId: "reference-bip-build-id",
        },
        referenceEnvironmentDefinitionId: "reference-environment-definition-id",
        referenceEnvironmentInfraGroupId: "reference-infra-group-id",
      },
    };

    const service = TestBed.inject(UpgradeProcessDefinitionExecutorService);
    const response = await lastValueFrom(
      service.executeUpgradeProcessDefinition(request)
    );

    expect(response.upgradeProcessExecutionId).toBeDefined();
  });
});
