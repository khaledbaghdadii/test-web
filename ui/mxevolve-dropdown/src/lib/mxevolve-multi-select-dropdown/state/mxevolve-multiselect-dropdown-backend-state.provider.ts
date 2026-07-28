import { computed, DestroyRef, signal, WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxEvolveDropdownDataProvider } from "../../models/dropdown-data-provider.interface";
import { DropdownOption } from "../../models/dropdown-option.interface";
import { DEFAULT_DROPDOWN_CONFIG } from "../../models/dropdown-config.interface";
import { MxEvolveDropdownState } from "../../models/dropdown-state.interface";
import { MxevolveDropdownBackendStateBase } from "../../state/mxevolve-dropdown-backend-state-base";

/**
 * Backend state provider for multi-select dropdown with paginated data
 * Not an Angular service - instantiate directly with constructor
 */
export class MxevolveDropdownBackendStateProvider<T, TParams = unknown>
  extends MxevolveDropdownBackendStateBase<T, TParams>
  implements MxEvolveDropdownState<T, TParams>
{
  selectedItems: WritableSignal<T[]> = signal<T[]>([]);

  dropdownOptions = computed<DropdownOption<T>[]>(() => {
    const items = this.items() || [];
    const selectedItems = this.selectedItems() || [];

    const selectedIds = new Set(
      selectedItems.map((item) => this.dataProvider.getItemId(item))
    );

    const itemsNotSelected = items.filter(
      (item) => !selectedIds.has(this.dataProvider.getItemId(item))
    );

    const allItems = [...selectedItems, ...itemsNotSelected];

    return allItems.map((item) => this.dataProvider.toDropdownOption(item));
  });

  constructor(
    dataProvider: MxEvolveDropdownDataProvider<T, TParams>,
    destroyRef: DestroyRef,
    pageSize: number = DEFAULT_DROPDOWN_CONFIG.pageSize,
    debounceTime: number = DEFAULT_DROPDOWN_CONFIG.debounceTime
  ) {
    super(dataProvider, destroyRef, pageSize, debounceTime);

    this.items$.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
      this.syncSelectedItemsWithList(value);
    });
  }

  /**
   * Syncs selected items with matching items from the loaded list.
   * This ensures consistent references when items are prefilled before
   * the API loads, preventing mixed reference issues.
   */
  private syncSelectedItemsWithList(items: T[]): void {
    const currentSelected = this.selectedItems();
    if (currentSelected.length === 0 || items.length === 0) {
      return;
    }

    const itemsMap = new Map(
      items.map((item) => [this.dataProvider.getItemId(item), item])
    );

    let needsUpdate = false;
    const syncedItems = currentSelected.map((selected) => {
      const selectedId = this.dataProvider.getItemId(selected);
      const matchingItem = itemsMap.get(selectedId);
      if (matchingItem && matchingItem !== selected) {
        needsUpdate = true;
        return matchingItem;
      }
      return selected;
    });

    if (needsUpdate) {
      this.selectedItems.set(syncedItems);
    }
  }

  setSelectedItems(items: T[]): void {
    this.selectedItems.set(items);
  }
}
