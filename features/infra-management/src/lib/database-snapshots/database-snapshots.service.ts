import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  DatabaseSnapshotPage,
  FetchDatabaseSnapshotsFilter,
} from "./model/database-snapshot";
import { CreateDatabaseSnapshotFromDumpsRequest } from "./model/request/create-database-snapshot-request";

import { CreateDatabaseSnapshotApiResponse } from "./model/response/create-database-snapshot-api-response";

import { CreateDatabaseSnapshotResponse } from "./model/response/create-database-snapshot-response";

import { DatabaseSnapshotErrorResponse } from "./model/response/database-snapshot-error-response";
@Injectable({ providedIn: "root" })
export class DatabaseSnapshotService {
  private readonly apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  createDatabaseSnapshotFromDumps(
    projectId: string,
    request: CreateDatabaseSnapshotFromDumpsRequest
  ): Observable<CreateDatabaseSnapshotResponse> {
    return this.http
      .post<CreateDatabaseSnapshotApiResponse>(
        this.getCreateDatabaseSnapshotFromDumpsUrl(projectId),
        request
      )
      .pipe(
        map(
          (
            response: CreateDatabaseSnapshotApiResponse
          ): CreateDatabaseSnapshotResponse =>
            this.mapApiResponseToCreateDatabaseSnapshotResponse(response)
        ),
        catchError((error) =>
          throwError(() => new Error(this.getCreateSnapshotErrors(error.error)))
        )
      );
  }

  getAllDatabaseSnapshots(
    filters: FetchDatabaseSnapshotsFilter
  ): Observable<DatabaseSnapshotPage> {
    return this.http
      .get<DatabaseSnapshotPage>(this.getGetAllDatabaseSnapshotsUrl(), {
        params: this.buildQueryParams(filters),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  deleteDatabaseSnapshot(databaseSnapshotId: string, projectId: string) {
    return this.http
      .put<void>(
        this.getDeleteDatabaseSnapshotUrl(databaseSnapshotId, projectId),
        {}
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getGetAllDatabaseSnapshotsUrl(): string {
    return this.apiUrl + "infra/management/database-snapshots";
  }

  private getDeleteDatabaseSnapshotUrl(
    databaseSnapshotId: string,
    projectId: string
  ): string {
    return (
      this.apiUrl +
      `projects/${projectId}/infra/management/database-snapshots/${databaseSnapshotId}/deallocate`
    );
  }

  private buildQueryParams(filters: FetchDatabaseSnapshotsFilter): HttpParams {
    let params = new HttpParams()
      .set("page", filters.pageIndex.toString())
      .set("size", filters.pageSize.toString())
      .set("sort", "createdOn,desc");

    const appendArrayParams = (key: string, values?: string[]) =>
      values?.forEach((value) => (params = params.append(key, value)));

    const appendOptionalParam = (key: string, value?: string) =>
      value && (params = params.set(key, value));

    appendOptionalParam("searchKey", filters.searchKey);
    appendOptionalParam(
      "databaseSnapshotSource",
      filters.databaseSnapshotSource
    );
    appendOptionalParam(
      "sourceDatabaseInstanceNameSearch",
      filters.sourceDatabaseInstanceNameSearchKey
    );
    appendOptionalParam("pluginSearch", filters.pluginSearchKey);
    appendOptionalParam("externalIdSearch", filters.externalIdSearchKey);
    appendArrayParams("projectIds", filters.projectIds);
    appendArrayParams("databaseSnapshotTypes", filters.databaseSnapshotTypes);
    appendArrayParams("databaseSnapshotStates", filters.databaseSnapshotStates);
    appendArrayParams("dumpIds", filters.dumpIds);
    return params;
  }

  private getCreateDatabaseSnapshotFromDumpsUrl(projectId: string): string {
    return (
      this.apiUrl +
      "projects/" +
      projectId +
      "/infra/management/database-snapshots"
    );
  }

  private mapApiResponseToCreateDatabaseSnapshotResponse(
    response: CreateDatabaseSnapshotApiResponse
  ): CreateDatabaseSnapshotResponse {
    return {
      id: response.id,
    };
  }

  private getCreateSnapshotErrors(
    error: DatabaseSnapshotErrorResponse
  ): string {
    const errors = error.errors ?? {};
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.keys(errors)
        .map((key) => `${errors[key]}`)
        .join("\n ");
      return errorMessages;
    }
    return error.message || "An unknown error occurred";
  }
}
