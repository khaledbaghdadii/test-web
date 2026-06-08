import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import {
  LaunchTechnicalReseedOperationRequest,
  LaunchTechnicalReseedOperationResponse,
} from "../technical-reseed-models";
import { catchError, Observable, throwError } from "rxjs";
import { ExecutionGroup } from "../execution-group-models";

@Injectable({
  providedIn: "root",
})
export class TechnicalReseedService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  public readonly apiUrl: string = this.config.gatewayUrl;

  launchTechnicalReseed(
    projectId: string,
    executionGroupId: string,
    request: LaunchTechnicalReseedOperationRequest
  ): Observable<LaunchTechnicalReseedOperationResponse> {
    return this.http
      .post<LaunchTechnicalReseedOperationResponse>(
        `${this.apiUrl}projects/${projectId}/technical-reseed-execution-groups/${executionGroupId}/launch-reseed`,
        request
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(
            () => new Error(error.error?.message ?? error.message)
          );
        })
      );
  }

  getTechnicalReseedExecutionGroupDetails(
    projectId: string,
    executionGroupId: string
  ): Observable<ExecutionGroup> {
    return this.http
      .get<ExecutionGroup>(
        this.apiUrl +
          `projects/${projectId}/technical-reseed-execution-groups/${executionGroupId}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }
}
