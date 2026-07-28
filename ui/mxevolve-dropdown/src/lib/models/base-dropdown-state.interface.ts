import { Signal, WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import { DropdownOption } from "./dropdown-option.interface";
import { PageResponse } from "./page-response.interface";

/**
 * Base interface for dropdown state management
 * Contains common properties shared between multi-select and single-select dropdowns
 * @template T - The type of data items
 * @template TParams - The type of parameters needed for data fetching
 */
export interface MxEvolveBaseDropdownState<T, TParams = unknown> {
  /**
   * Signal containing all loaded items (accumulated across pages for paginated sources)
   */
  readonly items: Signal<T[] | undefined>;

  /**
   * Signal containing dropdown options derived from items
   */
  readonly dropdownOptions: Signal<DropdownOption<T>[]>;

  /**
   * Signal containing current search key
   */
  readonly searchKey: Signal<string | undefined>;

  /**
   * Signal indicating loading state
   */
  readonly loading: WritableSignal<boolean>;

  /**
   * Subject for error messages
   */
  readonly errorMessageSubject: Subject<string>;

  /**
   * Signal containing current page response
   */
  readonly itemsPage: Signal<PageResponse<T> | undefined>;

  /**
   * Set the data parameters (e.g., projectId)
   */
  setDataParams(params: TParams): void;

  /**
   * Set the current page index
   */
  setPageIndex(index: number): void;

  /**
   * Set the search key
   */
  setSearchKey(searchKey: string): void;

  /**
   * Attempt to load more items if not at the last page
   */
  attemptLoadingMoreItems(): void;
}
