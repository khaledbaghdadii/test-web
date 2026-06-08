import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of, throwError } from "rxjs";
import { BusinessProcessExecution } from "./model/business-process-execution";
import { APP_CONFIG } from "@mxflow/config";
import { HideExecutionsApiRequest } from "./model/hide-executions-request";
import { handleError } from "../../../../../core/error-handler/src/lib/error-utils";

@Injectable({ providedIn: "root" })
export class BusinessProcessExecutionService {
  http = inject(HttpClient);
  config = inject(APP_CONFIG);

  getBusinessProcessExecutions(
    projectId: string
  ): Observable<BusinessProcessExecution[]> {
    return this.http
      .get<BusinessProcessExecution[]>(this.getApiUrl(projectId))
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getBusinessProcessExecution(
    projectId: string,
    businessProcessExecutionId: string
  ): Observable<BusinessProcessExecution> {
    return this.http
      .get<BusinessProcessExecution>(
        this.getApiUrl(projectId) + "/" + businessProcessExecutionId
      )
      .pipe(
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  businessProcessExists(
    projectId: string,
    businessProcessExecutionId: string
  ): Observable<boolean> {
    return this.http
      .get<BusinessProcessExecution>(
        this.getApiUrl(projectId) + "/" + businessProcessExecutionId
      )
      .pipe(
        map(() => true),
        catchError((error) => of(error.status != 404))
      );
  }

  hideBusinessProcessExecutions(executionsId: string[]) {
    const request: HideExecutionsApiRequest = { executionsId };
    return this.http
      .put(
        this.config.gatewayUrl + "business-process/executions/hide/bulk",
        request
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  unhideBusinessProcessExecutions(executionsId: string[]) {
    const request: HideExecutionsApiRequest = { executionsId };
    return this.http
      .put(
        this.config.gatewayUrl + "business-process/executions/unhide/bulk",
        request
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getApiUrl(projectId: string) {
    return (
      this.config.gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions"
    );
  }
}
