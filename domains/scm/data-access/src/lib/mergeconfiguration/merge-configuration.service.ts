import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { MergeConfiguration } from "./merge-configuration.model";

export interface MergeConfigurationPage {
  content: MergeConfiguration[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

@Injectable()
export class MergeConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private get baseUrl(): string {
    return this.config.gatewayUrl + "scm-management/";
  }

  getFilteredMergeConfigurations(
    projectId: string,
    repositoryId: string,
    searchKey: string,
    page: number,
    size: number
  ): Observable<MergeConfigurationPage> {
    const url = `${this.baseUrl}projects/${projectId}/settings/merge-configurations/filter?page=${page}&size=${size}`;
    return this.http
      .post<MergeConfigurationPage>(url, { searchKey, repositoryId })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch merge configurations"
              )
          )
        )
      );
  }
}
