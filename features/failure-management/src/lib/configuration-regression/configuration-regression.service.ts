import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { CreateConfigurationRegressionRequest } from "./create-configuration-regression-modal/create-configuration-regression-request";
import { ConfigurationRegression } from "./model/configuration-regression";
import { ConfigurationRegressionApiResponse } from "./model/configuration-regression-api-response.model";
import { EditConfigurationRegressionRequest } from "./edit-configuration-regression-modal/edit-configuration-regression-request";
import { LiteConfigurationRegression } from "./model/lite-configuration-regression.model";
import {
  FetchConfigurationRegressionsRequest,
  FetchConfigurationRegressionsApiRequest,
} from "./model/fetch-configuration-regressions-request";
import { FetchConfigurationRegressionsApiResponse } from "./model/fetch-configuration-regressions-api-response";
import { FetchConfigurationRegressionsResponse } from "./model/fetch-configuration-regressions-response";

class CreateConfigurationRegressionApiResponse {
  id: string;
}

@Injectable()
export class ConfigurationRegressionService {
  private http = inject(HttpClient);
  private config = inject<AppConfig>(APP_CONFIG);

  private apiUrl: string;

  constructor() {
    const config = this.config;

    this.apiUrl = `${config.gatewayUrl}`;
  }

  create(
    projectId: string,
    request: CreateConfigurationRegressionRequest
  ): Observable<string> {
    const trimmedRequest = {
      title: request.title?.trim(),
      description: request.description,
      guiltyChange: request.guiltyChange.trim(),
      fix: request.fix?.trim(),
    } as CreateConfigurationRegressionRequest;
    return this.http
      .post<CreateConfigurationRegressionApiResponse>(
        this.getBaseUrl(projectId),
        trimmedRequest
      )
      .pipe(
        map((response) => response.id),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetch(
    projectId: string,
    regressionId: string
  ): Observable<ConfigurationRegression> {
    return this.http
      .get<ConfigurationRegressionApiResponse>(
        this.getBaseUrl(projectId) + `/${regressionId}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchAll(
    projectId: string,
    request: FetchConfigurationRegressionsRequest = {}
  ): Observable<FetchConfigurationRegressionsResponse> {
    const pageable = this.getPageable(request);
    const params = new HttpParams({ fromObject: { ...pageable } });
    return this.http
      .post<FetchConfigurationRegressionsApiResponse>(
        this.getFetchAllUrl(projectId),
        this.buildFetchConfigurationRegressionsApiRequest(request),
        { params }
      )
      .pipe(
        map((response) =>
          this.buildFetchConfigurationRegressionsResponse(response)
        ),
        catchError((error) =>
          throwError(() => {
            return new Error(error.error);
          })
        )
      );
  }

  private buildFetchConfigurationRegressionsApiRequest(
    request: FetchConfigurationRegressionsRequest
  ): FetchConfigurationRegressionsApiRequest {
    return {
      ids: request.ids,
      fixPhrase: request.fixPhrase,
      ownerPhrase: request.ownerPhrase,
      titlePhrases: request.titlePhrases,
      guiltyChangePhrases: request.guiltyChangePhrases,
    } as FetchConfigurationRegressionsApiRequest;
  }

  private getPageable(request: FetchConfigurationRegressionsRequest) {
    return {
      page: request.page?.toString() ?? "0",
      size: request.size?.toString() ?? "20",
    };
  }

  fetchByIds(
    projectId: string,
    ids: string[]
  ): Observable<LiteConfigurationRegression[]> {
    const request: FetchConfigurationRegressionsRequest = {
      ids: ids,
      page: 0,
      size: ids.length,
    } as FetchConfigurationRegressionsRequest;
    return this.fetchAll(projectId, request).pipe(
      map((response) => response.configurationRegressions.content)
    );
  }

  private buildFetchConfigurationRegressionsResponse(
    response: FetchConfigurationRegressionsApiResponse
  ): FetchConfigurationRegressionsResponse {
    return {
      configurationRegressions: {
        content: response.configurationRegressions.content,
        totalElements: response.configurationRegressions.totalElements,
      },
    } as FetchConfigurationRegressionsResponse;
  }

  update(
    projectId: string,
    id: string,
    request: EditConfigurationRegressionRequest
  ): Observable<null> {
    const trimmedRequest = {
      title: request.title?.trim(),
      description: request.description,
      fix: request.fix?.trim(),
    } as EditConfigurationRegressionRequest;
    return this.http
      .patch<null>(this.getBaseUrl(projectId) + "/" + id, trimmedRequest)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getFetchAllUrl(projectId: string): string {
    return `${this.getBaseUrl(projectId)}/fetch`;
  }

  getBaseUrl(projectId: string): string {
    return (
      this.apiUrl +
      `projects/${projectId}/failure-management/regressions/configuration`
    );
  }
}
