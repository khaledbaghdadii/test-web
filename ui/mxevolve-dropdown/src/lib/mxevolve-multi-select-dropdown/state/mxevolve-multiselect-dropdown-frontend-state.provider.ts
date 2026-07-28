import {
  computed,
  DestroyRef,
  signal,
  Signal,
  WritableSignal,
} from "@angular/core";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime as rxDebounceTime,
  EMPTY,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { catchError } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxEvolveSingleSelectDataProvider } from "../../models/single-select-data-provider.interface";
import { DropdownOption } from "../../models/dropdown-option.interface";
import { DEFAULT_DROPDOWN_CONFIG } from "../../models/dropdown-config.interface";
import { MxEvolveDropdownState } from "../../models/dropdown-state.interface";
import { PageResponse } from "../../models/page-response.interface";

/**
 * Frontend state provider for multi-select dropdown
 * Fetches all data from backend once and handles filtering on the frontend
 * Uses case-insensitive substring matching on the label for filtering
 */
export class MxevolveMultiselectFrontendStateProvider<T, TParams = unknown>
  implements MxEvolveDropdownState<T, TParams>
{
  private readonly dataProvider: MxEvolveSingleSelectDataProvider<T, TParams>;
  private readonly debounceTimeMs: number;

  private readonly dataParamsSubject = new Subject<TParams>();
  private readonly searchKeySubject = new BehaviorSubject<string>("");
  readonly errorMessageSubject = new Subject<string>();

  /** All items fetched from the backend (unfiltered) */
  private readonly allItemsWritable = signal<T[] | undefined>(undefined);

  searchKey: Signal<string>;
  loading: WritableSignal<boolean> = signal(false);

  /** Signal containing current page response (always last=true for frontend filtering) */
  readonly itemsPage: Signal<PageResponse<T> | undefined>;

  /** Signal containing filtered items based on search key */
  readonly items: Signal<T[] | undefined>;

  /** Observable stream of all items (for external subscription if needed) */
  readonly items$: Observable<T[]>;

  selectedItems: WritableSignal<T[]> = signal<T[]>([]);

  dropdownOptions = computed<DropdownOption<T>[]>(() => {
    const filteredItems = this.items() || [];
    const selectedItems = this.selectedItems() || [];

    const selectedIds = new Set(
      selectedItems.map((item) => this.dataProvider.getItemId(item))
    );

    const itemsNotSelected = filteredItems.filter(
      (item) => !selectedIds.has(this.dataProvider.getItemId(item))
    );

    const allItems = [...selectedItems, ...itemsNotSelected];

    return allItems.map((item) => this.dataProvider.toDropdownOption(item));
  });

  /**
   * Constructor for MxevolveMultiselectFrontendStateProvider
   * @param dataProvider - Implementation that fetches and transforms data (non-paginated)
   * @param destroyRef - Angular DestroyRef for cleanup (inject in parent component)
   * @param debounceTime - Debounce time for search in milliseconds (default from config)
   */
  constructor(
    dataProvider: MxEvolveSingleSelectDataProvider<T, TParams>,
    destroyRef: DestroyRef,
    debounceTime: number = DEFAULT_DROPDOWN_CONFIG.debounceTime
  ) {
    this.dataProvider = dataProvider;
    this.debounceTimeMs = debounceTime;

    const searchKeyWritable = signal<string>("");
    const itemsPageWritable = signal<PageResponse<T> | undefined>(undefined);

    // Subscribe to search key changes
    this.searchKeySubject
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => searchKeyWritable.set(value));

    // Create the items stream
    this.items$ = this.createItemsStream(destroyRef);
    this.items$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => this.allItemsWritable.set(value));

    // Create filtered items based on search key
    this.items = computed(() => {
      const allItems = this.allItemsWritable();
      const searchKey = searchKeyWritable();

      if (!allItems) {
        return undefined;
      }

      if (!searchKey || searchKey.trim() === "") {
        return allItems;
      }

      const lowerSearchKey = searchKey.toLowerCase();
      return allItems.filter((item) => {
        const option = this.dataProvider.toDropdownOption(item);
        return option.label.toLowerCase().includes(lowerSearchKey);
      });
    });

    // Update itemsPage signal (for compatibility - always last=true for frontend filtering)
    combineLatest([this.searchKeySubject])
      .pipe(rxDebounceTime(this.debounceTimeMs), takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        const filtered = this.items();
        if (filtered) {
          itemsPageWritable.set({
            content: filtered,
            last: true,
          });
        }
      });

    this.searchKey = searchKeyWritable.asReadonly();
    this.itemsPage = itemsPageWritable.asReadonly();
  }

  private createItemsStream(destroyRef: DestroyRef): Observable<T[]> {
    return this.dataParamsSubject.pipe(
      tap(() => this.loading.set(true)),
      switchMap((params) => this.dataProvider.fetchData(params)),
      tap(() => this.loading.set(false)),
      catchError((error: Error) => {
        this.loading.set(false);
        this.errorMessageSubject.next(error.message);
        return EMPTY;
      }),
      takeUntilDestroyed(destroyRef),
      shareReplay(1)
    );
  }

  /**
   * Set the data parameters (e.g., projectId)
   * Triggers a new data fetch
   */
  setDataParams(params: TParams): void {
    this.dataParamsSubject.next(params);
  }

  /**
   * Set the selected items
   */
  setSelectedItems(items: T[]): void {
    this.selectedItems.set(items);
  }

  /**
   * Set the current page index
   * Note: For frontend filtering, this is a no-op as all data is loaded at once
   */
  setPageIndex(): void {
    // No-op for frontend filtering - all data is loaded at once
  }

  /**
   * Set the search key for frontend filtering
   */
  setSearchKey(searchKey: string): void {
    this.searchKeySubject.next(searchKey);
  }

  /**
   * Attempt to load more items
   * Note: For frontend filtering, this is a no-op as all data is loaded at once
   */
  attemptLoadingMoreItems(): void {
    // No-op for frontend filtering - all data is loaded at once
  }
}
