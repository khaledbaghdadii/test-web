import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  CommitsCherryPickedRequest,
  ProceedWithPredefinedInputsRequest,
  ReopenMergeRequestRequest,
  RepushBackportMergeRequest,
  SendChangesForReviewRequest,
} from "./models/build-and-test-user-input.model";

@Injectable()
export class BuildAndTestUserInputService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  sendChangesForReview(
    request: SendChangesForReviewRequest
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/send-changes-for-review`,
        this.toSendChangesForReviewBody(request)
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  proceedWithPredefinedInputs(
    request: ProceedWithPredefinedInputsRequest
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/proceed-with-predefined-inputs`,
        {
          shouldCleanDevelopment: request.shouldCleanDevelopment,
          developmentId: request.developmentId,
          supportsResourceManagement: request.supportsResourceManagement,
        }
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  reopenMergeRequest(request: ReopenMergeRequestRequest): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/reopen-merge-request`,
        {
          title: request.title,
          reviewers: request.reviewers,
        }
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  fixIntegrationIssues(projectId: string, processId: string): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          projectId,
          processId
        )}/user-input/fix-integration-issues`,
        {}
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  commitsCherryPicked(request: CommitsCherryPickedRequest): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/commits-cherry-picked`,
        { mergeConfigurationId: request.mergeConfigurationId }
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  repushBackportMergeRequest(
    request: RepushBackportMergeRequest
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          request.projectId,
          request.processId
        )}/user-input/repush-backport-merge-job`,
        { mergeConfigurationId: request.mergeConfigurationId }
      )
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  private buildExecutionUrl(projectId: string, processId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process/${processId}`;
  }

  private toSendChangesForReviewBody(
    request: SendChangesForReviewRequest
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      mergeConfigurationId: request.mergeConfigurationId,
      mergeJobTitle: request.mergeJobTitle,
      mergeJobReviewers: request.mergeJobReviewers,
      backportChanges: request.backportChanges,
      shouldCleanDevelopment: request.shouldCleanDevelopment,
      developmentId: request.developmentId,
      supportsResourceManagement: request.supportsResourceManagement,
    };

    if (request.backportMergeConfigurationIds !== undefined) {
      body["backportMergeConfigurationIds"] =
        request.backportMergeConfigurationIds;
    }
    if (request.backportInputs !== undefined) {
      body["backportInputs"] = request.backportInputs;
    }

    return body;
  }

  private toError(error: {
    error?: { message?: string } | string;
    message?: string;
  }): Error {
    if (typeof error.error === "string") return new Error(error.error);
    return new Error(error.error?.message ?? error.message);
  }
}
