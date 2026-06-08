import { HttpClient, HttpResponse } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { Observable, catchError, throwError } from "rxjs";
import { MergeRequestPage } from "./model/merge-request-page";
import { MergeRequestApiPage } from "./model/response/merge-request-api-page";
import { MergeRequestFilterRequest } from "./model/request/merge-request-filter-request";
import { MergeRequestApiFilterRequest } from "./model/request/merge-request-api-filter-request";
import { MergeRequest, MergeRequestPriority } from "./model/merge-request";
import { MergeRequestApiResponse } from "./model/response/merge-request-api-response";
import { MergeRequestBuildApiResponse } from "./model/response/merge-request-build-api-response";
import { UpdateMergeRequestPriorityRequest } from "./model/request/merge-request-update-priority-request";
import { UpdateProcessingModeRequest } from "./model/request/update-processing-mode-request";
import { UpdateProcessingModeResponse } from "./model/response/update-processing-mode-response";
import { ErrorHandler } from "../error-handling/error-handler";

@Injectable()
export class MergeRequestService {
  config: AppConfig;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.config = config;
  }

  getAllMergeRequests(
    projectId: string,
    pageIndex = 0,
    pageSize = 20
  ): Observable<MergeRequestPage> {
    return this.http
      .get<MergeRequestApiPage>(
        this.getMergeRequestsApiUrl(projectId, pageIndex, pageSize)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getMergeRequest(
    projectId: string,
    mergeRequestId: string
  ): Observable<MergeRequest> {
    return this.http
      .get<MergeRequestApiResponse>(
        this.getMergeRequestApiUrl(projectId, mergeRequestId)
      )
      .pipe(
        catchError((error) =>
          throwError(() =>
            error.status === 500
              ? new Error("Failed to get merge request details")
              : new Error(ErrorHandler.extractMessage(error))
          )
        )
      );
  }

  getFilteredMergeRequests(
    projectId: string,
    filterRequest: MergeRequestFilterRequest,
    pageIndex = 0,
    pageSize = 20
  ): Observable<MergeRequestPage> {
    const mergeRequestApiFilterRequest: MergeRequestApiFilterRequest = {
      searchKey: filterRequest.searchKey,
      repositoryId: filterRequest.repositoryId,
      destinationBranches: filterRequest.destinationBranches,
      mergeRequestStates: filterRequest.mergeRequestStates,
      mergeRequestStatuses: filterRequest.mergeRequestStatuses,
      createdOnDateRange: filterRequest.createdOnDateRange,
      endDateDateRange: filterRequest.endDateDateRange,
      developmentId: filterRequest.developmentId,
      contextId: filterRequest.contextId,
    };
    return this.http
      .post<MergeRequestApiPage>(
        this.getFilteredMergeRequestApiUrl(projectId, pageIndex, pageSize),
        mergeRequestApiFilterRequest
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getMergeRequestBuilds(
    projectId: string,
    mergeRequestId: string
  ): Observable<MergeRequestBuildApiResponse[]> {
    return this.http
      .get<MergeRequestBuildApiResponse[]>(
        this.getBuildsOfAMergeRequestApiUrl(projectId, mergeRequestId)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  updateMergeRequestPriority(
    projectId: string,
    mergeRequestId: string,
    priority: MergeRequestPriority
  ): Observable<MergeRequestApiResponse> {
    return this.http
      .patch<MergeRequestApiResponse>(
        this.updateMergeRequestPriorityUrl(projectId, mergeRequestId),
        this.getMergeRequestUpdatePriorityRequest(priority)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  updateProcessingMode(
    projectId: string,
    request: UpdateProcessingModeRequest
  ): Observable<UpdateProcessingModeResponse> {
    return this.http
      .patch<UpdateProcessingModeResponse>(
        this.updateProcessingModeUrl(projectId),
        request
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  exportMergeRequestsToExcel(
    projectId: string,
    filterRequest: MergeRequestFilterRequest
  ): Observable<HttpResponse<Blob>> {
    const mergeRequestApiFilterRequest: MergeRequestApiFilterRequest = {
      searchKey: filterRequest.searchKey,
      repositoryId: filterRequest.repositoryId,
      destinationBranches: filterRequest.destinationBranches,
      mergeRequestStates: filterRequest.mergeRequestStates,
      mergeRequestStatuses: filterRequest.mergeRequestStatuses,
      createdOnDateRange: filterRequest.createdOnDateRange,
      endDateDateRange: filterRequest.endDateDateRange,
      developmentId: filterRequest.developmentId,
      contextId: filterRequest.contextId,
    };
    return this.http
      .post(
        this.getExportMergeRequestsApiUrl(projectId),
        mergeRequestApiFilterRequest,
        { responseType: "blob", observe: "response" }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  private getMergeRequestsApiUrl(
    projectId: string,
    pageIndex: number,
    pageSize: number
  ): string {
    return (
      this.getApiUrl(projectId) +
      `merge-requests?page=${pageIndex}&size=${pageSize}`
    );
  }

  private getMergeRequestApiUrl(
    projectId: string,
    mergeRequestId: string
  ): string {
    return this.getApiUrl(projectId) + `merge-requests/${mergeRequestId}`;
  }

  private getFilteredMergeRequestApiUrl(
    projectId: string,
    pageIndex: number,
    pageSize: number
  ): string {
    return (
      this.getApiUrl(projectId) +
      `merge-requests/filter?sort=mergeRequestState&sort=createdOn,desc&page=${pageIndex}&size=${pageSize}`
    );
  }

  private getExportMergeRequestsApiUrl(projectId: string): string {
    return (
      this.getApiUrl(projectId) +
      `merge-requests/export?sort=mergeRequestState&sort=createdOn,desc`
    );
  }

  private getBuildsOfAMergeRequestApiUrl(
    projectId: string,
    mergeRequestId: string
  ): string {
    return (
      this.getApiUrl(projectId) + `merge-requests/${mergeRequestId}/builds`
    );
  }

  private updateMergeRequestPriorityUrl(
    projectId: string,
    mergeRequestId: string
  ): string {
    return (
      this.getApiUrl(projectId) + `merge-requests/${mergeRequestId}/priority`
    );
  }

  private updateProcessingModeUrl(projectId: string): string {
    return this.getApiUrl(projectId) + `merge-requests/processing-mode`;
  }

  private getApiUrl(projectId: string): string {
    return this.config.gatewayUrl + `scm-management/projects/${projectId}/`;
  }

  private getMergeRequestUpdatePriorityRequest(
    priority: MergeRequestPriority
  ): UpdateMergeRequestPriorityRequest {
    return {
      mergeRequestPriority: priority,
    };
  }
}
