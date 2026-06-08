import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  BundlesPage,
  FetchBundlesFilter,
  FetchProjectSpecificBundlesFilter,
} from "./model/bundles";

@Injectable({ providedIn: "root" })
export class ArtifactBundlesService {
  private readonly apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly http: HttpClient
  ) {
    this.apiUrl = `${this.config.gatewayUrl}artifact-management`;
  }

  getAllBundles(filters: FetchBundlesFilter): Observable<BundlesPage> {
    return this.http
      .get<BundlesPage>(this.getGetGlobalBundlesUri(), {
        params: this.buildFetchBundlesQueryParams(filters),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  getProjectSpecificBundles(
    filtersRequest: FetchProjectSpecificBundlesFilter
  ): Observable<BundlesPage> {
    return this.http
      .get<BundlesPage>(
        this.getProjectSpecificBundlesUri(filtersRequest.projectId),
        {
          params:
            this.getFetchProjectSpecificBundlesQueryParams(filtersRequest),
        }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  private buildFetchBundlesQueryParams(
    filters: FetchBundlesFilter
  ): HttpParams {
    const {
      pageIndex,
      pageSize,
      type,
      version,
      buildId,
      revision,
      searchKey,
      projectIds,
      fetchGlobal,
    } = filters;

    let params = new HttpParams()
      .set("page", pageIndex.toString())
      .set("size", pageSize.toString())
      .set("sort", "createdOn,desc");

    const optionalParams: { [key: string]: string | undefined } = {
      type,
      version,
      buildId,
      revision,
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

  private getGetGlobalBundlesUri(): string {
    return `${this.apiUrl}/mxbundles`;
  }

  private getProjectSpecificBundlesUri(projectId: string): string {
    return `${this.apiUrl}/projects/${projectId}/mxbundles`;
  }

  private getFetchProjectSpecificBundlesQueryParams(
    filtersRequest: FetchProjectSpecificBundlesFilter
  ): HttpParams {
    let params = new HttpParams()
      .set("page", filtersRequest.pageIndex.toString())
      .set("size", filtersRequest.pageSize.toString())
      .set("sort", "createdOn,desc");
    if (
      filtersRequest.bundleIds != undefined &&
      filtersRequest.bundleIds.length > 0
    ) {
      filtersRequest.bundleIds.forEach((id) => {
        params = params.append("mxBundleIds", id);
      });
    }
    return params;
  }
}
