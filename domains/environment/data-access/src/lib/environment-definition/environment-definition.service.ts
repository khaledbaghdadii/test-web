import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { EnvironmentDefinition } from "./environment-definition";

@Injectable()
export class EnvironmentDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getEnvironmentDefinitions(
    projectId: string,
    includeInactive = false
  ): Observable<EnvironmentDefinition[]> {
    const params = new HttpParams().set(
      "includeInactive",
      includeInactive.toString()
    );

    return this.http
      .get<EnvironmentDefinition[]>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/definitions`,
        { params }
      )
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error.error?.message ??
                  error.message ??
                  "Failed to fetch environment definitions"
              )
          )
        )
      );
  }

  getEnvironmentDefinitionById(
    projectId: string,
    environmentDefinitionId: string
  ): Observable<EnvironmentDefinition> {
    return this.http
      .get<EnvironmentDefinition>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/definitions/${environmentDefinitionId}`
      )
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error.error?.message ??
                  error.message ??
                  "Failed to fetch environment definitions"
              )
          )
        )
      );
  }
}
