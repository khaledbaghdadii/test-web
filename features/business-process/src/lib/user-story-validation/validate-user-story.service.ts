import { inject, Injectable } from "@angular/core";
import { APP_CONFIG } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ValidateUserStoryRequest } from "./validate-user-story-request";
import { catchError, Observable, throwError } from "rxjs";
import { ValidateUserStoryResponse } from "./validate-user-story-response";
import { handleError } from "../../../../../core/error-handler/src/lib/error-utils";

@Injectable({ providedIn: "root" })
export class ValidateUserStoryService {
  config = inject(APP_CONFIG);
  httpClient = inject(HttpClient);

  validateUserStory(
    projectId: string,
    request: ValidateUserStoryRequest
  ): Observable<ValidateUserStoryResponse> {
    return this.httpClient
      .post<ValidateUserStoryResponse>(this.getApiUrl(projectId), request)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(handleError(error)))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process/validate/user-story`;
  }
}
