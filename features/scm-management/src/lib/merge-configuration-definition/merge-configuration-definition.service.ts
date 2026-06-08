import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";

import { MergeConfigurationDefinitionApiPage } from "./model/response/merge-configuration-definition-api-page";
import { MergeConfigurationDefinitionApiCreateRequest } from "./model/request/merge-configuration-definition-api-create-request";
import { MergeConfigurationDefinitionApiResponse } from "./model/response/merge-configuration-definition-api-response";
import { MergeConfigurationDefinitionApiUpdateRequest } from "./model/request/merge-configuration-definition-api-update-request";
import { MergeConfigurationDefinitionCreateRequest } from "./model/request/merge-configuration-definition-create-request";
import { MergeConfigurationDefinitionApiFilterRequest } from "./model/request/merge-configuration-definition-api-filter-request";
import { InfraResourceSettings } from "./model/infra-resource-settings";
import { MergeConfigurationDefinitionFilterRequest } from "./model/request/merge-configuration-definition-filter-request";
import { MergeConfigurationDefinitionUpdateRequest } from "./model/request/merge-configuration-definition-update-request";
import { InfraResourceSettingsApiResponse } from "./model/response/infra-resource-settings-api-response";
import { ErrorHandler } from "../error-handling/error-handler";

@Injectable({
  providedIn: "root",
})
export class MergeConfigurationDefinitionService {
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly http = inject(HttpClient);

  private readonly baseUrlSegment = "settings/merge-configuration-definitions";
  private readonly defaultPageSize = 20;
  private readonly defaultPageIndex = 0;

  addMergeConfigurationDefinition(
    projectId: string,
    request: MergeConfigurationDefinitionCreateRequest
  ): Observable<MergeConfigurationDefinitionApiResponse> {
    const apiRequest = this.mapToApiCreateRequest(projectId, request);
    const url = this.buildUrl(projectId, this.baseUrlSegment);

    return this.http
      .post<MergeConfigurationDefinitionApiResponse>(url, apiRequest)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  updateMergeConfigurationDefinition(
    projectId: string,
    request: MergeConfigurationDefinitionUpdateRequest
  ): Observable<MergeConfigurationDefinitionApiResponse> {
    const apiRequest = this.mapToApiUpdateRequest(projectId, request);
    const url = this.buildUrl(projectId, this.baseUrlSegment, request.id);

    return this.http
      .put<MergeConfigurationDefinitionApiResponse>(url, apiRequest)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getAllMergeConfigurationDefinitions(
    projectId: string,
    pageSize: number = this.defaultPageSize,
    pageIndex: number = this.defaultPageIndex
  ): Observable<MergeConfigurationDefinitionApiPage> {
    const url = this.buildUrl(projectId, this.baseUrlSegment);
    const params = this.buildPaginationParams(pageSize, pageIndex);

    return this.http
      .get<MergeConfigurationDefinitionApiPage>(url, { params })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  deleteMergeConfigurationDefinition(
    projectId: string,
    mergeConfigurationDefinitionId: string
  ): Observable<void> {
    const url = this.buildUrl(
      projectId,
      this.baseUrlSegment,
      mergeConfigurationDefinitionId
    );

    return this.http
      .delete<void>(url)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getFilteredMergeConfigurationDefinitions(
    projectId: string,
    filterRequest: MergeConfigurationDefinitionFilterRequest,
    pageSize: number = this.defaultPageSize,
    pageIndex: number = this.defaultPageIndex
  ): Observable<MergeConfigurationDefinitionApiPage> {
    const url = this.buildUrl(projectId, this.baseUrlSegment, "filter");
    const params = this.buildPaginationParams(pageSize, pageIndex);
    const apiFilterRequest: MergeConfigurationDefinitionApiFilterRequest = {
      searchKey: filterRequest.searchKey,
      repositoryId: filterRequest.repositoryId,
    };

    return this.http
      .post<MergeConfigurationDefinitionApiPage>(url, apiFilterRequest, {
        params,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getInfraResourceSettingsByInfraGroupIds(
    projectId: string,
    groupIds: string[]
  ): Observable<InfraResourceSettings[]> {
    const url = this.buildUrl(
      projectId,
      this.baseUrlSegment,
      "infra-resource-settings"
    );
    const params = new HttpParams().set("infraGroupIds", groupIds.join(","));

    return this.http
      .get<InfraResourceSettingsApiResponse[]>(url, { params })
      .pipe(
        map((responses) => this.mapToInfraResourceSettings(responses)),
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  private mapToApiCreateRequest(
    projectId: string,
    request: MergeConfigurationDefinitionCreateRequest
  ): MergeConfigurationDefinitionApiCreateRequest {
    return {
      repositoryId: request.repositoryId,
      branchPattern: request.branchPattern,
      scenarioDefinitionId: request.scenarioDefinitionId,
      automergeEnabled: request.automergeEnabled,
      automergeTimeout: request.automergeTimeout,
      automergeBulkEnabled: request.automergeBulkEnabled,
      runFullMaintenance: request.runFullMaintenance,
      automergeBulkSize: request.automergeBulkSize,
      deltaConfigImportEnabled: request.deltaConfigImportEnabled,
      infraResourceSettings: {
        infraGroupId: request.infraResourceSettings.infraGroupId,
        projectId,
        maxNumberOfFailedEnvironmentsToKeep:
          request.infraResourceSettings.maxNumberOfFailedEnvironmentsToKeep,
      },
    };
  }

  private mapToApiUpdateRequest(
    projectId: string,
    request: MergeConfigurationDefinitionUpdateRequest
  ): MergeConfigurationDefinitionApiUpdateRequest {
    return {
      scenarioDefinitionId: request.scenarioDefinitionId,
      automergeEnabled: request.automergeEnabled,
      automergeTimeout: request.automergeTimeout,
      automergeBulkEnabled: request.automergeBulkEnabled,
      runFullMaintenance: request.runFullMaintenance,
      automergeBulkSize: request.automergeBulkSize,
      deltaConfigImportEnabled: request.deltaConfigImportEnabled,
      infraResourceSettings: {
        infraGroupId: request.infraResourceSettings.infraGroupId,
        projectId,
        maxNumberOfFailedEnvironmentsToKeep:
          request.infraResourceSettings.maxNumberOfFailedEnvironmentsToKeep,
      },
    };
  }

  private mapToInfraResourceSettings(
    responses: InfraResourceSettingsApiResponse[]
  ): InfraResourceSettings[] {
    return responses.map((response) => ({
      infraGroupId: response.infraGroupId,
      maxNumberOfFailedEnvironmentsToKeep:
        response.maxNumberOfFailedEnvironmentsToKeep,
    }));
  }

  private buildPaginationParams(
    pageSize: number,
    pageIndex: number
  ): HttpParams {
    return new HttpParams()
      .set("page", pageIndex.toString())
      .set("size", pageSize.toString());
  }

  private buildUrl(projectId: string, ...segments: string[]): string {
    const baseUrl = `${this.config.gatewayUrl}scm-management/projects/${projectId}/`;
    return baseUrl + segments.join("/");
  }
}
