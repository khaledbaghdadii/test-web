import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AuthenticationService } from "@mxflow/core/auth";
import { catchError, Observable, throwError } from "rxjs";
import { MarkQualityGateFailedRequest } from "./models/quality-gate.model";
import { APP_CONFIG, AppConfig } from "@mxflow/config";

@Injectable()
export class QualityGateValidationService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly authenticationService = inject(AuthenticationService);

  markQualityGatePassed(
    projectId: string,
    processId: string,
    comment?: string
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          projectId,
          processId
        )}/user-input/mark-quality-gate-passed`,
        { requester: this.authenticationService.getUsername(), comment }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  markQualityGateFailed(
    request: MarkQualityGateFailedRequest
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/mark-quality-gate-failed`,
        {
          requester: this.authenticationService.getUsername(),
          shouldCleanDevelopment: request.shouldCleanDevelopment,
          developmentId: request.developmentId,
          comment: request.comment,
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
