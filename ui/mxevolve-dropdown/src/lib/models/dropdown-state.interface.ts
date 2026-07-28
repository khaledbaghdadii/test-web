import { WritableSignal } from "@angular/core";
import { MxEvolveBaseDropdownState } from "./base-dropdown-state.interface";

/**
 * Interface for multi-select dropdown state management
 * Extends base interface with multi-selection specific properties
 * @template T - The type of data items
 * @template TParams - The type of parameters needed for data fetching
 */
export interface MxEvolveDropdownState<T, TParams = unknown>
  extends MxEvolveBaseDropdownState<T, TParams> {
  /**
   * Signal containing currently selected items (multiple)
   */
  readonly selectedItems: WritableSignal<T[]>;

  /**
   * Set the selected items
   */
  setSelectedItems(items: T[]): void;
}
