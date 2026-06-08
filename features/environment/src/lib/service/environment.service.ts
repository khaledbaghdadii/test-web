import { inject, Injectable } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { EnvironmentDefinition } from "../environment-definition";

import { EnvironmentDefinitionApiModel } from "./models/environment-definition.model";
import {
  ConfigurationEditorProperties,
  Environment,
  Page,
} from "./models/environment.model";
import { EnvironmentManagementRequestApiModel } from "./models/environment-management-request-api-model";
import {
  ConfigurationEditorPropertiesApiModel,
  EnvironmentApiModel,
} from "./models/environment-api.model";
import { EnvironmentFilters } from "./models/EnvironmentFilters";
import { EnvironmentServicesApiModel } from "./models/environment-services-api.model";
import { EnvironmentServiceModel } from "./models/environment-service.model";
import { MXClientDetailsApiModel } from "./models/mxclient-details-api.model";

@Injectable({
  providedIn: "root",
})
export class EnvironmentService {
  private readonly config: AppConfig = inject(APP_CONFIG);
  private readonly http: HttpClient = inject(HttpClient);

  getEnvironmentDefinitions(
    projectId: string,
    includeInactive = false
  ): Observable<EnvironmentDefinition[]> {
    return this.http
      .get<EnvironmentDefinitionApiModel[]>(
        this.config.gatewayUrl +
          `projects/${projectId}/environments/definitions`,
        {
          params: new HttpParams().set("includeInactive", includeInactive),
        }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  getEnvironmentDefinitionById(
    projectId: string,
    envId: string
  ): Observable<EnvironmentDefinition> {
    return this.http
      .get<EnvironmentDefinitionApiModel>(
        this.config.gatewayUrl +
          `projects/${projectId}/environments/definitions/${envId}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  getEnvironmentExecutionById(
    projectId: string,
    environmentId: string
  ): Observable<Environment> {
    return this.http
      .get<EnvironmentApiModel>(
        this.config.gatewayUrl +
          `projects/${projectId}/environments/${environmentId}`
      )
      .pipe(
        map((apiModel) => this.toEnvironment(apiModel)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  getMXClientDetails(
    projectId: string,
    environmentId: string
  ): Observable<MXClientDetailsApiModel> {
    return this.http
      .get<MXClientDetailsApiModel>(
        this.config.gatewayUrl +
          `projects/${projectId}/environments/${environmentId}/mxclient-details`
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        })
      );
  }

  getEnvironmentRequestTerminationMessage(
    environmentId: string,
    projectId: string
  ): Observable<string | undefined> {
    return this.http
      .get<EnvironmentManagementRequestApiModel[]>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/requests`
      )
      .pipe(
        map((envRequests) => {
          const deploymentEnvRquest = envRequests.find(
            (e) => e.type === "deployment"
          );
          return deploymentEnvRquest
            ? deploymentEnvRquest.result?.message
            : undefined;
        }),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  getAllEnvironments(
    pageSize: number,
    pageIndex: number,
    filters: EnvironmentFilters
  ): Observable<Page<Environment>> {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("page", pageIndex);
    queryParams = queryParams.append("size", pageSize);
    queryParams = queryParams.append("sort", "createdOn,asc");

    if (filters.environmentIds.length > 0)
      queryParams = queryParams.append(
        "environmentId",
        filters.environmentIds.join(",")
      );
    if (filters.projectId.length > 0)
      queryParams = queryParams.append(
        "projectId",
        filters.projectId.join(",")
      );
    if (filters.createdBy)
      queryParams = queryParams.append("createdBy", filters.createdBy);
    if (filters.status.length > 0)
      queryParams = queryParams.append("status", filters.status.join(","));

    if (filters.startDate !== "" && filters.endDate !== "") {
      queryParams = queryParams.append("createdOnStartDate", filters.startDate);
      queryParams = queryParams.append("createdOnEndDate", filters.endDate);
    }
    if (filters.applicationHost.length > 0)
      queryParams = queryParams.append(
        "applicationHost",
        filters.applicationHost
      );
    if (filters.databaseHost.length > 0)
      queryParams = queryParams.append("databaseHost", filters.databaseHost);

    if (filters.allocationIds.length > 0)
      queryParams = queryParams.append(
        "allocationId",
        filters.allocationIds.join(",")
      );

    return this.http
      .get<Page<Environment>>(this.config.gatewayUrl + `environments`, {
        params: queryParams,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  getEnvironmentServices(
    projectId: string,
    environmentId: string
  ): Observable<EnvironmentServiceModel[]> {
    return this.http
      .get<EnvironmentServicesApiModel>(
        this.config.gatewayUrl +
          `projects/${projectId}/environments/${environmentId}/services/status`
      )
      .pipe(
        map((apiModel) => apiModel.services),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  excludeFromShutdown(
    projectId: string,
    environmentId: string,
    exclude: boolean
  ): Observable<void> {
    return this.http
      .post<void>(
        `${this.config.gatewayUrl}projects/${projectId}/environments/${environmentId}/services/exclude-from-shutdown/${exclude}`,
        {}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(
            () => new Error(error.error?.message ?? error.message)
          );
        })
      );
  }

  private toEnvironment(apiModel: EnvironmentApiModel): Environment {
    return {
      id: apiModel.id,
      projectId: apiModel.projectId,
      status: apiModel.status,
      configurationIdentifier: {
        branch: apiModel.configurationIdentifier?.branch,
        revision: apiModel.configurationIdentifier?.revision,
      },
      outputsDirectoryUri: apiModel.outputsDirectoryUri,
      primaryApplicative: apiModel.primaryApplicative,
      secondaryApplicatives: apiModel.secondaryApplicatives,
      maintenance: apiModel.maintenance,
      tests: apiModel.tests,
      bundles: apiModel.bundles,
      isTools: apiModel.isTools,
      clonedRepositoryPath: apiModel.clonedRepositoryPath,
      clonedRepository: apiModel.clonedRepository,
      clients: apiModel.clients,
      allocationId: apiModel.allocationId,
      databases: apiModel.databases,
      createdOn: apiModel.createdOn,
      createdBy: apiModel.createdBy,
      environmentDefinition: apiModel.environmentDefinition,
      environmentActions: apiModel.environmentActions,
      secureClientArtifactUri: apiModel.secureClientArtifactUri,
      webClientUrl: apiModel.webClientUrl,
      environmentSource: apiModel.environmentSource,
      environmentDeploymentMode: apiModel.environmentDeploymentMode,
      excludeFromShutdown: apiModel.excludeFromShutdown,
      configurationEditorProperties: this.mapConfigurationEditorProperties(
        apiModel.configurationEditorProperties
      ),
      clientRepositoryConfiguration: apiModel.clientRepositoryConfiguration,
      parentResources: apiModel.parentResources,
      configurationRepository: apiModel.configurationRepository
        ? {
            id: apiModel.configurationRepository.id,
          }
        : undefined,
    };
  }

  private mapConfigurationEditorProperties(
    properties: ConfigurationEditorPropertiesApiModel | undefined
  ): ConfigurationEditorProperties | undefined {
    if (!properties) {
      return undefined;
    }
    return {
      ...properties,
    } as ConfigurationEditorProperties;
  }
}
