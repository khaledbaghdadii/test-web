import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { BinaryUpgradeExecutionsQueryRequest } from "./models/binary-upgrade-executions-query-request";
import { BinaryUpgradeExecutionsQueryResult } from "./models/binary-upgrade-executions-query-result";
import { catchError, Observable, throwError } from "rxjs";

@Injectable()
export class UpgradeProcessListingService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getBinaryUpgradeExecutions(
    projectId: string,
    queryParams: BinaryUpgradeExecutionsQueryRequest
  ): Observable<BinaryUpgradeExecutionsQueryResult> {
    return this.httpClient
      .get<BinaryUpgradeExecutionsQueryResult>(`${this.getApiUrl(projectId)}`, {
        params: this.constructParams(queryParams),
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private constructParams(query: BinaryUpgradeExecutionsQueryRequest) {
    return Object.entries(query).reduce((queryParams, [key, value]) => {
      return this.addQueryParamIfExists(value, queryParams, key);
    }, new HttpParams());
  }

  private addQueryParamIfExists(
    value: any,
    queryParams: HttpParams,
    key: string
  ) {
    if (value !== undefined && value !== null) {
      return queryParams.set(key, value);
    } else {
      return queryParams;
    }
  }

  private getApiUrl(projectId: string) {
    return (
      this.config.gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions/binary-upgrade"
    );
  }
}
