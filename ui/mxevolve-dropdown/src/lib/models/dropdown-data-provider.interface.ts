import { Observable } from "rxjs";
import { PageResponse } from "./page-response.interface";
import { DropdownOption } from "./dropdown-option.interface";

/**
 * Interface that users must implement to provide data for the dropdown
 * @template T - The type of data items
 * @template TParams - The type of parameters needed for fetching data (e.g., { projectId: string })
 */
export interface MxEvolveDropdownDataProvider<T, TParams = unknown> {
  /**
   * Fetch paginated data
   * @param params - Parameters needed for the data fetch (e.g., projectId)
   * @param pageIndex - Zero-based page index (optional for non-paginated sources)
   * @param pageSize - Number of items per page (optional for non-paginated sources)
   * @param searchKey - Search/filter text (optional if search not supported)
   */
  fetchData(
    params: TParams,
    pageIndex?: number,
    pageSize?: number,
    searchKey?: string
  ): Observable<PageResponse<T>>;

  /**
   * Convert a data item to a dropdown option
   * @param item - The data item to convert
   */
  toDropdownOption(item: T): DropdownOption<T>;

  /**
   * Get unique identifier for an item (used for deduplication)
   * @param item - The data item
   */
  getItemId(item: T): string | number;
}
