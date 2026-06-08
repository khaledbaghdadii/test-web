import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { FetchIsToolsFilter, IsToolsPage } from "./model/is-tool";

@Injectable({ providedIn: "root" })
export class ArtifactIsToolsService {
  apiUrl: string;
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getAllIsTools(filters: FetchIsToolsFilter): Observable<IsToolsPage> {
    return this.http
      .get<IsToolsPage>(this.getIsToolsUrl(filters))
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getIsToolsUrl(filters: FetchIsToolsFilter): string {
    let url =
      this.apiUrl +
      `artifact-management/is-tools?page=${filters.pageIndex}&size=${filters.pageSize}`;

    if (filters.type) {
      url += `&type=${encodeURIComponent(filters.type)}`;
    }

    url += `&searchKey=${encodeURIComponent(filters.searchKey ?? "")}`;

    url += "&sort=createdOn%2Cdesc";

    return url;
  }
}
