import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { MergeConfigurationPage } from "./model/merge-configuration-page";
import { catchError, Observable, throwError } from "rxjs";
import { MergeConfigurationApiPage } from "./model/response/merge-configuration-api-page";
import { MergeConfigurationFilterRequest } from "./model/request/merge-configuration-filter-request";
import { MergeConfigurationApiFilterRequest } from "./model/request/merge-configuration-api-filter-request";
import { ErrorHandler } from "../error-handling/error-handler";

@Injectable({
  providedIn: "root",
})
export class MergeConfigurationService {
  config: AppConfig;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.config = config;
  }

  getFilteredMergeConfigurations(
    projectId: string,
    filterRequest: MergeConfigurationFilterRequest,
    pageSize = 20,
    pageIndex = 0
  ): Observable<MergeConfigurationPage> {
    const mergeConfigurationApiFilterRequest: MergeConfigurationApiFilterRequest =
      {
        searchKey: filterRequest.searchKey,
        repositoryId: filterRequest.repositoryId,
      };
    return this.http
      .post<MergeConfigurationApiPage>(
        this.getFilterMergeConfigurationsUrl(projectId, pageSize, pageIndex),
        mergeConfigurationApiFilterRequest
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  private getFilterMergeConfigurationsUrl(
    projectId: string,
    pageSize: number,
    pageIndex: number
  ): string {
    return (
      this.getApiUrl(projectId) +
      `settings/merge-configurations/filter?page=${pageIndex}&size=${pageSize}`
    );
  }

  private getApiUrl(projectId: string): string {
    return this.config.gatewayUrl + `scm-management/projects/${projectId}/`;
  }
}
