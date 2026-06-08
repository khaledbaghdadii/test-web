import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { EnvironmentService } from "../../service/environment.service";
import {
  environmentRetrieved,
  failedToRetrieveEnvironment,
  retrieveEnvironment,
} from "./environments.action";
import { catchError, exhaustMap, map, of } from "rxjs";

@Injectable()
export class EnvironmentsEffects {
  private actions$ = inject(Actions);
  private environmentService = inject(EnvironmentService);

  retrieveEnvironment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(retrieveEnvironment),
      exhaustMap((action) => {
        return this.environmentService
          .getEnvironmentExecutionById(action.projectId, action.id)
          .pipe(
            map((environment) =>
              environmentRetrieved({ environment: environment })
            ),
            catchError((error) =>
              of(
                failedToRetrieveEnvironment({
                  id: action.id,
                  error: error.message,
                })
              )
            )
          );
      })
    )
  );
}
