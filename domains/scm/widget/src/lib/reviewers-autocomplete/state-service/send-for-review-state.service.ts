import { computed, inject, Injectable, signal, Signal } from "@angular/core";
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
  Reviewer,
  ReviewersService,
  ReviewersPage,
} from "@mxevolve/domains/scm/data-access";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";

@Injectable()
export class SendForReviewStateService {
  private readonly defaultPageIndex = 0;
  private readonly defaultPageSize = 15;
  private readonly emptyPage: ReviewersPage = {
    content: [],
    page: 0,
    totalElements: 0,
    last: false,
  };

  private readonly projectIdSubject = new Subject<string>();
  private readonly projectId$ = this.projectIdSubject.asObservable();

  private readonly repositoryIdSubject = new Subject<string>();
  private readonly repositoryId$ = this.repositoryIdSubject.asObservable();

  readonly pageIndex = signal(this.defaultPageIndex);

  private readonly filterResetSubject = new BehaviorSubject<boolean>(false);
  private readonly filterReset$ = this.filterResetSubject.asObservable();

  private readonly filterSubject = new Subject<string>();
  private readonly filter$ = this.filterSubject.asObservable();

  private readonly reviewersService = inject(ReviewersService);

  readonly reviewersPage: Signal<ReviewersPage>;

  readonly errorMessage = signal<string | undefined>(undefined);

  readonly newReviewerSuggestions = computed(
    () => this.reviewersPage().content
  );
  readonly reviewerSuggestions: Signal<Reviewer[]>;
  readonly isLastPage = computed(() => {
    const isLast = this.reviewersPage().last;
    if (isLast) {
      return isLast;
    }
    return false;
  });
  readonly isLoadingData = signal(false);

  constructor() {
    const pageIndex$ = toObservable(this.pageIndex);
    this.reviewersPage = toSignal(
      combineLatest({
        projectId: this.projectId$,
        repositoryId: this.repositoryId$,
        pageIndex: pageIndex$,
        filter: this.filter$,
      }).pipe(
        tap(() => {
          this.setLoadingData(true);
        }),
        switchMap(({ projectId, repositoryId, pageIndex, filter }) =>
          this.reviewersService
            .getReviewers(
              projectId,
              repositoryId,
              filter,
              pageIndex,
              this.defaultPageSize
            )
            .pipe(
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

    const reviewerSuggestions$ = combineLatest({
      newOptions: toObservable(this.newReviewerSuggestions),
      isFilterReset: this.filterReset$,
    }).pipe(
      switchMap(({ newOptions, isFilterReset }) => {
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

  setRepositoryId(repositoryId: string) {
    this.repositoryIdSubject.next(repositoryId);
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
