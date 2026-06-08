import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { SendChangesForReviewRequest } from "./models/send-changes-for-review.model";
import { APP_CONFIG, AppConfig } from "@mxflow/config";

@Injectable()
export class SendChangesForReviewService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  sendChangesForReview(request: SendChangesForReviewRequest): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/send-changes-for-review`,
        {
          mergeConfigurationId: request.mergeConfigurationId,
          mergeJobTitle: request.mergeJobTitle,
          mergeJobReviewers: request.mergeJobReviewers,
          shouldCleanDevelopment: request.shouldCleanDevelopment,
          developmentId: request.developmentId,
          supportsResourceManagement: request.supportsResourceManagement,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private buildExecutionUrl(projectId: string, executionId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/${executionId}`;
  }
}
