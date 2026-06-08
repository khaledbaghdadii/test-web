import { inject, Pipe, PipeTransform } from "@angular/core";
import { MergeConfigurationService } from "@mxflow/features/scm-management";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { map, Observable } from "rxjs";

@Pipe({
  name: "getDestinationBranchName",
  standalone: true,
})
export class GetDestinationBranchNamePipe implements PipeTransform {
  private readonly mergeConfigurationService = inject(
    MergeConfigurationService
  );
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );

  transform(id: string): Observable<string> {
    const projectId = this.projectIdResolver.resolve();

    return this.mergeConfigurationService
      .getFilteredMergeConfigurations(projectId, {
        searchKey: id,
      })
      .pipe(map((r) => r.content[0]?.branchName));
  }
}
