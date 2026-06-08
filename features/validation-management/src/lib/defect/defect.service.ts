import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { FetchDefectResult } from "./model/defect.model";
import { catchError, map, Observable, throwError } from "rxjs";
import { FetchDefectsQuery } from "./model/fetch-defects-query.model";
import { FetchDefectApiResult } from "./model/defect-api-response.model";

@Injectable({
  providedIn: "root",
})
export class DefectService {
  private config = inject<AppConfig>(APP_CONFIG);
  private http = inject(HttpClient);

  private apiUrl: string;

  constructor() {
    const config = this.config;

    this.apiUrl = `${config.gatewayUrl}validation-resources/defects`;
  }

  fetchAll(query: FetchDefectsQuery): Observable<FetchDefectResult> {
    return this.http
      .get<FetchDefectApiResult>(this.apiUrl, {
        params: this.getQueryParams(query),
      })
      .pipe(
        map((result) => this.buildFetchUpgradeImpactResult(result)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  private buildFetchUpgradeImpactResult(
    result: FetchDefectApiResult
  ): FetchDefectResult {
    return result.warningMessage
      ? {
          defects: result.defects,
          warningMessage: this.constructWarningMessage(result.warningMessage),
        }
      : result;
  }

  private getQueryParams(filters: FetchDefectsQuery): HttpParams {
    const filtersWithNoUndefinedValues = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    );
    const params = { fromObject: { ...filtersWithNoUndefinedValues } };
    return new HttpParams(params);
  }

  private constructWarningMessage(warningMessage: string) {
    return `Showing all defects due to: ${warningMessage}. Data includes defects outside the validation cycle.`;
  }
}
