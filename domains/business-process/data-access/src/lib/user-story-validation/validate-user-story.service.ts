import { inject, Injectable } from "@angular/core";
import { APP_CONFIG } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import {
  ValidateUserStoryRequest,
  ValidateUserStoryResponse,
} from "./models/validate-user-story.model";

/**
 * New-architecture migration (copied verbatim) of the user-story validation
 * call from the legacy
 * `web/libs/features/business-process/src/lib/user-story-validation/validate-user-story.service.ts`.
 * Used by the rebuilt user-story input when feature-flagged validation is on.
 * `handleError` is inlined here (the legacy reached into
 * `core/error-handler/src/lib/error-utils`, which is not exported through the
 * public barrel).
 */
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
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  private handleError(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error?.error?.message;
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process/validate/user-story`;
  }
}
