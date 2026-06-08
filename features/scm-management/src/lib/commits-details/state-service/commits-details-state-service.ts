import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import {
  catchError,
  combineLatest,
  EMPTY,
  expand,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
} from "rxjs";
import {
  ScmService,
  Development,
  ScmManagementService,
  GetPaginatedCommitsDifferenceApiRequest,
  GetPullRequestApiRequest,
} from "@mxflow/features/scm";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { CommitDetailsPage } from "../model/commit-details-page";
import { MergeRequestService } from "../../merge-request/merge-request.service";
import { MergeRequestPage } from "../../merge-request/model/merge-request-page";
import { MergeRequestState } from "../../merge-request/model/merge-request";

@Injectable()
export class CommitsDetailsStateService {
  private readonly EMPTY_PAGE: CommitDetailsPage = {
    content: [],
    size: 0,
    page: 0,
    totalElements: 0,
    last: true,
  };
  commitsPage = signal<CommitDetailsPage | undefined>(undefined);
  fetchCommitsLoading = signal(false);
  totalElements = signal<number>(0);
  pageSize = signal<number>(5);
  pageIndex = signal<number>(0);
  errorMessage = signal<string | undefined>(undefined);
  pageIndex$ = toObservable(this.pageIndex);
  pageSize$ = toObservable(this.pageSize);

  mergeRequestService = inject(MergeRequestService);
  scmManagementService = inject(ScmManagementService);
  scmService = inject(ScmService);
  destroyRef = inject(DestroyRef);

  UnsuccessfulMergeRequestEndStates = [
    MergeRequestState.DECLINED,
    MergeRequestState.DELETED,
    MergeRequestState.UNDER_VALIDATION_FAILED,
    MergeRequestState.REVIEW_FAILED,
    MergeRequestState.MERGE_FAILED,
  ];

  fetchCommits(
    projectId: string,
    developmentId: string,
    businessProcessId: string
  ): void {
    this.fetchCommitsLoading.set(true);
    const development$ = this.scmManagementService
      .getDevelopment(projectId, developmentId, true)
      .pipe(shareReplay(1));
    const mergeRequests$ = this.mergeRequestService
      .getFilteredMergeRequests(projectId, {
        developmentId,
        contextId: businessProcessId,
      })
      .pipe(shareReplay(1));

    combineLatest([
      development$,
      mergeRequests$,
      this.pageIndex$,
      this.pageSize$,
    ])
      .pipe(
        switchMap(([development, mergeRequests]) => {
          const mr = this.getLatestMergeRequest(mergeRequests);
          if (development.deleted) {
            if (mr?.mergeRequestState === MergeRequestState.MERGED) {
              return this.getCommitsOfPullRequest(
                development,
                mr.pullRequestId
              );
            }
            this.errorMessage.set(
              "No commits are displayed in the table because the branch was deleted, and no merged PR exists."
            );
            return of(this.EMPTY_PAGE);
          }

          if (mr) {
            if (
              !this.UnsuccessfulMergeRequestEndStates.includes(
                mr.mergeRequestState
              )
            ) {
              return this.getCommitsOfPullRequest(
                development,
                mr.pullRequestId
              );
            }
            return this.getDiffBetweenDevBranchAndSourceBranch(development);
          }

          return this.getDiffBetweenDevBranchAndSourceBranch(development);
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.fetchCommitsLoading.set(false);
          this.errorMessage.set("Failed to fetch commits. " + err.message);
          return of(this.EMPTY_PAGE);
        })
      )
      .subscribe((commitsPage) => {
        this.commitsPage.set(commitsPage);
        this.fetchCommitsLoading.set(false);
      });
  }

  setPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
  }

  setPageIndex(pageIndex: number): void {
    this.pageIndex.set(pageIndex);
  }

  private getLatestMergeRequest(mergeRequests: MergeRequestPage) {
    const sortedMergeRequests = (mergeRequests?.content ?? []).sort(
      (a, b) =>
        new Date(b.createdOn ?? 0).getTime() -
        new Date(a.createdOn ?? 0).getTime()
    );
    return sortedMergeRequests[0];
  }

  private getDiffBetweenDevBranchAndSourceBranch(development: Development) {
    if (development.source && development.name && development.repository) {
      const request: GetPaginatedCommitsDifferenceApiRequest = {
        projectId: development.projectId,
        repositoryId: development.repository.id,
        source: development.name,
        destination: development.source,
        page: this.pageIndex(),
        size: this.pageSize(),
      };
      this.getTotalElementsOfCommitDifferences(development);
      return this.scmService.getPaginatedCommitDifferences(request).pipe(
        map((response) => ({
          ...response,
          content: response.content.map((commit) => ({
            id: commit.id,
            committerDisplayName: commit.committerDisplayName,
            timeStamp: commit.timeStamp,
            message: commit.message,
            url: commit.url,
          })),
        }))
      );
    }
    this.errorMessage.set(
      "Failed to fetch commits. Development branch is missing source or branch name."
    );
    return of(this.EMPTY_PAGE);
  }

  private getCommitsOfPullRequest(
    development: Development,
    pullRequestId: string
  ) {
    const request: GetPullRequestApiRequest = {
      projectId: development.projectId,
      repositoryId: development.repository.id,
      pullRequestId: pullRequestId,
      page: this.pageIndex(),
      size: this.pageSize(),
    };

    this.getTotalElementsOfPullRequestCommits(development, pullRequestId);

    return this.scmService.getPullRequestCommits(request).pipe(
      map((response) => ({
        ...response,
        content: response.content.map((commit) => ({
          id: commit.id,
          committerDisplayName: commit.authorDisplayName,
          timeStamp: commit.authorTimestamp,
          message: commit.message,
          url: commit.url,
        })),
      }))
    );
  }

  private getTotalElementsOfPullRequestCommits(
    development: Development,
    pullRequestId: string
  ): void {
    const pageSize = 100;
    let totalElements = 0;
    let currentPage = 0;

    const request: GetPullRequestApiRequest = {
      projectId: development.projectId,
      repositoryId: development.repository.id,
      pullRequestId,
      page: currentPage,
      size: pageSize,
    };

    this.scmService
      .getPullRequestCommits({ ...request, page: currentPage })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        expand((response) => {
          totalElements += response.content.length;
          if (response.last) {
            this.totalElements.set(totalElements);
            return EMPTY;
          }
          currentPage++;
          return this.scmService.getPullRequestCommits({
            ...request,
            page: currentPage,
          });
        }),
        catchError((err) => {
          this.errorMessage.set(
            "Failed to fetch total elements of pull request commits." +
              err.message
          );
          return EMPTY;
        })
      )
      .subscribe();
  }

  private getTotalElementsOfCommitDifferences(development: Development): void {
    const pageSize = 100;
    let totalElements = 0;
    let currentPage = 0;
    if (development.source && development.name && development.repository) {
      const request: GetPaginatedCommitsDifferenceApiRequest = {
        projectId: development.projectId,
        repositoryId: development.repository.id,
        source: development.name,
        destination: development.source,
        page: currentPage,
        size: pageSize,
      };

      this.scmService
        .getPaginatedCommitDifferences({ ...request, page: currentPage })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          expand((response) => {
            totalElements += response.content.length;
            if (response.last) {
              return EMPTY;
            }
            currentPage++;
            return this.scmService.getPaginatedCommitDifferences({
              ...request,
              page: currentPage,
            });
          }),
          finalize(() => {
            this.totalElements.set(totalElements);
          }),
          catchError((err) => {
            this.errorMessage.set(
              "Failed to fetch total elements of commit differences." +
                err.message
            );
            return EMPTY;
          })
        )
        .subscribe();
    } else {
      this.errorMessage.set(
        "Failed to fetch total elements. Development branch is missing source or branch name."
      );
    }
  }
}
