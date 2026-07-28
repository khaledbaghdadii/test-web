import { WritableSignal } from "@angular/core";
import { MxEvolveBaseDropdownState } from "./base-dropdown-state.interface";

/**
 * Interface for single-select dropdown state management
 * Extends base interface with single-selection specific properties
 * @template T - The type of data items
 * @template TParams - The type of parameters needed for data fetching
 */
export interface MxEvolveSingleSelectDropdownState<T, TParams = unknown>
  extends MxEvolveBaseDropdownState<T, TParams> {
  /**
   * Signal containing currently selected item (single)
   */
  readonly selectedItem: WritableSignal<T | null>;

  /**
   * Set the selected item
   */
  setSelectedItem(item: T | null): void;
}
