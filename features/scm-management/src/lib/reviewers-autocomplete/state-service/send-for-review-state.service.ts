import { computed, Injectable, signal, Signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  GetReviewersRequest,
  Reviewer,
  ReviewersResponse,
  ScmService,
} from "@mxflow/features/scm";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import { RepositoryService } from "@mxflow/features/repository";

@Injectable()
export class SendForReviewStateService {
  private defaultPageIndex = 0;
  private defaultPageSize = 15;
  private emptyPage: ReviewersResponse = {
    content: [],
    page: 0,
    totalElements: 0,
    last: false,
  };

  private projectIdSubject = new Subject<string>();
  private projectId$ = this.projectIdSubject.asObservable();

  readonly pageIndex = signal(this.defaultPageIndex);

  private filterResetSubject = new BehaviorSubject<boolean>(false);
  private filterReset$ = this.filterResetSubject.asObservable();

  private filterSubject = new Subject<string>();
  private filter$ = this.filterSubject.asObservable();

  readonly reviewersPage: Signal<ReviewersResponse>;

  readonly errorMessage = signal<string | undefined>(undefined);

  readonly newReviewerSuggestions = computed(
    () => this.reviewersPage().content
  );
  reviewerSuggestions: Signal<Reviewer[]>;
  isLastPage = computed(() => {
    const isLast = this.reviewersPage().last;
    if (isLast) {
      return isLast;
    }
    return false;
  });
  readonly isLoadingData = signal(false);

  constructor(
    private scmService: ScmService,
    private repositoryService: RepositoryService
  ) {
    const pageIndex$ = toObservable(this.pageIndex);
    this.reviewersPage = toSignal(
      combineLatest([this.projectId$, pageIndex$, this.filter$]).pipe(
        tap(() => {
          this.setLoadingData(true);
        }),
        switchMap(([projectId, pageIndex, filter]) =>
          this.repositoryService.getAllRepositories(projectId).pipe(
            switchMap((repositories) => {
              if (repositories.length > 0) {
                const repositoryId = repositories[0].id;
                return this.scmService.getReviewers(
                  this.getGetReviewersRequest(
                    projectId,
                    repositoryId,
                    pageIndex,
                    this.defaultPageSize,
                    filter
                  )
                );
              } else {
                return EMPTY;
              }
            }),
            catchError((error) => {
              this.setErrorMessage(error);
              this.setLoadingData(false);
              return EMPTY;
            })
          )
        ),
        tap(() => {
          this.setLoadingData(false);
        }),
        catchError((error) => {
          this.setLoadingData(false);
          this.setErrorMessage(error);
          return EMPTY;
        }),
        takeUntilDestroyed()
      ),
      { initialValue: this.emptyPage }
    );

    const reviewerSuggestions$ = combineLatest([
      toObservable(this.newReviewerSuggestions),
      this.filterReset$,
    ]).pipe(
      switchMap(([newOptions, isFilterReset]) => {
        if (isFilterReset) {
          this.setFilterReset(false);
          return of([]);
        }
        return this.addNewReviewersToSuggestions(newOptions);
      }),
      takeUntilDestroyed()
    );
    this.reviewerSuggestions = toSignal(reviewerSuggestions$, {
      initialValue: [],
    });
  }

  private setErrorMessage(error: string) {
    this.errorMessage.set(error);
  }

  setPageIndex(index: number) {
    this.pageIndex.set(index);
  }
  setProjectId(projectId: string) {
    this.projectIdSubject.next(projectId);
  }

  setFilter(filter: string) {
    this.filterSubject.next(filter);
  }

  private setLoadingData(isLoading: boolean): void {
    this.isLoadingData.set(isLoading);
  }

  setFilterReset(reset: boolean) {
    this.filterResetSubject.next(reset);
  }

  getGetReviewersRequest(
    projectId: string,
    repositoryId: string,
    page: number,
    size: number,
    filter: string
  ): GetReviewersRequest {
    return {
      projectId: projectId,
      repositoryId: repositoryId,
      page: page,
      size: size,
      filter: filter,
    };
  }

  private addNewReviewersToSuggestions(
    newReviewers: Reviewer[]
  ): Observable<Reviewer[]> {
    if (this.pageIndex() === 0) {
      return of([...newReviewers]);
    } else {
      return of(this.reviewerSuggestions().concat(...newReviewers));
    }
  }
}
