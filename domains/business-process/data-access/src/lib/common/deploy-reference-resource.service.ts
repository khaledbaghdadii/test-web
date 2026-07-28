import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { DeployReferenceResourceRequest } from "./models/deploy-reference-resource-request";
import { DeployReferenceResourceResponse } from "./models/deploy-reference-resource-response";

@Injectable()
export class DeployReferenceResourceService {
  private readonly scenarioRunService = inject(ScenarioRunService);

  deployReferenceResource(
    projectId: string,
    request: DeployReferenceResourceRequest
  ): Observable<DeployReferenceResourceResponse> {
    const runScenarioRequest = {
      scenarioDefinitionId: request.scenarioDefinitionId,
      commitId: request.commitId,
      referenceFactoryProductId: request.referenceFactoryProductId,
      executionGroupId: request.executionGroupId,
      machineGroupId: request.machineGroupId,
      qualityLevel: request.qualityLevel,
      cleanIfPassed: request.cleanIfPassed,
      disableKeepExecution: request.disableKeepExecution,
      disableConfigurationEditor: request.disableConfigurationEditor,
      supportReconActivities: request.supportReconActivities,
      stopServices: request.stopServices,
      validationScopeEnabled: request.validationScopeEnabled,
      incidentEnabled: request.incidentEnabled,
    };

    return this.scenarioRunService
      .runScenario(projectId, runScenarioRequest)
      .pipe(
        map((response) => ({
          testExecutionId: response.testExecutionId,
        }))
      );
  }
}
