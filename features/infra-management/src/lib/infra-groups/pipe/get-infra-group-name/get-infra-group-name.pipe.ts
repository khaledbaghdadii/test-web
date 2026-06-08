import { Pipe, PipeTransform } from "@angular/core";
import { InfraGroupsService } from "@mxflow/features/infra-management";
import { catchError, map, Observable, of } from "rxjs";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ToastMessageService } from "@mxflow/ui/alert";

@Pipe({
  name: "getInfraGroupName",
  standalone: true,
})
export class GetInfraGroupNamePipe implements PipeTransform {
  constructor(
    private readonly infraGroupsService: InfraGroupsService,
    private readonly projectIdResolver: ProjectIdRouteParamsResolverService,
    private readonly toastMessageService: ToastMessageService
  ) {}

  transform(infraGroupId: string): Observable<string> {
    const projectId = this.projectIdResolver.resolve();
    return this.infraGroupsService.getGroup(projectId, infraGroupId).pipe(
      map((infraGroup) => {
        return infraGroup.name;
      }),
      catchError((errorResponse: string) => {
        this.toastMessageService.showError(errorResponse);
        return of("-");
      })
    );
  }
}
