import { inject, Injectable } from "@angular/core";
import {
  EnvironmentService,
  ManagementRequestsService,
} from "@mxflow/features/environment";
import { catchError, map, Observable, throwError } from "rxjs";
import { StartEnvironmentResponse } from "../../service/models/start-environment-response.model";
import { StopEnvironmentResponse } from "../../service/models/stop-environment-response.model";

@Injectable({
  providedIn: "root",
})
export class EnvironmentActionsService {
  private readonly managementRequestsService = inject(
    ManagementRequestsService
  );
  private readonly environmentService = inject(EnvironmentService);

  startEnvironment(
    projectId: string,
    environmentId: string
  ): Observable<StartEnvironmentResponse> {
    return this.managementRequestsService
      .startEnvironmentRequest(projectId, environmentId)
      .pipe(
        map((response) => response),
        catchError((error: string) => {
          return throwError(() => new Error(error));
        })
      );
  }

  stopEnvironment(
    projectId: string,
    environmentId: string
  ): Observable<StopEnvironmentResponse> {
    return this.managementRequestsService
      .stopEnvironmentRequest(projectId, environmentId)
      .pipe(
        map((response) => response),
        catchError((error: string) => {
          return throwError(() => new Error(error));
        })
      );
  }

  excludeEnvironmentFromDailyShutdown(
    projectId: string,
    environmentId: string,
    exclude: boolean
  ): Observable<void> {
    return this.environmentService
      .excludeFromShutdown(projectId, environmentId, exclude)
      .pipe(
        catchError((error: string) => {
          return throwError(() => new Error(error));
        })
      );
  }
}
