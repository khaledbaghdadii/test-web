import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  Development,
  DevelopmentFilters,
  Developments,
} from "./development.model";

@Injectable()
export class DevelopmentService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private get baseUrl(): string {
    return this.config.gatewayUrl + "scm-management/";
  }

  getDevelopment(
    projectId: string,
    developmentId: string,
    includeDeleted?: boolean
  ): Observable<Development> {
    let url = `${this.baseUrl}projects/${projectId}/developments/${developmentId}`;
    if (includeDeleted) {
      url += `?includeDeleted=${includeDeleted}`;
    }
    return this.http
      .get<Development>(url)
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch development"
              )
          )
        )
      );
  }

  /**
   * Migrated from the legacy
   * `web/libs/features/scm/src/lib/scm-management.service.ts` `getDevelopments`:
   * lists developments filtered by repository id and/or branch name
   * (GET .../developments?repositoryId=…&name=…).
   */
  getDevelopments(
    projectId: string,
    filters: DevelopmentFilters
  ): Observable<Developments> {
    return this.http
      .get<Developments>(this.getDevelopmentsUrl(projectId, filters))
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch developments"
              )
          )
        )
      );
  }

  private getDevelopmentsUrl(
    projectId: string,
    filters: DevelopmentFilters
  ): string {
    let url = `${this.baseUrl}projects/${projectId}/developments`;

    const params: string[] = [];
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
