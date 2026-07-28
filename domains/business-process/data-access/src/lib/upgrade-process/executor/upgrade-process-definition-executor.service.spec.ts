import { lastValueFrom, of, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { TestBed } from "@angular/core/testing";
import { v4 as uuidv4 } from "uuid";
import { UpgradeProcessDefinitionExecutorService } from "./upgrade-process-definition-executor.service";
import { ExecuteUpgradeProcessDefinitionRequest } from "./execute-upgrade-process-definition-request";
import { ExecuteUpgradeProcessDefinitionApiRequest } from "./execute-upgrade-process-definition-api-request";

describe("Upgrade process definition executor service test", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const definitionId = uuidv4();
  const name = uuidv4();
  const upgradeExecutionId = uuidv4();
  const errorMessage = uuidv4();

  let httpClient: HttpClient;
  let environmentProvider: AppConfig;
  let service: UpgradeProcessDefinitionExecutorService;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(() => of({ id: upgradeExecutionId })),
    } as unknown as HttpClient;

    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpClient },
        { provide: GATEWAY_CONFIG, useValue: environmentProvider },
        UpgradeProcessDefinitionExecutorService,
      ],
    });

    service = TestBed.inject(UpgradeProcessDefinitionExecutorService);
  });

  it("posts the mapped api request to the binary-upgrade execute endpoint and returns the execution id", async () => {
    const response = await lastValueFrom(
      service.executeUpgradeProcessDefinition(getRequest())
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      `${gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/execute`,
      getApiRequest()
    );
    expect(response).toStrictEqual({
      upgradeProcessExecutionId: upgradeExecutionId,
    });
  });

  it("throws the mapped error message in case of failure", async () => {
    jest.spyOn(httpClient, "post").mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(service.executeUpgradeProcessDefinition(getRequest()))
    ).rejects.toThrow(errorMessage);
  });

  function getRequest(): ExecuteUpgradeProcessDefinitionRequest {
    return {
      projectId: projectId,
      name: name,
      definitionId: definitionId,
      official: true,
      notificationsRecipients: ["user@example.com"],
      mxParameters: {
        parentMxArchivalBranch: "Archival-000001",
        upgradeJump: "MINOR",
        conversionFactoryProduct: {
          id: "fp-1",
          mxVersion: "mx-1",
          mxBuildId: "build-1",
          bipVersion: "bip-1",
          bipBuildId: "bip-build-1",
        },
      },
      configurationParameters: {
        repositoryId: "repo-1",
        createBranch: false,
        configurationBranchName: "config-branch",
        configurationParentBranchName: "config-parent-branch",
        businessProcessQualityLevel: "MQG",
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId: "qg-infra",
        binaryConversionInfraGroupId: "bc-infra",
      },
      testParameters: {
        binaryConversionScenarioDefinitionId: "bc-scenario",
        qualityGateScenarioDefinitionIds: ["qg-scenario-1", "qg-scenario-2"],
      },
      referenceEnvironmentParameters: {
        referenceCommitId: "ref-commit",
        referenceFactoryProduct: {
          id: "ref-fp-1",
          mxVersion: "ref-mx-1",
          mxBuildId: "ref-build-1",
          bipVersion: "ref-bip-1",
          bipBuildId: "ref-bip-build-1",
        },
        referenceEnvironmentDefinitionId: "ref-env-def",
        referenceEnvironmentInfraGroupId: "ref-infra",
      },
    };
  }

  function getApiRequest(): ExecuteUpgradeProcessDefinitionApiRequest {
    return {
      name: name,
      definitionId: definitionId,
      official: true,
      notificationsRecipients: ["user@example.com"],
      mxParameters: {
        parentMxArchivalBranch: "Archival-000001",
        upgradeJump: "MINOR",
        conversionFactoryProduct: {
          id: "fp-1",
          mxVersion: "mx-1",
          mxBuildId: "build-1",
          bipVersion: "bip-1",
          bipBuildId: "bip-build-1",
        },
      },
      configurationParameters: {
        repositoryId: "repo-1",
        createBranch: false,
        configurationBranchName: "config-branch",
        configurationParentBranchName: "config-parent-branch",
        businessProcessQualityLevel: "MQG",
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId: "qg-infra",
        binaryConversionInfraGroupId: "bc-infra",
      },
      testParameters: {
        binaryConversionScenarioDefinitionId: "bc-scenario",
        qualityGateScenarioDefinitionIds: ["qg-scenario-1", "qg-scenario-2"],
      },
      referenceEnvironmentParameters: {
        referenceCommitId: "ref-commit",
        referenceFactoryProduct: {
          id: "ref-fp-1",
          mxVersion: "ref-mx-1",
          mxBuildId: "ref-build-1",
          bipVersion: "ref-bip-1",
          bipBuildId: "ref-bip-build-1",
        },
        referenceEnvironmentDefinitionId: "ref-env-def",
        referenceEnvironmentInfraGroupId: "ref-infra",
      },
    };
  }
});
