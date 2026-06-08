import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";

@Injectable()
export class EnvironmentCleanService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  cleanEnvironment(projectId: string, environmentId: string): Observable<void> {
    return this.http
      .post<void>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/clean`,
        null
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }
}
