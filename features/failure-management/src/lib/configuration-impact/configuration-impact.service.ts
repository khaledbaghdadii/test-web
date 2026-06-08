import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { CreateConfigurationImpactRequest } from "./create-configuration-impact-modal/create-configuration-impact-request";
import { ConfigurationImpact } from "./model/configuration-impact";
import { EditConfigurationImpactRequest } from "./edit-configuration-impact-modal/edit-configuration-impact-request.model";
import { LiteConfigurationImpact } from "./model/lite-configuration-impact.model";
import { FetchConfigurationImpactsRequest } from "./model/fetch-configuration-impacts-request";
import {
  ConfigurationImpactApiResponse,
  FetchConfigurationImpactsApiResponse,
} from "./model/fetch-configuration-impacts-api-response";
import { FetchConfigurationImpactsResponse } from "./model/fetch-configuration-impacts-response";
import { FetchConfigurationImpactsApiRequest } from "./model/fetch-configuration-impacts-api-request";

class CreateConfigurationImpactApiResponse {
  id: string;
}

@Injectable()
export class ConfigurationImpactService {
  private http = inject(HttpClient);
  private config = inject<AppConfig>(APP_CONFIG);

  private readonly apiUrl: string;

  constructor() {
    const config = this.config;

    this.apiUrl = `${config.gatewayUrl}`;
  }

  create(
    projectId: string,
    request: CreateConfigurationImpactRequest
  ): Observable<string> {
    const trimmedRequest = {
      title: request.title.trim(),
      description: request.description,
      guiltyChange: request.guiltyChange?.trim(),
    } as CreateConfigurationImpactRequest;
    return this.http
      .post<CreateConfigurationImpactApiResponse>(
        this.apiUrl +
          `projects/${projectId}/failure-management/impacts/configuration`,
        trimmedRequest
      )
      .pipe(
        map((response) => response.id),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchAll(
    projectId: string,
    request: FetchConfigurationImpactsRequest = {}
  ): Observable<FetchConfigurationImpactsResponse> {
    const pageable = this.getPageable(request);
    const params = new HttpParams({ fromObject: { ...pageable } });
    return this.http
      .post<FetchConfigurationImpactsApiResponse>(
        this.getFetchAllUrl(projectId),
        this.buildFetchConfigurationImpactsApiRequest(request),
        { params }
      )
      .pipe(
        map((response) =>
          this.buildFetchConfigurationImpactsResponse(response)
        ),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchByIds(
    projectId: string,
    ids: string[]
  ): Observable<LiteConfigurationImpact[]> {
    const request: FetchConfigurationImpactsRequest = {
      ids: ids,
      page: 0,
      size: ids.length,
    } as FetchConfigurationImpactsRequest;
    return this.fetchAll(projectId, request).pipe(
      map((response) => response.configurationImpacts.content)
    );
  }

  fetch(
    projectId: string,
    configurationImpactId: string
  ): Observable<ConfigurationImpact> {
    return this.http
      .get<ConfigurationImpactApiResponse>(
        this.getBaseUrl(projectId) + "/" + configurationImpactId
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  update(
    projectId: string,
    configurationImpactId: string,
    request: EditConfigurationImpactRequest
  ): Observable<void> {
    const trimmedRequest = {
      title: request.title?.trim(),
      description: request.description,
    } as EditConfigurationImpactRequest;
    return this.http
      .patch<void>(
        this.getBaseUrl(projectId) + "/" + configurationImpactId,
        trimmedRequest
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private buildFetchConfigurationImpactsResponse(
    response: FetchConfigurationImpactsApiResponse
  ): FetchConfigurationImpactsResponse {
    return {
      configurationImpacts: {
        content: response.configurationImpacts.content,
        totalElements: response.configurationImpacts.totalElements,
      },
    } as FetchConfigurationImpactsResponse;
  }

  private buildFetchConfigurationImpactsApiRequest(
    request: FetchConfigurationImpactsRequest
  ): FetchConfigurationImpactsApiRequest {
    return {
      ids: request.ids,
      titlePhrase: request.titlePhrase,
      ownerPhrase: request.ownerPhrase,
      guiltyChangePhrase: request.guiltyChangePhrase,
    } as FetchConfigurationImpactsApiRequest;
  }

  private getPageable(request: FetchConfigurationImpactsRequest) {
    return {
      page: request.page?.toString() ?? "0",
      size: request.size?.toString() ?? "20",
    };
  }

  getFetchAllUrl(projectId: string): string {
    return `${this.getBaseUrl(projectId)}/fetch`;
  }

  getBaseUrl(projectId: string): string {
    return (
      this.apiUrl +
      `projects/${projectId}/failure-management/impacts/configuration`
    );
  }
}
