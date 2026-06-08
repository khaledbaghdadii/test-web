import { computed, Injectable, Signal, signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  switchMap,
  tap,
} from "rxjs";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import { MergeConfigurationPage } from "../../merge-configuration/model/merge-configuration-page";
import { MergeConfiguration } from "../../merge-configuration/model/merge-configuration";
import { MergeConfigurationService } from "../../merge-configuration/merge-configuration.service";
import { MergeConfigurationFilterRequest } from "../../merge-configuration/model/request/merge-configuration-filter-request";

@Injectable()
export class MergeConfigurationMultiSelectStateService {
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly DEFAULT_PAGE_INDEX = 0;
  private static readonly EMPTY_PAGE: MergeConfigurationPage = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    size: 0,
    number: 0,
    last: true,
  };
  private static readonly DEBOUNCE_TIME_MS = 100;

  private readonly projectIdSubject = new BehaviorSubject<string>("");
  private readonly repositoryIdSubject = new BehaviorSubject<string>("");
  private readonly searchKeySubject = new BehaviorSubject<string>("");
  private readonly pageIndexSubject = new BehaviorSubject<number>(
    MergeConfigurationMultiSelectStateService.DEFAULT_PAGE_INDEX
  );

  private readonly mergeConfigurationPageSignal: Signal<MergeConfigurationPage>;
  private readonly newMergeConfigurationsSignal: Signal<MergeConfiguration[]>;

  readonly isLoadingDataSignal = signal(false);
  readonly errorMessageSignal = signal<string>("");
  readonly searchKeySignal: Signal<string | undefined>;
  readonly pageIndexSignal: Signal<number>;
  readonly isLastPageSignal: Signal<boolean>;
  readonly mergeConfigurationsSignal: Signal<MergeConfiguration[]>;

  constructor(
    private readonly mergeConfigurationService: MergeConfigurationService
  ) {
    this.searchKeySignal = toSignal(
      this.searchKeySubject
        .asObservable()
        .pipe(
          debounceTime(
            MergeConfigurationMultiSelectStateService.DEBOUNCE_TIME_MS
          ),
          distinctUntilChanged(),
          takeUntilDestroyed()
        )
    );

    this.pageIndexSignal = toSignal(
      this.pageIndexSubject
        .asObservable()
        .pipe(distinctUntilChanged(), takeUntilDestroyed()),
      { initialValue: 0 }
    );

    this.mergeConfigurationPageSignal = toSignal(
      this.createMergeConfigurationPageStream(),
      { initialValue: MergeConfigurationMultiSelectStateService.EMPTY_PAGE }
    );

    this.newMergeConfigurationsSignal = computed(
      () => this.mergeConfigurationPageSignal().content
    );

    this.mergeConfigurationsSignal = toSignal(
      toObservable(this.newMergeConfigurationsSignal).pipe(
        switchMap((newMergeConfigurations) =>
          this.addNewMergeConfigurations(newMergeConfigurations)
        ),
        takeUntilDestroyed()
      ),
      { initialValue: [] }
    );

    this.isLastPageSignal = computed(
      () => this.mergeConfigurationPageSignal().last
    );
  }

  setProjectIdSubject(projectId: string): void {
    this.projectIdSubject.next(projectId);
  }

  setRepositoryIdSubject(repositoryId: string): void {
    this.repositoryIdSubject.next(repositoryId);
  }

  setSearchKeySubject(searchKey: string): void {
    this.searchKeySubject.next(searchKey);
  }

  setPageIndexSubject(index: number): void {
    this.pageIndexSubject.next(index);
  }

  private createMergeConfigurationPageStream(): Observable<MergeConfigurationPage> {
    return combineLatest([
      this.projectIdSubject.asObservable(),
      this.repositoryIdSubject.asObservable(),
      toObservable(this.pageIndexSignal),
      toObservable(this.searchKeySignal),
    ]).pipe(
      tap(() => this.setLoadingDataSignal(true)),
      switchMap(([projectId, repositoryId, pageIndex, searchKey]) =>
        this.fetchMergeConfigurations(
          projectId,
          repositoryId,
          pageIndex,
          searchKey ?? ""
        )
      ),
      tap(() => this.setLoadingDataSignal(false)),
      catchError((error) => {
        this.setErrorMessageSignal(error.message);
        return of(MergeConfigurationMultiSelectStateService.EMPTY_PAGE);
      }),
      takeUntilDestroyed()
    );
  }

  private fetchMergeConfigurations(
    projectId: string,
    repositoryId: string,
    pageIndex: number,
    filter: string
  ): Observable<MergeConfigurationPage> {
    const filterRequest: MergeConfigurationFilterRequest = {
      searchKey: filter,
      repositoryId: repositoryId,
    };

    return this.mergeConfigurationService
      .getFilteredMergeConfigurations(
        projectId,
        filterRequest,
        MergeConfigurationMultiSelectStateService.DEFAULT_PAGE_SIZE,
        pageIndex
      )
      .pipe(
        catchError((error) => {
          this.setErrorMessageSignal(error.message);
          return of(MergeConfigurationMultiSelectStateService.EMPTY_PAGE);
        })
      );
  }

  private addNewMergeConfigurations(
    newMergeConfigurations: MergeConfiguration[]
  ): Observable<MergeConfiguration[]> {
    const currentConfigurations = this.mergeConfigurationsSignal();
    return of(
      this.pageIndexSignal() === 0
        ? [...newMergeConfigurations]
        : [...currentConfigurations, ...newMergeConfigurations]
    );
  }

  private setLoadingDataSignal(isLoading: boolean): void {
    this.isLoadingDataSignal.set(isLoading);
  }

  private setErrorMessageSignal(message: string): void {
    this.errorMessageSignal.set(message);
  }
}
