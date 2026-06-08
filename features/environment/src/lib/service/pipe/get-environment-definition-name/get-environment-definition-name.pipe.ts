import { Pipe, PipeTransform } from "@angular/core";
import { map, Observable } from "rxjs";
import { EnvironmentService } from "@mxflow/features/environment";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Pipe({
  name: "getEnvironmentDefinitionName",
  standalone: true,
})
export class GetEnvironmentDefinitionNamePipe implements PipeTransform {
  constructor(
    private environmentService: EnvironmentService,
    private projectIdResolver: ProjectIdRouteParamsResolverService
  ) {}

  transform(environmentDefinitionId: string): Observable<string> {
    const projectId = this.projectIdResolver.resolve();
    return this.environmentService
      .getEnvironmentDefinitionById(projectId, environmentDefinitionId)
      .pipe(
        map((environmentDefinition) => {
          return environmentDefinition.name;
        })
      );
  }
}
