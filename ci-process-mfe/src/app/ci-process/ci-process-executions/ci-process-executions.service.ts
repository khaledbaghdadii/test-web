import { Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { EnvironmentProvider } from "../../../environments/environment";
import { CiProcessExecutionsQuery } from "./models/ci-process-execution-query";
import { CiProcessExecutionsQueryResult } from "./models/ci-process-execution-query-result";
import { CiProcessExecutionsQueryResultApiModel } from "./models/ci-process-execution-query-result-api-model";

@Injectable()
export class CiProcessExecutionsService {
  constructor(
    private http: HttpClient,
    private environmentProvider: EnvironmentProvider
  ) {}

  getCiProcessExecutions(
    projectId: string,
    query: CiProcessExecutionsQuery
  ): Observable<CiProcessExecutionsQueryResult> {
    const queryParams = new HttpParams({ fromObject: { ...query } });
    return this.http
      .get<CiProcessExecutionsQueryResultApiModel>(this.getApiUrl(projectId), {
        params: queryParams,
      })
      .pipe(
        map((queryResult) => {
          return {
            content: queryResult.content.map((execution) => ({
              id: execution.id,
              name: execution.name,
              owner: execution.owner,
              status: execution.status,
              endDate: execution.endDate,
              startDate: execution.startDate,
              expiryDate: execution.expiryDate,
              daysExtended: execution.daysExtended,
              processName: execution.processName,
              businessProcessDefinitionName: execution.definitionName,
              userStoryIds: execution.input.userStoryIds,
              configurationBranchName: execution.input.configurationBranchName,
            })),
            totalElements: queryResult.totalElements,
          };
        }),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  private getApiUrl(projectId: string): string {
    const gatewayUrl = this.environmentProvider.getEnvironment().gatewayUrl;
    return `${gatewayUrl}projects/${projectId}/business-process/executions/ci-process`;
  }
}
