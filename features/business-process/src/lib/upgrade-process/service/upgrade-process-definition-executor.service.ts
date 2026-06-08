import { Inject, Injectable } from "@angular/core";
import { ExecuteUpgradeProcessDefinitionRequest } from "./execute-upgrade-process-definition-request";
import { catchError, map, Observable, throwError } from "rxjs";
import { ExecuteUpgradeProcessDefinitionResponse } from "./execute-upgrade-process-definition-response";
import { HttpClient } from "@angular/common/http";
import { ExecuteUpgradeProcessDefinitionApiResponse } from "./execute-upgrade-process-definition-api-response";
import { ExecuteUpgradeProcessDefinitionApiRequest } from "./execute-upgrade-process-definition-api-request";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { handleError } from "../../../../../../core/error-handler/src/lib/error-utils";

@Injectable()
export class UpgradeProcessDefinitionExecutorService {
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private httpClient: HttpClient
  ) {}

  executeUpgradeProcessDefinition(
    request: ExecuteUpgradeProcessDefinitionRequest
  ): Observable<ExecuteUpgradeProcessDefinitionResponse> {
    return this.httpClient
      .post<ExecuteUpgradeProcessDefinitionApiResponse>(
        this.getApiUrl(request.projectId),
        this.mapRequest(request)
      )
      .pipe(
        map((response: ExecuteUpgradeProcessDefinitionApiResponse) =>
          this.mapResponse(response)
        ),
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/execute`;
  }

  private mapRequest(
    request: ExecuteUpgradeProcessDefinitionRequest
  ): ExecuteUpgradeProcessDefinitionApiRequest {
    return {
      name: request.name,
      definitionId: request.definitionId,
      official: request.official,
      notificationsRecipients: request.notificationsRecipients,
      mxParameters: {
        parentMxArchivalBranch: request.mxParameters.parentMxArchivalBranch,
        upgradeJump: request.mxParameters.upgradeJump,
        conversionFactoryProduct: {
          id: request.mxParameters.conversionFactoryProduct.id,
          mxVersion: request.mxParameters.conversionFactoryProduct.mxVersion,
          mxBuildId: request.mxParameters.conversionFactoryProduct.mxBuildId,
          bipVersion: request.mxParameters.conversionFactoryProduct.bipVersion,
          bipBuildId: request.mxParameters.conversionFactoryProduct.bipBuildId,
        },
      },
      configurationParameters: {
        repositoryId: request.configurationParameters.repositoryId,
        createBranch: request.configurationParameters.createBranch,
        configurationBranchName:
          request.configurationParameters.configurationBranchName,
        configurationParentBranchName:
          request.configurationParameters.configurationParentBranchName,
        businessProcessQualityLevel:
          request.configurationParameters.businessProcessQualityLevel,
      },
      infrastructureParameters: {
        qualityGateExecutionInfraGroupId:
          request.infrastructureParameters.qualityGateExecutionInfraGroupId,
        binaryConversionInfraGroupId:
          request.infrastructureParameters.binaryConversionInfraGroupId,
      },
      testParameters: {
        binaryConversionScenarioDefinitionId:
          request.testParameters.binaryConversionScenarioDefinitionId,
        qualityGateScenarioDefinitionIds:
          request.testParameters.qualityGateScenarioDefinitionIds,
      },
      referenceEnvironmentParameters: {
        referenceCommitId:
          request.referenceEnvironmentParameters.referenceCommitId,
        referenceFactoryProduct: {
          id: request.referenceEnvironmentParameters.referenceFactoryProduct.id,
          mxVersion:
            request.referenceEnvironmentParameters.referenceFactoryProduct
              .mxVersion,
          mxBuildId:
            request.referenceEnvironmentParameters.referenceFactoryProduct
              .mxBuildId,
          bipVersion:
            request.referenceEnvironmentParameters.referenceFactoryProduct
              .bipVersion,
          bipBuildId:
            request.referenceEnvironmentParameters.referenceFactoryProduct
              .bipBuildId,
        },
        referenceEnvironmentDefinitionId:
          request.referenceEnvironmentParameters
            .referenceEnvironmentDefinitionId,
        referenceEnvironmentInfraGroupId:
          request.referenceEnvironmentParameters
            .referenceEnvironmentInfraGroupId,
      },
    };
  }

  private mapResponse(
    response: ExecuteUpgradeProcessDefinitionApiResponse
  ): ExecuteUpgradeProcessDefinitionResponse {
    return {
      upgradeProcessExecutionId: response.id,
    };
  }
}
