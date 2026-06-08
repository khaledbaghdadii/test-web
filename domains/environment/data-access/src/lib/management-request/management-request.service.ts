import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ManagementRequestApiModel } from "./management-request-api-model";
import { ManagementRequest } from "./management-request";
import { toManagementRequests } from "./management-request-mapper";

@Injectable()
export class ManagementRequestService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  fetchByProjectAndEnvironmentId(
    projectId: string,
    environmentId: string
  ): Observable<ManagementRequest[]> {
    return this.http
      .get<ManagementRequestApiModel[]>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/requests`
      )
      .pipe(
        map((response) => toManagementRequests(response)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }
}
