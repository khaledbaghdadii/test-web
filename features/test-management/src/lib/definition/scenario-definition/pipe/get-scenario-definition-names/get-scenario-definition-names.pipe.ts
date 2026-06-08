import { Pipe, PipeTransform, inject } from "@angular/core";
import { from, map, mergeMap, Observable, toArray } from "rxjs";
import { ScenarioDefinitionService } from "../../scenario-definition.service";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Pipe({
  name: "getScenarioDefinitionNames",
  standalone: true,
})
export class GetScenarioDefinitionNamesPipe implements PipeTransform {
  private scenarioService = inject(ScenarioDefinitionService);
  private projectIdResolver = inject(ProjectIdRouteParamsResolverService);

  transform(definitionIds: string[]): Observable<string[]> {
    const projectId = this.projectIdResolver.resolve();
    return from(definitionIds).pipe(
      mergeMap((definitionId) =>
        this.scenarioService.getScenarioDefinitionById(definitionId, projectId)
      ),
      map((definition) => definition.name),
      toArray()
    );
  }
}
