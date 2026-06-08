import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { FetchMxArtifactsFilter, MxArtifactsPage } from "./model/mx-artifacts";

@Injectable({ providedIn: "root" })
export class ArtifactMxArtifactsService {
  private readonly apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly http: HttpClient
  ) {
    this.apiUrl = `${this.config.gatewayUrl}artifact-management/mxartifacts`;
  }

  getAllMxArtifacts(
    filters: FetchMxArtifactsFilter
  ): Observable<MxArtifactsPage> {
    return this.http
      .get<MxArtifactsPage>(this.apiUrl, {
        params: this.buildFetchMxArtifactsQueryParams(filters),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  private buildFetchMxArtifactsQueryParams(
    filters: FetchMxArtifactsFilter
  ): HttpParams {
    const {
      pageIndex,
      pageSize,
      typeFilter,
      versionFilter,
      buildIdFilter,
      osFilter,
      revisionFilter,
      searchKey,
      projectIds,
      fetchGlobal,
    } = filters;

    let params = new HttpParams()
      .set("page", pageIndex.toString())
      .set("size", pageSize.toString())
      .set("sort", "createdOn,desc");

    const optionalParams: { [key: string]: string | undefined } = {
      typeFilter,
      versionFilter,
      buildIdFilter,
      osFilter,
      revisionFilter,
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

    return params;
  }
}
