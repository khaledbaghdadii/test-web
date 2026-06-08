import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import {
  BuildAndTestExecutionsQuery,
  BuildAndTestExecutionsQueryResult,
} from "./models/build-and-test-executions-query.model";

interface BuildAndTestExecutionsApiResult {
  readonly content: BuildAndTestExecutionApiSummary[];
  readonly totalElements: number;
}

interface BuildAndTestExecutionApiSummary {
  readonly id: string;
  readonly name?: string;
  readonly owner?: string;
  readonly status?: string;
  readonly endDate?: string;
  readonly startDate?: string;
  readonly expiryDate?: string;
  readonly daysExtended?: number;
  readonly definitionName?: string;
  readonly processName?: string;
  readonly input?: {
    readonly configurationBranchName?: string;
    readonly userStoryIds?: string[];
  };
}

@Injectable()
export class BuildAndTestExecutionsService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getBuildAndTestExecutions(
    projectId: string,
    query: BuildAndTestExecutionsQuery
  ): Observable<BuildAndTestExecutionsQueryResult> {
    return this.httpClient
      .get<BuildAndTestExecutionsApiResult>(this.buildUrl(projectId), {
        params: this.toHttpParams(query),
      })
      .pipe(
        map((response) => ({
          totalElements: response.totalElements,
          content: response.content.map((execution) => ({
            id: execution.id,
            name: execution.name,
            owner: execution.owner,
            status: execution.status as ExecutionStatus | undefined,
            endDate: execution.endDate,
            startDate: execution.startDate,
            expiryDate: execution.expiryDate,
            daysExtended: execution.daysExtended,
            processName: execution.processName,
            businessProcessDefinitionName: execution.definitionName,
            userStoryIds: execution.input?.userStoryIds ?? [],
            configurationBranchName: execution.input?.configurationBranchName,
          })),
        })),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                typeof error.error === "string"
                  ? error.error
                  : error.error?.message ?? error.message
              )
          )
        )
      );
  }

  private buildUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process`;
  }

  private toHttpParams(query: BuildAndTestExecutionsQuery): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          params = params.append(key, String(entry));
        });
        return;
      }
      params = params.set(key, String(value));
    });
    return params;
  }
}
