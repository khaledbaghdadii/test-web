import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { AbortBusinessProcessExecutionRequest } from "./abort-business-process-execution-request";
import { AbortBusinessProcessExecutionApiRequest } from "./abort-business-process-execution-api-request";
import { handleError } from "../../../../../../core/error-handler/src/lib/error-utils";

@Injectable()
export class BusinessProcessExecutionAbortService {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {}

  abort(request: AbortBusinessProcessExecutionRequest): Observable<void> {
    return this.http
      .post<void>(
        this.getUrl(request.projectId, request.processId),
        this.from(request)
      )
      .pipe(
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  private getUrl(projectId: string, processId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/${processId}/abort`;
  }

  private from(
    request: AbortBusinessProcessExecutionRequest
  ): AbortBusinessProcessExecutionApiRequest {
    return {
      shouldCleanDevelopment: request.shouldCleanDevelopment,
      developmentId: request.developmentId,
    };
  }
}
