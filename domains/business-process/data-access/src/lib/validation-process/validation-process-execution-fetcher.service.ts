import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ValidationProcessExecution } from "./models/validation-process-execution";
import { ValidationProcessExecutionApiModel } from "./models/validation-process-execution-api-model";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";

@Injectable()
export class ValidationProcessExecutionFetcherService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly mapper = inject(ValidationProcessExecutionMapperService);

  fetchExecution(
    projectId: string,
    executionId: string
  ): Observable<ValidationProcessExecution> {
    return this.httpClient
      .get<ValidationProcessExecutionApiModel>(
        `${this.getApiUrl(projectId)}/${executionId}`
      )
      .pipe(
        map((response) => this.mapper.toValidationProcessExecution(response)),
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/master-validation`;
  }
}
