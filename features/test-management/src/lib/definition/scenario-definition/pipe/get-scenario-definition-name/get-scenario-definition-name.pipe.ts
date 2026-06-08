import { Pipe, PipeTransform, inject } from "@angular/core";
import { map, Observable } from "rxjs";
import { ScenarioDefinitionService } from "../../scenario-definition.service";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Pipe({
  name: "getScenarioDefinitionName",
  standalone: true,
})
export class GetScenarioDefinitionNamePipe implements PipeTransform {
  private scenarioService = inject(ScenarioDefinitionService);
  private projectIdResolver = inject(ProjectIdRouteParamsResolverService);

  transform(scenarioDefinitionId: string): Observable<string> {
    const projectId = this.projectIdResolver.resolve();
    return this.scenarioService
      .getScenarioDefinitionById(scenarioDefinitionId, projectId)
      .pipe(map((scenarioDefinition) => scenarioDefinition.name));
  }
}
