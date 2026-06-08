import { catchError, Observable, throwError } from "rxjs";
import { StartEnvironmentResponse } from "./models/start-environment-response.model";
import { StopEnvironmentResponse } from "./models/stop-environment-response.model";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class ManagementRequestsService {
  apiUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl;
  }

  startEnvironmentRequest(
    projectId: string,
    environmentId: string
  ): Observable<StartEnvironmentResponse> {
    return this.http
      .post<StartEnvironmentResponse>(
        this.apiUrl +
          `projects/${projectId}/environments/${environmentId}/start`,
        null
      )
      .pipe(catchError((err) => throwError(() => new Error(err.error))));
  }

  stopEnvironmentRequest(
    projectId: string,
    environmentId: string
  ): Observable<StopEnvironmentResponse> {
    return this.http
      .post<StopEnvironmentResponse>(
        this.apiUrl +
          `projects/${projectId}/environments/${environmentId}/stop`,
        null
      )
      .pipe(catchError((err) => throwError(() => new Error(err.error))));
  }
}
