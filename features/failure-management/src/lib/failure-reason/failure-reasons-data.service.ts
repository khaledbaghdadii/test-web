import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { FailureReasonApiModel } from "./failure-reason-api-model";
import { CreateFailureReasonRequest } from "./create-failure-reason-modal/create-failure-reason-request";
import { CreateFailureReasonApiRequest } from "./create-failure-reason-api-request";
import { FailureReason } from "./failure-reason";
import { FetchConfigurationImpactsRequest } from "../configuration-impact/model/fetch-configuration-impacts-request";

@Injectable({ providedIn: "root" })
export class FailureReasonsDataService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly failureManagementApiUrl = `${this.config.gatewayUrl}failure-management/failure-reasons`;

  getFailureReasons(
    query: FetchConfigurationImpactsRequest = {}
  ): Observable<FailureReason[]> {
    const queryParams = new HttpParams({ fromObject: { ...query } });
    return this.http
      .get<FailureReasonApiModel[]>(this.failureManagementApiUrl, {
        params: queryParams,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  createFailureReason(
    createFailureReasonRequest: CreateFailureReasonRequest
  ): Observable<void> {
    return this.http
      .post<void>(
        this.failureManagementApiUrl,
        this.toCreateFailureReasonApiRequest(createFailureReasonRequest)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  toggleFailureReasonActivation(failureReasonId: string, isEnabled: boolean) {
    return this.http
      .patch<void>(`${this.failureManagementApiUrl}/${failureReasonId}`, {
        isEnabled: isEnabled,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private toCreateFailureReasonApiRequest(
    createFailureReasonRequest: CreateFailureReasonRequest
  ): CreateFailureReasonApiRequest {
    return {
      title: createFailureReasonRequest.title.trim(),
      description: createFailureReasonRequest.description.trim(),
      isEnabled: createFailureReasonRequest.isEnabled,
    };
  }
}
