import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { SystematicConfigAuditOperationsResponseApiModel } from "./systematic-config-audit-api-model";
import { SystematicConfigAuditOperationsResponse } from "./systematic-config-audit";
import { toSystematicConfigAuditOperationsResponse } from "./systematic-config-audit-mapper";

@Injectable()
export class SystematicConfigAuditService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  retrieveSystematicConfigAudit(
    projectId: string,
    environmentId: string
  ): Observable<SystematicConfigAuditOperationsResponse> {
    return this.http
      .get<SystematicConfigAuditOperationsResponseApiModel>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/systematic-config-audit`
      )
      .pipe(
        map(toSystematicConfigAuditOperationsResponse),
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }
}
