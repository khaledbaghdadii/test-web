import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { SystematicConfigAuditOperationsResponse } from "../models/systematic-config-audit.models";

@Injectable({
  providedIn: "root",
})
export class EnvironmentConfigAuditService {
  private readonly config: AppConfig = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);

  retrieveSystematicConfigAudits(
    projectId: string,
    environmentId: string
  ): Observable<SystematicConfigAuditOperationsResponse> {
    return this.http
      .get<SystematicConfigAuditOperationsResponse>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/systematic-config-audit`,
        {}
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }
}
