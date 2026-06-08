import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import { EnvironmentUserRequest } from "./environment-user-request";
import { EnvironmentUserRequestApiModel } from "./environment-user-request-api-model";

@Injectable({
  providedIn: "root",
})
export class EnvironmentUserActionService {
  apiUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl;
  }

  getRequests(
    projectId: string,
    requestIds: string[]
  ): Observable<EnvironmentUserRequest[]> {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("requestIds", requestIds.join(","));

    return this.http
      .get<EnvironmentUserRequestApiModel[]>(this.getRequestsApi(projectId), {
        params: queryParams,
      })
      .pipe(
        map((apiModels) => apiModels.map((apiModel) => this.map(apiModel))),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  private getRequestsApi(projectId: string) {
    return `${this.apiUrl}projects/${projectId}/environments/user-requests`;
  }

  private map(
    apiModel: EnvironmentUserRequestApiModel
  ): EnvironmentUserRequest {
    return {
      id: apiModel.id,
      environmentId: apiModel.environmentId,
      completedAt: apiModel.completedAt,
    };
  }
}
