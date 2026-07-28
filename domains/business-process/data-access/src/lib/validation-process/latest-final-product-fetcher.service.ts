import { inject, Injectable } from "@angular/core";
import { from, Observable, of } from "rxjs";
import { catchError, concatMap, first, map, switchMap } from "rxjs/operators";
import {
  FinalProduct,
  FinalProductApiService,
} from "@mxevolve/domains/artifact/data-access";
import {
  CommitsService,
  DevelopmentService,
} from "@mxevolve/domains/scm/data-access";

export enum LatestFinalProductFailureReason {
  INVALID_BRANCH_NAME = "INVALID_BRANCH_NAME",
  NO_FINAL_PRODUCT_FOUND = "NO_FINAL_PRODUCT_FOUND",
  UNEXPECTED_FAILURE = "UNEXPECTED_FAILURE",
}

export interface LatestFinalProductResult {
  readonly finalProduct?: FinalProduct;
  readonly failureReason?: LatestFinalProductFailureReason;
}

export interface FetchLatestFinalProductRequest {
  readonly projectId: string;
  readonly repositoryId: string;
  readonly branchName: string;
}

/**
 * Resolves the newest final product reachable from an existing archival branch.
 *
 * Port of the legacy `LatestFinalProductServiceFetcher`
 * (`web/libs/features/business-process/src/lib/validation-process/validation-process-configuration-parameters/final-product-from-existing-branch/final-product-input/latest-final-product-service-fetcher.service.ts`),
 * converted from promises to observables with the same steps and the same
 * failure classification:
 *
 * 1. look the branch up in SCM developments - unknown branch, or a branch with
 *    no parent, is `INVALID_BRANCH_NAME`;
 * 2. walk the commits that exist on the branch but not on its parent, newest
 *    first, and stop at the first commit carrying a final product;
 * 3. otherwise fall back to the branch's parent commit (unscoped by branch);
 * 4. nothing found is `NO_FINAL_PRODUCT_FOUND`, any failure is
 *    `UNEXPECTED_FAILURE`.
 *
 * Lives in `business-process/data-access` because it spans both the SCM and the
 * artifact domains.
 */
@Injectable()
export class LatestFinalProductFetcherService {
  private readonly developmentService = inject(DevelopmentService);
  private readonly commitsService = inject(CommitsService);
  private readonly finalProductApiService = inject(FinalProductApiService);

  getLatestFinalProductOnBranch(
    request: FetchLatestFinalProductRequest
  ): Observable<LatestFinalProductResult> {
    return this.developmentService
      .getDevelopments(request.projectId, {
        name: request.branchName,
        repositoryId: request.repositoryId,
      })
      .pipe(
        switchMap((developments) => {
          const development = developments.content[0];
          if (!development?.source) {
            return of<LatestFinalProductResult>({
              failureReason:
                LatestFinalProductFailureReason.INVALID_BRANCH_NAME,
            });
          }
          return this.findOnBranch(request, development.name, {
            source: development.source,
            parentCommitId: development.parentCommitId,
          });
        }),
        catchError(() =>
          of<LatestFinalProductResult>({
            failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
          })
        )
      );
  }

  private findOnBranch(
    request: FetchLatestFinalProductRequest,
    developmentName: string,
    parent: { source: string; parentCommitId: string }
  ): Observable<LatestFinalProductResult> {
    return this.commitsService
      .getCommitDifferences({
        projectId: request.projectId,
        repositoryId: request.repositoryId,
        sourceBranch: developmentName,
        destinationBranch: parent.source,
      })
      .pipe(
        switchMap((commits) =>
          this.findOnFirstMatchingCommit(
            request.projectId,
            commits.map((commit) => commit.id),
            request.branchName
          )
        ),
        switchMap((product) =>
          product
            ? of(product)
            : this.findOnCommit(request.projectId, parent.parentCommitId)
        ),
        map((product) =>
          product
            ? { finalProduct: product }
            : {
                failureReason:
                  LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND,
              }
        )
      );
  }

  /**
   * Queries the commits one after another and stops as soon as one carries a
   * final product, so a long branch never fans out into a burst of requests
   * (legacy used a sequential `for ... await` loop with a `break`).
   */
  private findOnFirstMatchingCommit(
    projectId: string,
    commitIds: string[],
    branchName: string
  ): Observable<FinalProduct | null> {
    if (commitIds.length === 0) {
      return of(null);
    }
    return from(commitIds).pipe(
      concatMap((commitId) =>
        this.findOnCommit(projectId, commitId, branchName)
      ),
      first((product) => product !== null, null)
    );
  }

  private findOnCommit(
    projectId: string,
    commitId: string,
    branchName?: string
  ): Observable<FinalProduct | null> {
    return this.finalProductApiService
      .getFinalProducts(projectId, {
        branchFilter: branchName,
        configurationCommitIdFilter: commitId,
        sort: "createdOn,desc",
      })
      .pipe(map((page) => page.content[0] ?? null));
  }
}
