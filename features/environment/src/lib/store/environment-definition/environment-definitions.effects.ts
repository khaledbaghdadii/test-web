import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { EnvironmentService } from "@mxflow/features/environment";
import { catchError, exhaustMap, map, of } from "rxjs";
import {
  environmentDefinitionsRetrieved,
  failedToRetrieveEnvironmentDefinitions,
  retrieveEnvironmentDefinitions,
} from "./environment-definitions.action";

@Injectable()
export class EnvironmentDefinitionsEffects {
  private actions$ = inject(Actions);
  private environmentService = inject(EnvironmentService);

  retrieveEnvironmentDefinitions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(retrieveEnvironmentDefinitions),
      exhaustMap((action) => {
        return this.environmentService
          .getEnvironmentDefinitions(action.projectId)
          .pipe(
            map((environmentDefinitions) =>
              environmentDefinitionsRetrieved({
                projectId: action.projectId,
                environmentDefinitions: environmentDefinitions,
              })
            ),
            catchError((error) =>
              of(
                failedToRetrieveEnvironmentDefinitions({
                  projectId: action.projectId,
                  error: error.message,
                })
              )
            )
          );
      })
    )
  );
}
