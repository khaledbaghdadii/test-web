import { Pipe, PipeTransform } from "@angular/core";
import { RepositoryService } from "@mxflow/features/repository";
import { map, Observable } from "rxjs";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Pipe({
  name: "getRepositoryName",
  standalone: true,
})
export class GetRepositoryNamePipe implements PipeTransform {
  constructor(
    private repositoryService: RepositoryService,
    private ProjectIdResolver: ProjectIdRouteParamsResolverService
  ) {}

  transform(repositoryId: string): Observable<string> {
    const projectId = this.ProjectIdResolver.resolve();
    return this.repositoryService.getRepoById(projectId, repositoryId).pipe(
      map((repository) => {
        return repository.name;
      })
    );
  }
}
