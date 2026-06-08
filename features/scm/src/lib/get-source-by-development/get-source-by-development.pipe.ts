import { Pipe, PipeTransform } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { ScmManagementService } from "../scm-management.service";

@Pipe({
  name: "branchNameByDevelopment",
})
export class BranchNameByDevelopmentPipe implements PipeTransform {
  constructor(private scmService: ScmManagementService) {}

  transform(
    projectId: string,
    developmentId: string
  ): Observable<string | undefined> {
    return this.scmService.getDevelopment(projectId, developmentId).pipe(
      map((development) => development.name),
      catchError(() =>
        throwError(() => new Error("Failed to fetch development"))
      )
    );
  }
}
