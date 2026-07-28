import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { CommitDetails } from "./model/commit-details.model";
import { CommitInfo } from "./model/commit-info.model";
import { GetCommitsDifferenceRequest } from "./model/get-commits-difference-request.model";
import { GetCommitsInfoRequest } from "./model/get-commits-info-request.model";
import { GetPaginatedCommitsDifferenceRequest } from "./model/get-paginated-commits-difference-request.model";
import { GetPullRequestCommitsRequest } from "./model/get-pull-request-commits-request.model";
import { PaginatedCommitsPage } from "./model/paginated-commits-page.model";
import { GetCommitRequest } from "./model/get-commit-request.model";
import { ErrorHandler } from "@mxflow/features/scm";

interface PullRequestCommitApiResponse {
  readonly id: string;
  readonly authorDisplayName: string;
  readonly authorTimestamp: string;
  readonly message: string;
  readonly url: string;
}

interface CommitUserApiResponse {
  readonly displayName: string;
  readonly emailAddress: string;
  readonly name: string;
}

interface MinimalCommitIdApiResponse {
  readonly id: string;
  readonly displayId: string;
}

interface CommitInfoApiResponse {
  readonly id: string;
  readonly displayId: string;
  readonly author: CommitUserApiResponse;
  readonly authorTimestamp: string;
  readonly committer: CommitUserApiResponse;
  readonly committerTimestamp: string;
  readonly message: string;
  readonly parent?: MinimalCommitIdApiResponse;
}

interface PullRequestCommitsPaginatedResponse {
  readonly content: PullRequestCommitApiResponse[];
}

@Injectable()
export class CommitsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  private get baseUrl(): string {
    return this.config.gatewayUrl + "scm-operations/";
  }

  getCommit(request: GetCommitRequest): Observable<CommitDetails> {
    const url = `${this.baseUrl}projects/${request.projectId}/repositories/${request.repositoryId}/commits/${request.commitId}`;

    return this.http
      .get<CommitInfoApiResponse>(url, { params: new HttpParams() })
      .pipe(
        map((response) => ({
          id: response.id,
          committerDisplayName: response.committer.displayName,
          committerDisplayEmail: response.committer.emailAddress,
          timeStamp: response.committerTimestamp,
          message: response.message,
        })),
        catchError((error) =>
          throwError(() => ErrorHandler.createErrorWithStatus(error))
        )
      );
  }

  getCommitDifferences(
    request: GetCommitsDifferenceRequest
  ): Observable<CommitDetails[]> {
    const params = new HttpParams()
      .set("sourceBranch", request.sourceBranch)
      .set("destinationBranch", request.destinationBranch);

    const url = `${this.baseUrl}projects/${request.projectId}/repositories/${request.repositoryId}/commits/difference`;

    return this.http
      .get<CommitDetails[]>(url, { params })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch commit differences"
              )
          )
        )
      );
  }

  /**
   * Batch-resolves commit messages for a set of commit ids.
   *
   * Copied verbatim (verb, URL and body shape) from the legacy
   * `ScmService.getCommitsInfo` (`web/libs/features/scm/src/lib/scm.service.ts`):
   * a POST whose body is the raw array of commit ids. Used to label
   * commit-based dropdown options with their commit message.
   */
  getCommitsInfo(request: GetCommitsInfoRequest): Observable<CommitInfo[]> {
    const url = `${this.baseUrl}projects/${request.projectId}/repositories/${request.repositoryId}/commits`;

    return this.http.post<CommitInfoApiResponse[]>(url, request.commitIds).pipe(
      map((response) =>
        response.map((commit) => ({
          id: commit.id,
          displayId: commit.displayId,
          message: commit.message,
        }))
      ),
      catchError((error) =>
        throwError(
          () =>
            new Error(
              error?.error?.message ??
                error?.message ??
                "Failed to fetch commits info"
            )
        )
      )
    );
  }

  getPullRequestCommits(
    request: GetPullRequestCommitsRequest
  ): Observable<CommitDetails[]> {
    const url = `${this.baseUrl}projects/${request.projectId}/repositories/${request.repositoryId}/pull-requests/${request.pullRequestId}/commits`;

    return this.http.get<PullRequestCommitsPaginatedResponse>(url).pipe(
      map((response) =>
        response.content.map((commit) => ({
          id: commit.id,
          committerDisplayName: commit.authorDisplayName,
          committerDisplayEmail: "",
          timeStamp: commit.authorTimestamp,
          message: commit.message,
          url: commit.url,
        }))
      ),
      catchError((error) =>
        throwError(
          () =>
            new Error(
              error?.error?.message ??
                error?.message ??
                "Failed to fetch pull request commits"
            )
        )
      )
    );
  }

  getPaginatedCommitDifferences(
    request: GetPaginatedCommitsDifferenceRequest
  ): Observable<PaginatedCommitsPage> {
    const params = new HttpParams()
      .set("source", request.source)
      .set("destination", request.destination)
      .set("page", request.page.toString())
      .set("size", request.size.toString());

    const url = `${this.baseUrl}projects/${request.projectId}/repositories/${request.repositoryId}/commits/diff`;

    return this.http
      .get<PaginatedCommitsPage>(url, { params })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch paginated commits"
              )
          )
        )
      );
  }
}
