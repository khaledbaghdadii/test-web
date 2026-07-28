import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { EligibilityResponse } from "./eligibility-response";

@Injectable()
export class BusinessProcessExecutionEligibilityService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  getBusinessProcessExecutionEligibility(
    projectId: string,
    familyId: string,
    baseDefinitionId: string
  ): Observable<EligibilityResponse> {
    return this.httpClient
      .get<EligibilityResponse>(this.buildEligibilityUrl(projectId), {
        params: {
          familyId,
          baseDefinitionId,
        },
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private buildEligibilityUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/eligibility`;
  }
}
