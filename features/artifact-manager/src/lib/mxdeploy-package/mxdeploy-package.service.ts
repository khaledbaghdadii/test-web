import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  FetchMxDeployPackagesFilter,
  MxDeployPackage,
  MxDeployPackagesPage,
} from "./model/mxdeploy-package";

@Injectable({ providedIn: "root" })
export class ArtifactMxDeployPackageService {
  apiUrl: string;
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getAllMxDeployPackages(
    filters: FetchMxDeployPackagesFilter
  ): Observable<MxDeployPackagesPage> {
    return this.http
      .get<MxDeployPackagesPage>(this.getMxDeployPackagesUrl(filters))
      .pipe(catchError((error) => throwError(() => error)));
  }

  getMxDeployPackageById(mxDeployPackageId: string, projectId: string) {
    return this.http
      .get<MxDeployPackage>(
        this.getMxDeployPackageByIdUrl(mxDeployPackageId, projectId)
      )
      .pipe(catchError((error) => throwError(() => error)));
  }
  private getMxDeployPackagesUrl(filters: FetchMxDeployPackagesFilter): string {
    let url =
      this.apiUrl +
      `artifact-management/mxdeploy-packages?page=${filters.pageIndex}&size=${filters.pageSize}`;
    if (filters.type) {
      url += `&typeSearch=${encodeURIComponent(filters.type)}`;
    }
    if (filters.os) {
      url += `&operatingSystemSearch=${encodeURIComponent(filters.os)}`;
    }
    if (filters.searchKey) {
      url += `&searchKey=${encodeURIComponent(filters.searchKey)}`;
    }
    if (filters.fetchGlobal != null) {
      url += `&fetchGlobal=${filters.fetchGlobal}`;
    }
    if (filters.projectIds) {
      filters.projectIds.forEach((projectId) => {
        url += `&projectIds=${projectId}`;
      });
    }
    url += "&sort=createdOn%2Cdesc";

    return url;
  }

  private getMxDeployPackageByIdUrl(
    mxDeployPackageId: string | undefined,
    projectId: string
  ): string {
    return (
      this.apiUrl +
      `artifact-management/projects/${projectId}/mxdeploy-packages/${mxDeployPackageId}`
    );
  }
}
