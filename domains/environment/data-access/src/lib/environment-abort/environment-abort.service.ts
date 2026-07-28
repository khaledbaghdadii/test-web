import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { BulkAbortRequest } from "./bulk-abort-request";

@Injectable()
export class EnvironmentAbortService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  abortEnvironments(request: BulkAbortRequest): Observable<void> {
    return this.http
      .post<void>(`${this.config.gatewayUrl}environments/abort`, request)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  abortProjectEnvironments(
    projectId: string,
    request: BulkAbortRequest
  ): Observable<void> {
    return this.http
      .post<void>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/abort`,
        request
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }
}
