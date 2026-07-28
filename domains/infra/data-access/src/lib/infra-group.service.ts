import { catchError, map, Observable, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  DefaultGroup,
  Group,
  GroupAPIResponse,
  GroupFilterRequest,
  Groups,
  GroupsAPIResponse,
  InfraGroupsHttpErrorResponse,
  ProjectInfraRegistryApiResponse,
} from "./infra-group.model";

/**
 * Infra-group registry lookups. Consolidated from the pre-existing minimal
 * `getGroup` (single-group lookup, still used by `infra/widget`'s
 * `InfraGroupNameComponent`) plus the list/search + registry-config calls that
 * were migrated verbatim (duplicating this same `getGroup` endpoint) into
 * `business-process/data-access` for the business-process infra-group
 * selector. The business-process copy was deleted in favor of this single
 * consolidated service (VAL-27132 follow-up cleanup).
 */
@Injectable()
export class InfraGroupService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly apiUrl = this.config.gatewayUrl;

  getGroup(projectId: string, groupId: string): Observable<Group> {
    return this.http
      .get<GroupAPIResponse>(this.getGroupsApiUrl(projectId) + "/" + groupId)
      .pipe(
        catchError((errorResponse: InfraGroupsHttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

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
        catchError((errorResponse: InfraGroupsHttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  searchGroups(
    projectId: string,
    pageSize: number,
    pageIndex: number,
    request: GroupFilterRequest
  ): Observable<Groups> {
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
        catchError((errorResponse: InfraGroupsHttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
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
        catchError((errorResponse: InfraGroupsHttpErrorResponse) =>
          throwError(() => this.handleError(errorResponse))
        )
      );
  }

  private mapApiResponseToDefaultGroup(
    response: ProjectInfraRegistryApiResponse
  ): DefaultGroup {
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

  handleError(errorResponse: InfraGroupsHttpErrorResponse): string {
    if (
      errorResponse.error.message == null ||
      errorResponse.error.message == ""
    ) {
      return "Could not fetch groups details";
    } else {
      return errorResponse.error.message;
    }
  }
}
