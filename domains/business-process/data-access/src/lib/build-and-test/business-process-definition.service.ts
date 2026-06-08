import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, of, throwError } from "rxjs";
import {
  BusinessProcessDefinition,
  GetBusinessProcessDefinitionsRequest,
} from "./models/business-process-definition.model";

@Injectable()
export class BusinessProcessDefinitionService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getBusinessProcessDefinitions(
    request: GetBusinessProcessDefinitionsRequest
  ): Observable<BusinessProcessDefinition[]> {
    return this.httpClient
      .get<BusinessProcessDefinition[]>(
        `${this.buildUrl(request.projectId)}/definitions`,
        { params: this.toHttpParams(request) }
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  getBusinessProcessDefinition(
    projectId: string,
    definitionId: string
  ): Observable<BusinessProcessDefinition> {
    return this.httpClient
      .get<BusinessProcessDefinition>(
        `${this.buildUrl(projectId)}/definitions/${definitionId}`
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  businessProcessDefinitionExists(
    projectId: string,
    definitionId: string
  ): Observable<boolean> {
    return this.httpClient
      .get<BusinessProcessDefinition>(
        `${this.buildUrl(projectId)}/definitions/${definitionId}`
      )
      .pipe(
        map(() => true),
        catchError((error) => of(error.status !== 404))
      );
  }

  private buildUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process`;
  }

  private toHttpParams(
    request: GetBusinessProcessDefinitionsRequest
  ): HttpParams {
    let params = new HttpParams();
    if (request.extendable !== undefined) {
      params = params.set("extendable", request.extendable);
    }
    if (request.executable !== undefined) {
      params = params.set("executable", request.executable);
    }
    return params;
  }

  private toError(error: {
    error?: { message?: string } | string;
    message?: string;
  }): Error {
    if (typeof error.error === "string") return new Error(error.error);
    return new Error(error.error?.message ?? error.message);
  }
}
