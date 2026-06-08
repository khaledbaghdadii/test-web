import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { Development } from "./development.model";

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
}
