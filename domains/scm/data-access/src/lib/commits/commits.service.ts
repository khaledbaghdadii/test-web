import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { CommitDetails } from "./model/commit-details.model";
import { GetCommitsDifferenceRequest } from "./model/get-commits-difference-request.model";
import { GetPaginatedCommitsDifferenceRequest } from "./model/get-paginated-commits-difference-request.model";
import { GetPullRequestCommitsRequest } from "./model/get-pull-request-commits-request.model";
import { PaginatedCommitsPage } from "./model/paginated-commits-page.model";

interface PullRequestCommitApiResponse {
  readonly id: string;
  readonly authorDisplayName: string;
  readonly authorTimestamp: string;
  readonly message: string;
  readonly url: string;
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
