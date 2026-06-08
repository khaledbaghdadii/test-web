import { inject, Injectable } from "@angular/core";
import { forkJoin, map, Observable } from "rxjs";
import {
  EnvironmentService,
  ManagementRequestService,
  ManagementRequest,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatusPanelData } from "./environment-status-panel-data";

const DEPLOYMENT_REQUEST_TYPE = "deployment";

@Injectable()
export class EnvironmentStatusPanelFacade {
  private readonly environmentService = inject(EnvironmentService);
  private readonly managementRequestService = inject(ManagementRequestService);

  fetchPanelData(
    projectId: string,
    environmentId: string
  ): Observable<EnvironmentStatusPanelData> {
    return forkJoin({
      environment: this.environmentService.fetchByProjectAndEnvironmentId(
        projectId,
        environmentId
      ),
      managementRequests:
        this.managementRequestService.fetchByProjectAndEnvironmentId(
          projectId,
          environmentId
        ),
    }).pipe(
      map(({ environment, managementRequests }) => {
        const deploymentRequest =
          this.findDeploymentRequest(managementRequests);

        return {
          environmentId: environment.id,
          projectId: environment.projectId,
          status: environment.status,
          outputsDirectoryUri: environment.outputsDirectoryUri,
          bundles: environment.bundles,
          isTools: environment.isTools,
          deploymentStartDate: deploymentRequest?.startedOn,
          deploymentEndDate: deploymentRequest?.endedOn,
          terminationMessage: deploymentRequest?.resultMessage,
          databases: environment.databases,
          primaryApplicative: environment.primaryApplicative,
          secondaryApplicatives: environment.secondaryApplicatives,
          excludeFromShutdown: environment.excludeFromShutdown,
          environmentActions: environment.environmentActions,
          webClientUrl: environment.webClientUrl,
          secureClientArtifactUri: environment.secureClientArtifactUri,
        };
      })
    );
  }

  private findDeploymentRequest(
    requests: ManagementRequest[]
  ): ManagementRequest | undefined {
    return requests.find((request) => request.type === DEPLOYMENT_REQUEST_TYPE);
  }
}
