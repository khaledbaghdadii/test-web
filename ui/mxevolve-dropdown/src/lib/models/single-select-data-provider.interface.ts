import { Observable } from "rxjs";
import { DropdownOption } from "./dropdown-option.interface";

/**
 * Interface for single-select dropdown data provider
 * Used when data is fetched from backend once and filtered on frontend
 * @template T - The type of data items
 * @template TParams - The type of parameters needed for fetching data (e.g., { projectId: string })
 */
export interface MxEvolveSingleSelectDataProvider<T, TParams = unknown> {
  /**
   * Fetch all data from the backend
   * This method is called once to load all items, frontend handles filtering
   * @param params - Parameters needed for the data fetch (e.g., projectId)
   */
  fetchData(params: TParams): Observable<T[]>;

  /**
   * Convert a data item to a dropdown option
   * @param item - The data item to convert
   */
  toDropdownOption(item: T): DropdownOption<T>;

  /**
   * Get unique identifier for an item (used for deduplication and comparison)
   * @param item - The data item
   */
  getItemId(item: T): string | number;
}
