import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { ElgibilityApiResponse } from "./elgibility-api-response";
import { EligibilityResponse } from "./eligibility-response";

@Injectable({ providedIn: "root" })
export class BusinessProcessExecutionEligibilityService {
  apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getBusinessProcessExecutionEligibility(
    projectId: string,
    familyId: string,
    baseDefinitionId: string
  ): Observable<EligibilityResponse> {
    return this.http
      .get<ElgibilityApiResponse>(this.getApiUrl(projectId), {
        params: {
          familyId,
          baseDefinitionId,
        },
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getApiUrl(projectId: string) {
    return (
      this.apiUrl +
      "projects/" +
      projectId +
      "/business-process/executions/eligibility"
    );
  }
}
