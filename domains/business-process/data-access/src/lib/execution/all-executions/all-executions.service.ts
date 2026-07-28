import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import { catchError, map, Observable, throwError } from "rxjs";
import { AllExecutionSummary } from "./models/all-execution-summary";

interface AllExecutionsApiModel {
  readonly id: string;
  readonly definitionId?: string;
  readonly name?: string;
  readonly owner?: string;
  readonly status?: string;
  readonly officiality?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly expiryDate?: string;
  readonly daysExtended?: number;
  readonly definitionName?: string;
  readonly processName?: string;
  readonly familyId?: string;
  readonly sourceDefinitionId?: string;
}

@Injectable()
export class AllExecutionsService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getAllExecutions(projectId: string): Observable<AllExecutionSummary[]> {
    return this.httpClient
      .get<AllExecutionsApiModel[]>(this.buildUrl(projectId))
      .pipe(
        map((executions) =>
          executions.map((execution) => ({
            id: execution.id,
            definitionId: execution.definitionId,
            name: execution.name ?? "",
            owner: execution.owner,
            status: execution.status as ExecutionStatus | undefined,
            officiality: execution.officiality,
            startDate: execution.startDate,
            endDate: execution.endDate,
            expiryDate: execution.expiryDate,
            daysExtended: execution.daysExtended,
            businessProcessDefinitionName: execution.definitionName,
            processName: execution.processName,
            familyId: execution.familyId as ExecutionFamily,
            sourceDefinitionId: execution.sourceDefinitionId,
          }))
        ),
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
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions`;
  }
}
