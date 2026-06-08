import { UpgradeProcessDefinitionExecutorService } from "./upgrade-process-definition-executor.service";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ExecuteUpgradeProcessDefinitionRequest } from "./execute-upgrade-process-definition-request";
import { v4 as uuidv4 } from "uuid";
import { lastValueFrom, of, throwError } from "rxjs";
import { ExecuteUpgradeProcessDefinitionApiResponse } from "./execute-upgrade-process-definition-api-response";
import { ExecuteUpgradeProcessDefinitionApiRequest } from "./execute-upgrade-process-definition-api-request";
import Mock = jest.Mock;
import { AppConfig } from "@mxflow/config";

describe("Upgrade process definition executor service test", () => {
  const gatewayUrl = uuidv4();
  const projectId = uuidv4();
  const name = uuidv4();
  const definitionId = uuidv4();
  const conversionFactoryProductId = uuidv4();
  const conversionMxVersion = uuidv4();
  const conversionMxBuildId = uuidv4();
  const conversionBipVersion = uuidv4();
  const conversionBipBuildId = uuidv4();
  const parentMxArchivalBranch = uuidv4();
  const repositoryId = uuidv4();
  const configurationBranchName = uuidv4();
  const configurationParentBranchName = uuidv4();
  const qualityGateExecutionInfraGroupId = uuidv4();
  const binaryConversionInfraGroupId = uuidv4();
  const binaryConversionScenarioDefinitionId = uuidv4();
  const qualityGateScenarioDefinitionIds = [uuidv4(), uuidv4()];
  const referenceCommitId = uuidv4();
  const referenceFactoryProductId = uuidv4();
  const referenceMxVersion = uuidv4();
  const referenceMxBuildId = uuidv4();
  const referenceBipVersion = uuidv4();
  const referenceBipBuildId = uuidv4();
  const referenceEnvironmentDefinitionId = uuidv4();
  const referenceEnvironmentInfraGroupId = uuidv4();
  const upgradeProcessExecutionId = uuidv4();
  const upgradeJump = uuidv4();
  const notificationsRecipients = [uuidv4(), uuidv4()];
  const businessProcessQualityLevel = uuidv4();

  let httpClient: HttpClient;
  let environmentProvider: AppConfig;
  let service: UpgradeProcessDefinitionExecutorService;

  let httpClientPostMock: Mock<any>;

  beforeEach(() => {
    httpClientPostMock = jest.fn(
      (url: string, request: ExecuteUpgradeProcessDefinitionApiRequest) => {
        expect(url).toBeDefined();
        expect(request).toBeDefined();
        return of(getExecuteUpgradeProcessApiResponse());
      }
    );

    httpClient = {
      post: httpClientPostMock,
    } as unknown as HttpClient;

    environmentProvider = {
      gatewayUrl: gatewayUrl,
    } as unknown as AppConfig;

    service = new UpgradeProcessDefinitionExecutorService(
      environmentProvider,
      httpClient
    );
  });

  it("should execute the upgrade definition using the correct url", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const url: string = httpClientPostMock.mock.calls[0][0];
    expect(url).toStrictEqual(
      `${gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/execute`
    );
  });

  it("should execute the upgrade definition using the correct name", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.name).toStrictEqual(name);
  });

  it("should execute the upgrade definition using the correct definition id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.definitionId).toStrictEqual(definitionId);
  });

  it("should execute the upgrade definition using the correct official flag", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.official).toStrictEqual(true);
  });

  it("should execute the upgrade definition using the correct parent MX archival branch", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.mxParameters.parentMxArchivalBranch).toStrictEqual(
      parentMxArchivalBranch
    );
  });

  it("should execute the upgrade definition using the correct upgrade jump", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.mxParameters.upgradeJump).toStrictEqual(upgradeJump);
  });

  it("should execute the upgrade definition using the correct conversion factory product id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.mxParameters.conversionFactoryProduct.id).toStrictEqual(
      conversionFactoryProductId
    );
  });

  it("should execute the upgrade definition using the correct conversion factory product mxVersion", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.mxParameters.conversionFactoryProduct.mxVersion
    ).toStrictEqual(conversionMxVersion);
  });

  it("should execute the upgrade definition using the correct conversion factory product mxBuildId", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.mxParameters.conversionFactoryProduct.mxBuildId
    ).toStrictEqual(conversionMxBuildId);
  });

  it("should execute the upgrade definition using the correct conversion factory product bipVersion", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.mxParameters.conversionFactoryProduct.bipVersion
    ).toStrictEqual(conversionBipVersion);
  });

  it("should execute the upgrade definition using the correct conversion factory product bipBuildId", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.mxParameters.conversionFactoryProduct.bipBuildId
    ).toStrictEqual(conversionBipBuildId);
  });

  it("should execute the upgrade definition using the correct repository id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.configurationParameters.repositoryId).toStrictEqual(
      repositoryId
    );
  });

  it("should execute the upgrade definition using the correct configuration branch name", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.configurationParameters.configurationBranchName
    ).toStrictEqual(configurationBranchName);
  });

  it("should execute the upgrade definition using the correct configuration parent branch name", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.configurationParameters.configurationParentBranchName
    ).toStrictEqual(configurationParentBranchName);
  });

  it("should execute the upgrade definition using the correct business process quality level", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.configurationParameters.businessProcessQualityLevel
    ).toStrictEqual(businessProcessQualityLevel);
  });

  it("should execute the upgrade definition using the correct quality gate execution infra group id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.infrastructureParameters.qualityGateExecutionInfraGroupId
    ).toStrictEqual(qualityGateExecutionInfraGroupId);
  });

  it("should execute the upgrade definition using the correct binary conversion infra group id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.infrastructureParameters.binaryConversionInfraGroupId
    ).toStrictEqual(binaryConversionInfraGroupId);
  });

  it("should execute the upgrade definition using the correct binary conversion scenario definition id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.testParameters.binaryConversionScenarioDefinitionId
    ).toStrictEqual(binaryConversionScenarioDefinitionId);
  });

  it("should execute the upgrade definition using the correct quality gate scenario definition ids", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.testParameters.qualityGateScenarioDefinitionIds
    ).toStrictEqual(qualityGateScenarioDefinitionIds);
  });

  it("should execute the upgrade definition using the correct reference commit id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceCommitId
    ).toStrictEqual(referenceCommitId);
  });

  it("should execute the upgrade definition using the correct reference factory product id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceFactoryProduct.id
    ).toStrictEqual(referenceFactoryProductId);
  });

  it("should execute the upgrade definition using the correct reference factory product mxVersion", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceFactoryProduct.mxVersion
    ).toStrictEqual(referenceMxVersion);
  });

  it("should execute the upgrade definition using the correct reference factory product mxBuildId", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceFactoryProduct.mxBuildId
    ).toStrictEqual(referenceMxBuildId);
  });

  it("should execute the upgrade definition using the correct reference factory product bipVersion", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceFactoryProduct.bipVersion
    ).toStrictEqual(referenceBipVersion);
  });

  it("should execute the upgrade definition using the correct reference factory product bipBuildId", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceFactoryProduct.bipBuildId
    ).toStrictEqual(referenceBipBuildId);
  });

  it("should execute the upgrade definition using the correct reference environment definition id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceEnvironmentDefinitionId
    ).toStrictEqual(referenceEnvironmentDefinitionId);
  });

  it("should execute the upgrade definition using the correct reference environment infra group id", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );

    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(
      request.referenceEnvironmentParameters.referenceEnvironmentInfraGroupId
    ).toStrictEqual(referenceEnvironmentInfraGroupId);
  });

  it("should execute the upgrade definition using the specified notifications recipients by the user", () => {
    service.executeUpgradeProcessDefinition(
      getExecuteUpgradeDefinitionRequest()
    );
    const request: ExecuteUpgradeProcessDefinitionApiRequest =
      httpClientPostMock.mock.calls[0][1];
    expect(request.notificationsRecipients).toStrictEqual(
      notificationsRecipients
    );
  });

  it("should return the upgrade process execution id", async () => {
    const executeUpgradeProcessDefinitionResponse = await lastValueFrom(
      service.executeUpgradeProcessDefinition(
        getExecuteUpgradeDefinitionRequest()
      )
    );

    expect(
      executeUpgradeProcessDefinitionResponse.upgradeProcessExecutionId
    ).toStrictEqual(upgradeProcessExecutionId);
  });

  it("should throw error message in case of failing of executing an upgrade process", async () => {
    const expectedErrorMessage = "errorMessage";
    jest.spyOn(httpClient, "post").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: expectedErrorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        service.executeUpgradeProcessDefinition(
          getExecuteUpgradeDefinitionRequest()
        )
      )
    ).rejects.toThrow(expectedErrorMessage);
  });

  function getExecuteUpgradeDefinitionRequest(): ExecuteUpgradeProcessDefinitionRequest {
    return {
      projectId: projectId,
      name: name,
      definitionId: definitionId,
      official: true,
      notificationsRecipients,
      mxParameters: {
        parentMxArchivalBranch: parentMxArchivalBranch,
        upgradeJump: upgradeJump,
        conversionFactoryProduct: {
          id: conversionFactoryProductId,
          mxVersion: conversionMxVersion,
          mxBuildId: conversionMxBuildId,
          bipVersion: conversionBipVersion,
          bipBuildId: conversionBipBuildId,
        },
      },
      configurationParameters: {
        repositoryId: repositoryId,
        createBranch: true,
        configurationBranchName: configurationBranchName,
        configurationParentBranchName: configurationParentBranchName,
        businessProcessQualityLevel: businessProcessQualityLevel,
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId: qualityGateExecutionInfraGroupId,
        binaryConversionInfraGroupId: binaryConversionInfraGroupId,
      },
      testParameters: {
        binaryConversionScenarioDefinitionId:
          binaryConversionScenarioDefinitionId,
        qualityGateScenarioDefinitionIds: qualityGateScenarioDefinitionIds,
      },
      referenceEnvironmentParameters: {
        referenceCommitId: referenceCommitId,
        referenceFactoryProduct: {
          id: referenceFactoryProductId,
          mxVersion: referenceMxVersion,
          mxBuildId: referenceMxBuildId,
          bipVersion: referenceBipVersion,
          bipBuildId: referenceBipBuildId,
        },
        referenceEnvironmentDefinitionId: referenceEnvironmentDefinitionId,
        referenceEnvironmentInfraGroupId: referenceEnvironmentInfraGroupId,
      },
    };
  }

  function getExecuteUpgradeProcessApiResponse(): ExecuteUpgradeProcessDefinitionApiResponse {
    return {
      id: upgradeProcessExecutionId,
    };
  }
});
