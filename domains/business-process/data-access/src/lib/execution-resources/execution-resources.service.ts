import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { ExecutionResource } from "./execution-resource";

@Injectable()
export class ExecutionResourcesService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getExecutionResources(
    projectId: string,
    processId: string
  ): Observable<ExecutionResource[]> {
    const params = new HttpParams().set("processId", processId);
    return this.httpClient
      .get<ExecutionResource[]>(this.buildResourcesUrl(projectId), { params })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private buildResourcesUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/resources`;
  }
}
