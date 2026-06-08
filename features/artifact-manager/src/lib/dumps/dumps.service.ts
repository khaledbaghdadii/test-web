import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { Dump, DumpsPage, FetchDumpsFilter } from "./model/dump";
import { CreateDumpRequest } from "./model/request/create-dump-request";
import { UpdateDumpRequest } from "./model/request/update-dump-request";

@Injectable({ providedIn: "root" })
export class ArtifactDumpsService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getAllDumps(filters: FetchDumpsFilter): Observable<DumpsPage> {
    return this.http
      .get<DumpsPage>(this.apiUrl + `artifact-management/dumps`, {
        params: this.buildGetAllDumpsQueryParams(filters),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  createDump(projectId: string, request: CreateDumpRequest): Observable<Dump> {
    return this.http
      .post<Dump>(this.getCreateDumpUrl(projectId), request)
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateDump(
    projectId: string,
    dumpId: string,
    request: UpdateDumpRequest
  ): Observable<Dump> {
    return this.http
      .put<Dump>(this.getUpdateDumpUrl(projectId, dumpId), request)
      .pipe(catchError((error) => throwError(() => error)));
  }

  archiveDump(projectId: string, dumpId: string): Observable<void> {
    return this.http
      .put<void>(this.getArchiveDumpUrl(projectId, dumpId), null)
      .pipe(catchError((error) => throwError(() => error)));
  }

  private buildGetAllDumpsQueryParams(filters: FetchDumpsFilter): HttpParams {
    const { pageIndex, pageSize, searchKey, projectIds, archived, purged } =
      filters;
    let params = new HttpParams()
      .set("page", pageIndex.toString())
      .set("size", pageSize.toString())
      .set("sort", "createdOn,desc");
    const optionalParams: { [key: string]: string | undefined } = {
      searchKey,
    };
    Object.entries(optionalParams).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    if (projectIds) {
      projectIds.forEach((id) => {
        params = params.append("projectIds", id);
      });
    }
    if (archived !== undefined && archived !== null) {
      params = params.set("archived", archived.toString());
    }
    if (purged !== undefined && purged !== null) {
      params = params.set("purged", purged.toString());
    }
    return params;
  }

  private getCreateDumpUrl(projectId: string): string {
    return this.apiUrl + `artifact-management/projects/${projectId}/dumps`;
  }

  private getUpdateDumpUrl(projectId: string, dumpId: string): string {
    return (
      this.apiUrl + `artifact-management/projects/${projectId}/dumps/${dumpId}`
    );
  }

  private getArchiveDumpUrl(projectId: string, dumpId: string): string {
    return (
      this.apiUrl +
      `artifact-management/projects/${projectId}/dumps/${dumpId}/archive`
    );
  }
}
