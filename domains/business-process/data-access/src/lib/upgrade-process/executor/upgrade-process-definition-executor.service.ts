import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ExecuteUpgradeProcessDefinitionApiRequest } from "./execute-upgrade-process-definition-api-request";
import { ExecuteUpgradeProcessDefinitionApiResponse } from "./execute-upgrade-process-definition-api-response";
import { ExecuteUpgradeProcessDefinitionRequest } from "./execute-upgrade-process-definition-request";
import { ExecuteUpgradeProcessDefinitionResponse } from "./execute-upgrade-process-definition-response";

/**
 * New-architecture migration of the legacy
 * `web/libs/features/business-process/.../upgrade-process/service/upgrade-process-definition-executor.service.ts`.
 * Behaviour, endpoint, request/response mapping and error mapping are copied
 * verbatim from the legacy service (POST .../executions/binary-upgrade/execute):
 * `mapRequest` strips `projectId` (it moves to the URL) and rebuilds the nested
 * MX / configuration / infrastructure / test / reference-environment payload
 * field-by-field; `mapResponse` maps `{ id }` to `{ upgradeProcessExecutionId }`.
 * No contract (pact) test exists for this endpoint on the legacy side, so none
 * is added here (see devo/feature/VAL-27132/open-points.md).
 */
@Injectable()
export class UpgradeProcessDefinitionExecutorService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly httpClient = inject(HttpClient);

  executeUpgradeProcessDefinition(
    request: ExecuteUpgradeProcessDefinitionRequest
  ): Observable<ExecuteUpgradeProcessDefinitionResponse> {
    return this.httpClient
      .post<ExecuteUpgradeProcessDefinitionApiResponse>(
        this.getApiUrl(request.projectId),
        this.mapRequest(request)
      )
      .pipe(
        map((response) => this.mapResponse(response)),
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(this.toErrorMessage(error)))
        )
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

  /** Mirrors the legacy `handleError` (web/libs/core/error-handler/.../error-utils.ts). */
  private toErrorMessage(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error.error.message;
  }
}
