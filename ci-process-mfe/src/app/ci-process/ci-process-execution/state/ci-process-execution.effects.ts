import { inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { CiProcessExecutionAction } from "./index";
import { exhaustMap, switchMap } from "rxjs/operators";
import { catchError, of } from "rxjs";
import { BuildAndTestProcessExecutionFetcherService } from "@mxflow/features/business-process";

export class CiProcessExecutionEffects {
  ciProcess$ = createEffect(
    (
      actions$: Actions = inject(Actions),
      executionFetcherService: BuildAndTestProcessExecutionFetcherService = inject(
        BuildAndTestProcessExecutionFetcherService
      )
    ) => {
      return actions$.pipe(
        ofType(CiProcessExecutionAction.getCiProcessExecution),
        exhaustMap((action) =>
          executionFetcherService
            .getBuildAndTestProcessExecution(action.projectId, action.id)
            .pipe(
              switchMap((ciProcessExecution) =>
                of(
                  CiProcessExecutionAction.getCiProcessExecutionSuccessfully({
                    ciProcessExecution: ciProcessExecution,
                  })
                )
              ),
              catchError((error) =>
                of(
                  CiProcessExecutionAction.getCiProcessExecutionFailure({
                    errorMessage: error.error,
                  })
                )
              )
            )
        )
      );
    }
  );
}
