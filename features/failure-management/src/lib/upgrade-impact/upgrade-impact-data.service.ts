import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { FetchUpgradeImpactsQueryResult } from "./model/lite-upgrade-impact.model";
import { FetchUpgradeImpactsApiQueryResult } from "./model/lite-upgrade-impact-api.model";
import { Observable, catchError, map, throwError } from "rxjs";
import { UpgradeImpactApiModel } from "./model/upgrade-impact-api.model";
import { UpgradeImpact } from "./model/upgrade-impact.model";
import { FetchUpgradeImpactsQuery } from "./model/fetch-upgrade-impacts-query.model";

@Injectable()
export class UpgradeImpactDataService {
  private http = inject(HttpClient);
  private config = inject<AppConfig>(APP_CONFIG);

  private upgradeImpactUrl: string;

  constructor() {
    const config = this.config;

    this.upgradeImpactUrl = `${config.gatewayUrl}failure-management/impacts/upgrade`;
  }

  fetchAll(
    fetchQuery: FetchUpgradeImpactsQuery
  ): Observable<FetchUpgradeImpactsQueryResult> {
    return this.http
      .get<FetchUpgradeImpactsApiQueryResult>(this.upgradeImpactUrl, {
        params: this.getQueryParams(fetchQuery),
      })
      .pipe(
        map((result) => this.buildFetchUpgradeImpactResult(result)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  private buildFetchUpgradeImpactResult(
    result: FetchUpgradeImpactsApiQueryResult
  ): FetchUpgradeImpactsQueryResult {
    return result.warningMessage
      ? {
          ...result,
          warningMessage: this.constructWarningMessage(result.warningMessage),
        }
      : result;
  }

  fetchById(upgradeImpactId: string): Observable<UpgradeImpact> {
    return this.http
      .get<UpgradeImpactApiModel>(`${this.upgradeImpactUrl}/${upgradeImpactId}`)
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getQueryParams(filters: FetchUpgradeImpactsQuery): HttpParams {
    const filtersWithNoUndefinedValues = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    );
    const params = { fromObject: { ...filtersWithNoUndefinedValues } };
    return new HttpParams(params);
  }

  private constructWarningMessage(warningMessage: string) {
    return `Showing all upgrade impacts due to: ${warningMessage}. Data includes upgrade impacts outside the validation cycle.`;
  }
}
