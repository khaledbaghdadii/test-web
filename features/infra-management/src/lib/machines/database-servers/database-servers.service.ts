import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { DatabaseServerVersionsApiResponse } from "./model/response/database-server-versions-api-response";
import { DatabaseServerType } from "./model/database-server-type";

@Injectable({
  providedIn: "root",
})
export class DatabaseServersService {
  config: AppConfig;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.config = config;
  }

  getDatabaseServerVersions(
    projectId: string,
    serverType: DatabaseServerType
  ): Observable<DatabaseServerVersionsApiResponse> {
    return this.http
      .get<DatabaseServerVersionsApiResponse>(
        this.getDatabaseServerVersionsApiUrl(projectId, serverType)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  private getDatabaseServerVersionsApiUrl(
    projectId: string,
    serverType: DatabaseServerType
  ): string {
    return (
      this.getApiUrl(projectId) + `versions?databaseServerType=${serverType}`
    );
  }

  private getApiUrl(projectId: string): string {
    return (
      this.config.gatewayUrl +
      `projects/${projectId}/infra/registry/db-servers/`
    );
  }
}
