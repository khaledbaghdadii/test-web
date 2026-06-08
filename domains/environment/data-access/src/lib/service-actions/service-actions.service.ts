import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  StartEnvironmentResponseApiModel,
  StopEnvironmentResponseApiModel,
  EnvironmentServicesResponseApiModel,
} from "./service-actions-api-model";
import {
  StartEnvironmentResponse,
  StopEnvironmentResponse,
  EnvironmentServiceItem,
} from "./service-actions";
import {
  toStartEnvironmentResponse,
  toStopEnvironmentResponse,
  toEnvironmentServiceItems,
} from "./service-actions-mapper";

@Injectable()
export class ServiceActionsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  startEnvironment(
    projectId: string,
    environmentId: string
  ): Observable<StartEnvironmentResponse> {
    return this.http
      .post<StartEnvironmentResponseApiModel>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/start`,
        {}
      )
      .pipe(
        map(toStartEnvironmentResponse),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  stopEnvironment(
    projectId: string,
    environmentId: string
  ): Observable<StopEnvironmentResponse> {
    return this.http
      .post<StopEnvironmentResponseApiModel>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/stop`,
        {}
      )
      .pipe(
        map(toStopEnvironmentResponse),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  fetchEnvironmentServices(
    projectId: string,
    environmentId: string
  ): Observable<EnvironmentServiceItem[]> {
    return this.http
      .get<EnvironmentServicesResponseApiModel>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/services/status`
      )
      .pipe(
        map((response) => toEnvironmentServiceItems(response.services)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  excludeFromDailyShutdown(
    projectId: string,
    environmentId: string,
    exclude: boolean
  ): Observable<void> {
    return this.http
      .post<void>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/services/exclude-from-shutdown/${exclude}`,
        {}
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }
}
