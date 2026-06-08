import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  ValidationProcessExecution,
  ValidationProcessExecutionApiModel,
} from "./model";
import { APP_CONFIG } from "@mxflow/config";
import { handleError } from "../../../../../../core/error-handler/src/lib/error-utils";
import { ValidationProcessExecutionsQueryResponse } from "./model/validation-process-executions-query-response";
import { ValidationProcessExecutionsQueryRequest } from "./model/validation-process-executions-query-request";
import { ValidationProcessExecutionsQueryApiResponse } from "./model/validation-process-executions-query-api-response";

@Injectable({ providedIn: "root" })
export class ValidationProcessExecutionFetcherService {
  private readonly config = inject(APP_CONFIG);
  private readonly httpClient = inject(HttpClient);
  private readonly mapper = inject(ValidationProcessExecutionMapperService);

  getValidationProcessExecution(
    projectId: string,
    masterValidationExecutionId: string
  ): Observable<ValidationProcessExecution> {
    return this.httpClient
      .get<ValidationProcessExecutionApiModel>(
        this.getMasterValidationExecutionUrl(
          projectId,
          masterValidationExecutionId
        )
      )
      .pipe(
        map((response) => this.mapper.toMasterValidationExecution(response)),
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  getValidationProcessExecutions(
    projectId: string,
    queryParams: ValidationProcessExecutionsQueryRequest
  ): Observable<ValidationProcessExecutionsQueryResponse> {
    return this.httpClient
      .get<ValidationProcessExecutionsQueryApiResponse>(
        `${this.getApiUrl(projectId)}`,
        {
          params: this.constructParams(queryParams),
        }
      )
      .pipe(
        map((response) => {
          return {
            executions: response.content.map((execution) =>
              this.mapper.toMasterValidationExecution(execution)
            ),
            total: response.totalElements,
            last: response.last,
          };
        }),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  private constructParams(query: ValidationProcessExecutionsQueryRequest) {
    let queryParams = new HttpParams();

    queryParams = queryParams.append("page", query.page);
    queryParams = queryParams.append("pageSize", query.pageSize);

    queryParams = this.addQueryParamIfExists(
      "namePhrase",
      query.namePhrase,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "ownerPhrase",
      query.ownerPhrase,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "startDateRangeStart",
      query.startDateRangeStart,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "startDateRangeEnd",
      query.startDateRangeEnd,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "endDateRangeStart",
      query.endDateRangeStart,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "endDateRangeEnd",
      query.endDateRangeEnd,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "expiryDateRangeStart",
      query.expiryDateRangeStart,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "expiryDateRangeEnd",
      query.expiryDateRangeEnd,
      queryParams
    );
    queryParams = this.addQueryParamIfExists("sort", query.sort, queryParams);
    queryParams = this.addQueryParamIfExists(
      "parentBranch",
      query.parentBranch,
      queryParams
    );
    queryParams = this.addQueryParamIfExists(
      "rtpCommitPhrase",
      query.rtpCommitPhrase,
      queryParams
    );

    if (query.officiality && query.officiality.length > 0) {
      query.officiality.forEach((value) => {
        queryParams = queryParams.append("officiality", value);
      });
    }

    if (
      query.businessProcessQualityLevel &&
      query.businessProcessQualityLevel.length > 0
    ) {
      query.businessProcessQualityLevel.forEach((value) => {
        queryParams = queryParams.append("businessProcessQualityLevel", value);
      });
    }

    if (query.statuses && query.statuses.length > 0) {
      query.statuses.forEach((value) => {
        queryParams = queryParams.append("statuses", value);
      });
    }

    if (query.definitionIds && query.definitionIds.length > 0) {
      query.definitionIds.forEach((value) => {
        queryParams = queryParams.append("definitionIds", value);
      });
    }

    queryParams = this.addQueryParamIfExists(
      "hidden",
      query.hidden,
      queryParams
    );

    return queryParams;
  }

  private addQueryParamIfExists(
    key: string,
    value: string | boolean | undefined,
    queryParams: HttpParams
  ) {
    if (value !== undefined && value !== null) {
      return queryParams.append(key, value);
    } else {
      return queryParams;
    }
  }

  private getMasterValidationExecutionUrl(
    projectId: string,
    masterValidationExecutionId: string
  ) {
    return `${this.getApiUrl(projectId)}/${masterValidationExecutionId}`;
  }

  private getApiUrl(projectId: string) {
    return (
      this.config.gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions/master-validation"
    );
  }
}
