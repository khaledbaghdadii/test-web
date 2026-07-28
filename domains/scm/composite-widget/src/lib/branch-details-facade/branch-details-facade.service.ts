import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import {
  CommitDetails,
  CommitsService,
  Development,
  GetCommitsDifferenceRequest,
  MergeRequestOverview,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";

/**
 * Shared fetching + error handling for the branch/commits widgets.
 *
 * Centralises the "latest merge request for a development" and "commits behind
 * parent" lookups that were previously duplicated across the build-and-test,
 * validation-process and run-header parents. Consumers keep their own resources
 * and surrounding UI; they only delegate the network calls here so the fetching
 * strategy and error handling live in one place.
 */
@Injectable()
export class BranchDetailsFacadeService {
  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly commitsService = inject(CommitsService);

  /**
   * Returns the most recent merge request (by creation date) for the given
   * development within a process context, or `undefined` when none exists or
   * the lookup fails.
   */
  getLatestMergeRequest(
    projectId: string,
    developmentId: string,
    contextId: string
  ): Observable<MergeRequestOverview | undefined> {
    return this.mergeRequestService
      .getFilteredMergeRequests(projectId, { developmentId, contextId })
      .pipe(
        map((mergeRequests) =>
          [...mergeRequests]
            .sort(
              (first, second) =>
                new Date(second.createdOn ?? 0).getTime() -
                new Date(first.createdOn ?? 0).getTime()
            )
            .at(0)
        ),
        catchError(() => of(undefined))
      );
  }

  /**
   * Builds the commit-difference request for the "commits behind parent"
   * lookup, or `undefined` when the branch is deleted or has no parent/repo.
   */
  commitsBehindParams(
    development: Development | undefined,
    projectId: string
  ): GetCommitsDifferenceRequest | undefined {
    if (
      !development ||
      development.deleted ||
      !development.source ||
      !development.repository?.id
    ) {
      return undefined;
    }
    return {
      projectId,
      repositoryId: development.repository.id,
      sourceBranch: development.source,
      destinationBranch: development.name,
    };
  }

  /**
   * Returns the commits the branch is behind its parent. Errors are propagated
   * so consumers can surface their own feedback (e.g. a toast).
   */
  getCommitsBehind(
    params: GetCommitsDifferenceRequest
  ): Observable<CommitDetails[]> {
    return this.commitsService.getCommitDifferences(params);
  }
}
