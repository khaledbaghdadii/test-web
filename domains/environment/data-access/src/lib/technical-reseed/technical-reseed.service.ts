import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  LaunchTechnicalReseedOperationRequest,
  LaunchTechnicalReseedOperationResponse,
  TechnicalReseedExecutionGroup,
} from "./technical-reseed.model";

@Injectable()
export class TechnicalReseedService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getExecutionGroupDetails(
    projectId: string,
    executionGroupId: string
  ): Observable<TechnicalReseedExecutionGroup> {
    return this.http
      .get<TechnicalReseedExecutionGroup>(
        `${this.config.gatewayUrl}projects/${projectId}/technical-reseed-execution-groups/${executionGroupId}`
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  launchTechnicalReseed(
    projectId: string,
    executionGroupId: string,
    request: LaunchTechnicalReseedOperationRequest
  ): Observable<LaunchTechnicalReseedOperationResponse> {
    return this.http
      .post<LaunchTechnicalReseedOperationResponse>(
        `${this.config.gatewayUrl}projects/${projectId}/technical-reseed-execution-groups/${executionGroupId}/launch-reseed`,
        request
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }
}
