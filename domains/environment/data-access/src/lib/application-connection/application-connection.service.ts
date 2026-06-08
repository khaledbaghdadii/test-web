import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ApplicationConnectionApiModel } from "./application-connection-api-model";
import { ApplicationConnection } from "./application-connection";

@Injectable()
export class ApplicationConnectionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  fetchSshConnectionUrl(
    projectId: string,
    environmentId: string,
    machineId?: string
  ): Observable<ApplicationConnection> {
    const path = machineId
      ? `projects/${projectId}/environments/${environmentId}/application/ssh-connection/${machineId}`
      : `projects/${projectId}/environments/${environmentId}/application/ssh-connection`;
    return this.http
      .get<ApplicationConnectionApiModel>(`${this.config.gatewayUrl}${path}`)
      .pipe(
        map((response) => ({ connectionUrl: response.connectionUrl })),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  fetchScpConnectionUrl(
    projectId: string,
    environmentId: string,
    machineId?: string
  ): Observable<ApplicationConnection> {
    const path = machineId
      ? `projects/${projectId}/environments/${environmentId}/application/scp-connection/${machineId}`
      : `projects/${projectId}/environments/${environmentId}/application/scp-connection`;
    return this.http
      .get<ApplicationConnectionApiModel>(`${this.config.gatewayUrl}${path}`)
      .pipe(
        map((response) => ({ connectionUrl: response.connectionUrl })),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }
}
