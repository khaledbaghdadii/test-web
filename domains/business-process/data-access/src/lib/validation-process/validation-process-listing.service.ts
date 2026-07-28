import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ValidationProcessExecutionsQueryRequest } from "./models/validation-process-executions-query-request";
import { ValidationProcessExecutionsQueryResponse } from "./models/validation-process-executions-query-response";
import { ValidationProcessExecutionsQueryApiResponse } from "./models/validation-process-executions-query-api-response";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";

@Injectable()
export class ValidationProcessListingService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly mapper = inject(ValidationProcessExecutionMapperService);

  getValidationProcessExecutions(
    projectId: string,
    queryParams: ValidationProcessExecutionsQueryRequest
  ): Observable<ValidationProcessExecutionsQueryResponse> {
    return this.httpClient
      .get<ValidationProcessExecutionsQueryApiResponse>(
        this.getApiUrl(projectId),
        {
          params: this.constructParams(queryParams),
        }
      )
      .pipe(
        map((response) => ({
          executions: response.content.map((execution) =>
            this.mapper.toValidationProcessExecution(execution)
          ),
          total: response.totalElements,
          last: response.last,
        })),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  /**
   * Array-valued query fields (`officiality`, `businessProcessQualityLevel`,
   * `statuses`, `definitionIds`) must be sent as repeated `key=value` pairs
   * (mirrors the legacy `ValidationProcessExecutionFetcherService.constructParams`,
   * which `.append()`s each element individually) rather than a single
   * comma-joined value, which is what `HttpParams.set` would produce.
   */
  private constructParams(
    query: ValidationProcessExecutionsQueryRequest
  ): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (Array.isArray(value)) {
        return this.addArrayQueryParam(key, value, params);
      }
      return this.addQueryParamIfExists(value, params, key);
    }, new HttpParams());
  }

  private addArrayQueryParam(
    key: string,
    values: readonly unknown[],
    queryParams: HttpParams
  ): HttpParams {
    return values.reduce<HttpParams>(
      (params, value) => params.append(key, value as string | number | boolean),
      queryParams
    );
  }

  private addQueryParamIfExists(
    value: unknown,
    queryParams: HttpParams,
    key: string
  ): HttpParams {
    if (value !== undefined && value !== null) {
      return queryParams.set(key, value as string | number | boolean);
    }
    return queryParams;
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/master-validation`;
  }
}
