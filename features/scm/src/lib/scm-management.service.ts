import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { Development } from "./development/development";
import { DevelopmentApiModel } from "./development/development-api-model";
import { DevelopmentFilters } from "./development/development-filters";
import { Developments } from "./development/developments";
import { ErrorHandler } from "./error-handling/error-handler";

@Injectable()
export class ScmManagementService {
  apiUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl + "scm-management/";
  }

  getDevelopment(
    projectId: string,
    developmentId: string,
    includeDeleted?: boolean
  ): Observable<Development> {
    let url = `${this.apiUrl}projects/${projectId}/developments/${developmentId}`;
    if (includeDeleted !== undefined && includeDeleted !== null) {
      url += `?includeDeleted=${includeDeleted}`;
    }
    return this.http
      .get<DevelopmentApiModel>(url)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getDevelopments(
    projectId: string,
    filters: DevelopmentFilters
  ): Observable<Developments> {
    const developmentsUrl = this.getDevelopmentUrl(projectId, filters);
    return this.http
      .get<Developments>(developmentsUrl)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  private getDevelopmentUrl(
    projectId: string,
    filters: DevelopmentFilters
  ): string {
    let url = `${this.apiUrl}projects/${projectId}/developments`;

    const params = [];
    if (filters.repositoryId) {
      params.push(`repositoryId=${encodeURIComponent(filters.repositoryId)}`);
    }
    if (filters.name) {
      params.push(`name=${encodeURIComponent(filters.name)}`);
    }

    if (params.length > 0) {
      url += "?" + params.join("&");
    }
    return url;
  }
}
