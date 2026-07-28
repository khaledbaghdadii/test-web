import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { ManagementRequestMetricApiResponse } from "./management-request-metric-api-model";

@Injectable()
export class ManagementRequestMetricsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getManagementRequestMetrics(
    projectId: string,
    environmentId: string,
    managementRequestId: string
  ): Observable<ManagementRequestMetricApiResponse[]> {
    return this.http
      .get<ManagementRequestMetricApiResponse[]>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/management-requests/${managementRequestId}/metrics`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }
}
