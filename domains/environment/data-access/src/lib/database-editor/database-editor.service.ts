import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";

@Injectable()
export class DatabaseEditorService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  fetchEditorUrl(
    projectId: string,
    environmentId: string,
    databaseName: string
  ): Observable<string | undefined> {
    return this.http
      .get<void>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/databases/${databaseName}/editor`,
        { observe: "response" }
      )
      .pipe(
        map((response) => response.headers.get("Location") ?? undefined),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }
}
