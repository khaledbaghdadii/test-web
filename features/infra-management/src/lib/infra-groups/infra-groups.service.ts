import { catchError, map, Observable, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { HttpErrorResponse } from "./response/http-error-response";
import { Groups } from "./model/groups";
import { Group } from "./model/group";
import { GroupsAPIResponse } from "./response/groups-api-response";
import { GroupAPIResponse } from "./response/group-api-response";
import {
  AddGroupRequest,
  EditGroupRequest,
  GroupFilterRequest,
} from "./request/group";
import {
  DefaultGroup,
  ProjectInfraRegistryApiResponse,
} from "./response/project-infra-registry-api-reponse";
import { CredentialsAPIResponse } from "./response/credentials-api-response";
import { UpdateCredentialsRequest } from "./request/credentials";
import { Credentials } from "./model/credentials";
import { APP_CONFIG } from "@mxflow/config";
import { GroupMetricsPage } from "./metrics/model/group-metrics-page";

@Injectable()
export class InfraGroupsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly apiUrl = this.config.gatewayUrl;

  getGroups(
    projectId: string,
    pageSize: number,
    pageIndex: number
  ): Observable<Groups> {
    return this.http
      .get<GroupsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "?page=" +
          pageIndex +
          "&size=" +
          pageSize
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  getGroup(projectId: string, groupId: string): Observable<Group> {
    return this.http
      .get<GroupAPIResponse>(this.getGroupsApiUrl(projectId) + "/" + groupId)
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  getGroupMetrics(
    projectId: string,
    pageSize: number,
    pageIndex: number,
    groupIds?: string[]
  ): Observable<GroupMetricsPage> {
    return this.http
      .get<GroupMetricsPage>(
        this.getGroupMetricsApiUrl(projectId, pageSize, pageIndex, groupIds)
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => new Error(this.handleError(errorResponse)))
        )
      );
  }

  searchGroups(
    projectId: string,
    pageSize: number,
    pageIndex: number,
    request: GroupFilterRequest
  ) {
    return this.http
      .post<GroupsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "/filter" +
          "?" +
          "page=" +
          pageIndex +
          "&size=" +
          pageSize +
          "&sort=name",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  deleteGroup(projectId: string, groupId: string) {
    return this.http
      .delete(this.getGroupsApiUrl(projectId) + "/" + groupId)
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  createGroup(projectId: string, group: AddGroupRequest): Observable<Group> {
    return this.http
      .post<GroupAPIResponse>(this.getGroupsApiUrl(projectId), group)
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  editGroup(
    projectId: string,
    groupId: string,
    group: EditGroupRequest
  ): Observable<Group> {
    return this.http
      .put<GroupAPIResponse>(
        this.getGroupsApiUrl(projectId) + "/" + groupId,
        group
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  updateGroupDefaultSshCredentials(
    projectId: string,
    groupId: string,
    request: UpdateCredentialsRequest
  ): Observable<Credentials> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-ssh-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  removeGroupDefaultSshCredentials(projectId: string, groupId: string) {
    return this.http
      .delete(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-ssh-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  updateGroupDefaultMssqlCredentials(
    projectId: string,
    groupId: string,
    request: UpdateCredentialsRequest
  ): Observable<Credentials> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-mssql-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  removeGroupDefaultMssqlCredentials(projectId: string, groupId: string) {
    return this.http
      .delete(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-mssql-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  updateGroupDefaultOracleCredentials(
    projectId: string,
    groupId: string,
    request: UpdateCredentialsRequest
  ): Observable<Credentials> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-oracle-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  removeGroupDefaultOracleCredentials(projectId: string, groupId: string) {
    return this.http
      .delete(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-oracle-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  updateGroupDefaultPostgresCredentials(
    projectId: string,
    groupId: string,
    request: UpdateCredentialsRequest
  ): Observable<Credentials> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-postgres-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  removeGroupDefaultPostgresCredentials(projectId: string, groupId: string) {
    return this.http
      .delete(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-postgres-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  updateGroupDefaultSybaseCredentials(
    projectId: string,
    groupId: string,
    request: UpdateCredentialsRequest
  ): Observable<Credentials> {
    return this.http
      .put<CredentialsAPIResponse>(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-sybase-admin-credentials",
        request
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  removeGroupDefaultSybaseCredentials(projectId: string, groupId: string) {
    return this.http
      .delete(
        this.getGroupsApiUrl(projectId) +
          "/" +
          groupId +
          "/default-sybase-admin-credentials"
      )
      .pipe(
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleUpdateError(errorResponse))
        )
      );
  }

  getProjectInfraRegistryConfig(projectId: string): Observable<DefaultGroup> {
    return this.http
      .get<ProjectInfraRegistryApiResponse>(
        this.getProjectInfraRegistryGroupId(projectId)
      )
      .pipe(
        map(
          (response: ProjectInfraRegistryApiResponse): DefaultGroup =>
            this.mapApiResponseToDefaultGroup(response)
        ),
        catchError((errorResponse: HttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  private mapApiResponseToDefaultGroup(
    response: ProjectInfraRegistryApiResponse
  ) {
    return {
      name: response.defaultGroup.name,
      projectId: response.defaultGroup.projectId,
      id: response.defaultGroup.id,
    };
  }

  private getProjectInfraRegistryGroupId(projectId: string): string {
    return this.apiUrl + "projects/" + projectId + "/infra/registry/config";
  }

  getGroupsApiUrl(projectId: string): string {
    return this.apiUrl + "projects/" + projectId + "/infra/registry/groups";
  }

  handleError(errorResponse: HttpErrorResponse): string {
    if (
      errorResponse.error.message == null ||
      errorResponse.error.message == ""
    ) {
      return "Could not fetch groups details";
    } else {
      return errorResponse.error.message;
    }
  }

  handleUpdateError(errorResponse: HttpErrorResponse): string {
    if (
      errorResponse.error.message == null ||
      errorResponse.error.message == ""
    ) {
      return "Could not update group details";
    } else {
      return errorResponse.error.message;
    }
  }

  private getGroupMetricsApiUrl(
    projectId: string,
    pageSize: number,
    pageIndex: number,
    groupIds?: string[]
  ) {
    let url = `${this.apiUrl}projects/${projectId}/infra/management/groups/metrics?page=${pageIndex}&size=${pageSize}`;
    if (groupIds) {
      groupIds.forEach((groupId) => {
        url += "&groupIds=" + groupId;
      });
    }
    return url;
  }
}
