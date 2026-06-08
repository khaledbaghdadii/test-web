import { inject, Injectable } from "@angular/core";
import { FormControl } from "@angular/forms";
import { ScmManagementService } from "@mxflow/features/scm";
import { combineLatest, Observable, of, startWith, switchMap } from "rxjs";
import { catchError, map } from "rxjs/operators";

export interface ParentBranchControls {
  createBranch: FormControl;
  parentBranch: FormControl;
  archivalBranchName: FormControl;
  repositoryId: FormControl;
}

@Injectable()
export class ValidationScopeStartCommitIdParentBranchResolverService {
  private readonly scmService = inject(ScmManagementService);

  resolve(
    controls: ParentBranchControls,
    projectId: string
  ): Observable<string | null> {
    return combineLatest([
      controls.createBranch.valueChanges.pipe(
        startWith(controls.createBranch.value)
      ),
      controls.parentBranch.valueChanges.pipe(
        startWith(controls.parentBranch.value)
      ),
      controls.archivalBranchName.valueChanges.pipe(
        startWith(controls.archivalBranchName.value)
      ),
      controls.repositoryId.valueChanges.pipe(
        startWith(controls.repositoryId.value)
      ),
    ]).pipe(
      switchMap(
        ([createBranch, parentBranch, archivalBranchName, repositoryId]) => {
          if (createBranch === true) {
            return of(parentBranch ?? null);
          }
          if (!repositoryId || !archivalBranchName) {
            return of(null);
          }
          return this.scmService
            .getDevelopments(projectId, {
              repositoryId,
              name: archivalBranchName,
            })
            .pipe(
              map((developments) => developments.content[0]?.source ?? null),
              catchError(() => of(null))
            );
        }
      )
    );
  }
}
