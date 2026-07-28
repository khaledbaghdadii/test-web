import { DestroyRef, signal, Signal, WritableSignal } from "@angular/core";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  EMPTY,
  Observable,
  scan,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { catchError, withLatestFrom } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxEvolveDropdownDataProvider } from "../models/dropdown-data-provider.interface";
import { DEFAULT_DROPDOWN_CONFIG } from "../models/dropdown-config.interface";
import { PageResponse } from "../models/page-response.interface";

/**
 * Abstract base class for backend-driven dropdown state providers.
 * Encapsulates reactive state management, pagination, search, and data fetching.
 * Subclasses implement selection-specific logic (single vs multi) and subscribe
 * to items$ in their own constructor for selection sync.
 */
export abstract class MxevolveDropdownBackendStateBase<T, TParams = unknown> {
  protected readonly dataProvider: MxEvolveDropdownDataProvider<T, TParams>;
  private readonly pageSize: number;
  private readonly debounceTimeMs: number;

  private readonly dataParamsSubject = new Subject<TParams>();
  private readonly pageIndexSubject = new BehaviorSubject<number>(0);
  private readonly pageSizeSubject: BehaviorSubject<number>;
  private readonly searchKeySubject = new BehaviorSubject<string>("");
  readonly errorMessageSubject = new Subject<string>();

  searchKey: Signal<string>;
  loading: WritableSignal<boolean> = signal(false);
  private pendingPageLoad = false;

  private readonly itemsPage$: Observable<PageResponse<T>>;
  readonly itemsPage: Signal<PageResponse<T> | undefined>;

  readonly items$: Observable<T[]>;
  readonly items: Signal<T[] | undefined>;

  protected constructor(
    dataProvider: MxEvolveDropdownDataProvider<T, TParams>,
    destroyRef: DestroyRef,
    pageSize: number = DEFAULT_DROPDOWN_CONFIG.pageSize,
    debounceTime: number = DEFAULT_DROPDOWN_CONFIG.debounceTime
  ) {
    this.dataProvider = dataProvider;
    this.pageSize = pageSize;
    this.debounceTimeMs = debounceTime;
    this.pageSizeSubject = new BehaviorSubject<number>(this.pageSize);

    const searchKeyWritable = signal<string>("");
    const itemsPageWritable = signal<PageResponse<T> | undefined>(undefined);
    const itemsWritable = signal<T[] | undefined>(undefined);

    this.searchKeySubject
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => searchKeyWritable.set(value));

    this.itemsPage$ = this.createItemsPageStream(destroyRef);
    this.itemsPage$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => itemsPageWritable.set(value));

    this.items$ = this.createItemsStream();
    this.items$.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
      itemsWritable.set(value);
    });

    this.searchKey = searchKeyWritable.asReadonly();
    this.itemsPage = itemsPageWritable.asReadonly();
    this.items = itemsWritable.asReadonly();
  }

  private createItemsPageStream(
    destroyRef: DestroyRef
  ): Observable<PageResponse<T>> {
    return combineLatest([
      this.dataParamsSubject,
      this.pageSizeSubject,
      this.pageIndexSubject,
      this.searchKeySubject,
    ]).pipe(
      debounceTime(this.debounceTimeMs),
      tap(() => this.loading.set(true)),
      switchMap(([params, pageSize, pageIndex, searchKey]) => {
        return this.dataProvider.fetchData(
          params,
          pageIndex,
          pageSize,
          searchKey
        );
      }),
      tap(() => {
        this.loading.set(false);
        this.pendingPageLoad = false;
      }),
      catchError((error: Error) => {
        this.loading.set(false);
        this.pendingPageLoad = false;
        this.errorMessageSubject.next(error.message);
        return EMPTY;
      }),
      takeUntilDestroyed(destroyRef),
      shareReplay(1)
    );
  }

  private createItemsStream(): Observable<T[]> {
    return this.itemsPage$.pipe(
      withLatestFrom(this.pageIndexSubject),
      scan((allItems: T[], [itemsPage, pageIndex]) => {
        const accumulate = pageIndex > 0;
        return accumulate
          ? this.dedupeItems([...allItems, ...itemsPage.content])
          : itemsPage.content;
      }, [])
    );
  }

  setDataParams(params: TParams): void {
    this.pageIndexSubject.next(0);
    this.searchKeySubject.next("");
    this.dataParamsSubject.next(params);
  }

  setPageIndex(index: number): void {
    this.pageIndexSubject.next(index);
  }

  setSearchKey(searchKey: string): void {
    this.searchKeySubject.next(searchKey);
  }

  attemptLoadingMoreItems(): void {
    if (!this.itemsPage()?.last && !this.pendingPageLoad) {
      this.pendingPageLoad = true;
      this.pageIndexSubject.next(this.pageIndexSubject.value + 1);
    }
  }

  protected dedupeItems(items: T[]): T[] {
    return Array.from(
      new Map(
        items.map((item) => [this.dataProvider.getItemId(item), item])
      ).values()
    );
  }
}
