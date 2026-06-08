import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { TechnicalReseedService } from "../../technical-reseed/service/technical-reseed.service";
import { catchError, exhaustMap, map, of } from "rxjs";
import {
  executionGroupRetrieved,
  failedToRetrieveExecutionGroup,
  retrieveExecutionGroup,
} from "./execution-groups.action";

@Injectable()
export class ExecutionGroupsEffects {
  private readonly actions$ = inject(Actions);
  private readonly technicalReseedService = inject(TechnicalReseedService);

  retrieveExecutionGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(retrieveExecutionGroup),
      exhaustMap((action) => {
        return this.technicalReseedService
          .getTechnicalReseedExecutionGroupDetails(
            action.projectId,
            action.executionGroupId
          )
          .pipe(
            map((executionGroup) =>
              executionGroupRetrieved({ executionGroup: executionGroup })
            ),
            catchError((error) =>
              of(
                failedToRetrieveExecutionGroup({
                  executionGroupId: action.executionGroupId,
                  error: error.message,
                })
              )
            )
          );
      })
    )
  );
}
