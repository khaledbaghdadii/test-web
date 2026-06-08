import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { FetchLicensesFilter, License, LicensesPage } from "./model/license";
import { CreateLicenseRequest } from "./model/request/create-license-request";

@Injectable({ providedIn: "root" })
export class ArtifactLicensesService {
  apiUrl: string;
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getAllLicenses(filters: FetchLicensesFilter): Observable<LicensesPage> {
    return this.http
      .get<LicensesPage>(this.getLicensesUrl(filters))
      .pipe(catchError((error) => throwError(() => error)));
  }

  createLicense(
    projectId: string,
    request: CreateLicenseRequest
  ): Observable<License> {
    return this.http
      .post<License>(this.getCreateLicenseUrl(projectId), request)
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getCreateLicenseUrl(projectId: string): string {
    return this.apiUrl + `artifact-management/projects/${projectId}/licenses`;
  }

  private getLicensesUrl(filters: FetchLicensesFilter): string {
    let url =
      this.apiUrl +
      `artifact-management/licenses?page=${filters.pageIndex}&size=${filters.pageSize}`;
    if (filters.projectIds && filters.projectIds.length > 0) {
      filters.projectIds.forEach((projectId) => {
        url += `&projectIds=${encodeURIComponent(projectId)}`;
      });
    }
    url += "&sort=createdOn%2Cdesc";
    return url;
  }
}
