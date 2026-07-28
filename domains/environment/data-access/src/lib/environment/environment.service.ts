import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, forkJoin, map, Observable, of, throwError } from "rxjs";
import {
  EnvironmentApiModel,
  EnvironmentPageApiModel,
} from "./environment-api-model";
import { Environment } from "./environment";
import { toEnvironment, toEnvironments } from "./environment-mapper";
import { MXClientDetails } from "../mx-client-details/mx-client-details";

@Injectable()
export class EnvironmentService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  fetchByEnvironmentIds(environmentIds: string[]): Observable<Environment[]> {
    if (environmentIds.length === 0) {
      return of([]);
    }

    const params = new HttpParams()
      .set("environmentId", environmentIds.join(","))
      .set("size", environmentIds.length)
      .set("page", 0)
      .set("sort", "createdOn,asc");

    return this.http
      .get<EnvironmentPageApiModel>(`${this.config.gatewayUrl}environments`, {
        params,
      })
      .pipe(
        map((response) => toEnvironments(response.content)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  fetchByProjectAndEnvironmentId(
    projectId: string,
    environmentId: string
  ): Observable<Environment> {
    return this.http
      .get<EnvironmentApiModel>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}`
      )
      .pipe(
        map((response) => toEnvironment(response)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  fetchByProjectAndEnvironmentIds(
    projectId: string,
    environmentIds: string[]
  ): Observable<Environment[]> {
    if (environmentIds.length === 0) {
      return of([]);
    }

    return forkJoin(
      environmentIds.map((environmentId) =>
        this.fetchByProjectAndEnvironmentId(projectId, environmentId)
      )
    );
  }

  getMXClientDetails(
    projectId: string,
    environmentId: string
  ): Observable<MXClientDetails> {
    // Note: errors are NOT wrapped — consumers need HttpErrorResponse.status for 400 handling
    return this.http.get<MXClientDetails>(
      `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/mxclient-details`
    );
  }
}
