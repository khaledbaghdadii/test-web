import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { EnvironmentProvider } from "../../../../environments/environment";
import { catchError, Observable, throwError } from "rxjs";
import { SendChangesForReviewRequest } from "./model/send-changes-for-review-request";
import { SendChangesForReviewApiRequest } from "./model/send-changes-for-review-api-request";
import { CommitsCherryPickedRequest } from "./model/commits-cherry-picked-request";
import { CommitsCherryPickedApiRequest } from "./model/commits-cherry-picked-api-request";
import { RepushBackportMergeRequest } from "./model/repush-backport-merge-request";
import { RepushBackportMergeRequestApiRequest } from "./model/repush-backport-merge-request-api-request";
import { ProceedWithPredefinedInputsRequest } from "./model/proceed-with-predefined-inputs-request";
import { ReopenMergeRequestRequest } from "./model/reopen-merge-request-request";
import { ReopenMergeRequestApiRequest } from "./model/reopen-merge-request-api-request";

@Injectable()
export class CiProcessExecutionService {
  private readonly httpClient = inject(HttpClient);
  private readonly environmentProvider = inject(EnvironmentProvider);

  repushEnvironment(projectId: string, ciProcessExecutionId: string) {
    return this.httpClient
      .post(this.getRepushEnvironmentUri(projectId, ciProcessExecutionId), {})
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  sendChangesForReview(
    sendForReviewRequest: SendChangesForReviewRequest
  ): Observable<unknown> {
    return this.httpClient
      .post(
        this.getSendChangesForReviewUrl(
          sendForReviewRequest.projectId,
          sendForReviewRequest.ciProcessExecutionId
        ),
        this.mapSendChangeForReviewRequest(sendForReviewRequest)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  reopenMergeRequest(request: ReopenMergeRequestRequest): Observable<unknown> {
    return this.httpClient
      .post(
        `${this.getApiUrl(request.projectId)}/${
          request.ciProcessExecutionId
        }/user-input/reopen-merge-request`,
        this.mapReopenMergeRequestRequest(request)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  fixIntegrationIssues(projectId: string, processId: string) {
    return this.httpClient
      .post(
        `${this.getApiUrl(
          projectId
        )}/${processId}/user-input/fix-integration-issues`,
        {}
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  commitsCherryPicked(request: CommitsCherryPickedRequest) {
    return this.httpClient
      .post(
        `${this.getApiUrl(request.projectId)}/${
          request.processExecutionId
        }/user-input/commits-cherry-picked`,
        this.mapCommitsCherryPickedRequest(request)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  repushBackportMergeRequest(request: RepushBackportMergeRequest) {
    return this.httpClient
      .post(
        `${this.getApiUrl(request.projectId)}/${
          request.processExecutionId
        }/user-input/repush-backport-merge-job`,
        this.mapRepushBackportMergeRequest(request)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  proceedWithPredefinedInputs(
    request: ProceedWithPredefinedInputsRequest
  ): Observable<unknown> {
    return this.httpClient
      .post(
        this.getProceedWithPredefinedInputsUrl(
          request.projectId,
          request.ciProcessExecutionId
        ),
        {
          shouldCleanDevelopment: request.shouldCleanDevelopment,
          developmentId: request.developmentId,
          supportsResourceManagement: request.supportsResourceManagement,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.handleError(error)))
        )
      );
  }

  private getRepushEnvironmentUri(
    projectId: string,
    ciProcessExecutionId: string
  ) {
    return `${this.getApiUrl(
      projectId
    )}/${ciProcessExecutionId}/user-input/repush-prepare-build-environment`;
  }

  private getSendChangesForReviewUrl(
    projectId: string,
    ciProcessExecutionId: string
  ) {
    return `${this.getApiUrl(
      projectId
    )}/${ciProcessExecutionId}/user-input/send-changes-for-review`;
  }

  private getProceedWithPredefinedInputsUrl(
    projectId: string,
    ciProcessExecutionId: string
  ) {
    return `${this.getApiUrl(
      projectId
    )}/${ciProcessExecutionId}/user-input/proceed-with-predefined-inputs`;
  }

  private getApiUrl(projectId: string) {
    return (
      this.environmentProvider.getEnvironment().gatewayUrl +
      "projects/" +
      projectId +
      "/business-process/executions/ci-process"
    );
  }

  private mapSendChangeForReviewRequest(
    request: SendChangesForReviewRequest
  ): SendChangesForReviewApiRequest {
    return {
      mergeConfigurationId: request.mergeConfigurationId,
      mergeJobTitle: request.mergeJobTitle,
      mergeJobReviewers: request.mergeJobReviewers,
      backportChanges: request.backportChanges,
      backportMergeConfigurationIds: request.backportMergeConfigurationIds,
      backportInputs: request.backportInputs,
      shouldCleanDevelopment: request.shouldCleanDevelopment,
      developmentId: request.developmentId,
      supportsResourceManagement: request.supportsResourceManagement,
    };
  }

  private mapReopenMergeRequestRequest(
    request: ReopenMergeRequestRequest
  ): ReopenMergeRequestApiRequest {
    return {
      title: request.title,
      reviewers: request.reviewers,
    };
  }

  private mapCommitsCherryPickedRequest(request: CommitsCherryPickedRequest) {
    return {
      mergeConfigurationId: request.mergeConfigurationId,
    } as CommitsCherryPickedApiRequest;
  }

  private mapRepushBackportMergeRequest(request: RepushBackportMergeRequest) {
    return {
      mergeConfigurationId: request.mergeConfigurationId,
    } as RepushBackportMergeRequestApiRequest;
  }

  private handleError(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error?.error?.message;
  }
}
