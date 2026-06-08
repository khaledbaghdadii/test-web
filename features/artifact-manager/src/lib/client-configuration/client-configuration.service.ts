import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  FetchClientConfigurationFilter,
  ClientConfigurationsPage,
} from "./model/client-configuration";
import { catchError, Observable, throwError } from "rxjs";

@Injectable({ providedIn: "root" })
export class ClientConfigurationService {
  private readonly apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly http: HttpClient
  ) {
    this.apiUrl = `${this.config.gatewayUrl}artifact-management/client-configurations`;
  }

  getAllClientConfigurations(
    filters: FetchClientConfigurationFilter
  ): Observable<ClientConfigurationsPage> {
    return this.http
      .get<ClientConfigurationsPage>(this.apiUrl, {
        params: this.buildFetchClientConfigurationQueryParams(filters),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  private buildFetchClientConfigurationQueryParams(
    filters: FetchClientConfigurationFilter
  ): HttpParams {
    const {
      pageIndex,
      pageSize,
      typeSearchKey,
      branchSearchKey,
      searchKey,
      projectIds,
      purged,
    } = filters;

    let params = new HttpParams()
      .set("page", pageIndex.toString())
      .set("size", pageSize.toString())
      .set("sort", "createdOn,desc");

    const optionalParams: { [key: string]: string | undefined } = {
      typeSearchKey,
      branchSearchKey,
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
    if (purged != null) {
      params = params.set("purged", purged.toString());
    }

    return params;
  }
}
