import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { LookupStorageLocationRequest } from "./model/request/lookup-storage-location-request";
import { LookupStorageLocationResponse } from "./model/response/lookup-storage-location-response";
import { FetchStoragesFilter, StoragePage } from "./model/storage";

@Injectable({ providedIn: "root" })
export class ArtifactStorageService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  lookupStorageLocation(
    projectId: string,
    request: LookupStorageLocationRequest
  ): Observable<LookupStorageLocationResponse> {
    return this.http
      .get<LookupStorageLocationResponse>(
        this.getLookupStorageLocationUrl(projectId, request)
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getLookupStorageLocationUrl(
    projectId: string,
    request: LookupStorageLocationRequest
  ): string {
    return (
      this.apiUrl +
      `artifact-management/projects/${projectId}/storages/lookup?fullPath=${encodeURIComponent(
        request.fullPath
      )}`
    );
  }

  getFilteredStorages(filters: FetchStoragesFilter): Observable<StoragePage> {
    return this.http
      .get<StoragePage>(this.apiUrl + `artifact-management/storages`, {
        params: this.buildFetchStoragesQueryParams(filters),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  private buildFetchStoragesQueryParams(
    filters: FetchStoragesFilter
  ): HttpParams {
    const {
      pageIndex,
      pageSize,
      storageType,
      searchKey,
      projectIds,
      fetchGlobal,
      useCases,
    } = filters;
    let params = new HttpParams()
      .set("page", pageIndex.toString())
      .set("size", pageSize.toString())
      .set("sort", "createdOn,desc");
    const optionalParams: { [key: string]: string | undefined } = {
      storageType,
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
    if (fetchGlobal != null) {
      params = params.set("fetchGlobal", fetchGlobal.toString());
    }
    if (useCases) {
      useCases.forEach((useCase) => {
        params = params.append("useCases", useCase);
      });
    }
    return params;
  }
}
