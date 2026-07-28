import { computed, DestroyRef, signal, WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MxEvolveDropdownDataProvider } from "../../models/dropdown-data-provider.interface";
import { DropdownOption } from "../../models/dropdown-option.interface";
import { DEFAULT_DROPDOWN_CONFIG } from "../../models/dropdown-config.interface";
import { MxEvolveSingleSelectDropdownState } from "../../models/single-select-dropdown-state.interface";
import { MxevolveDropdownBackendStateBase } from "../../state/mxevolve-dropdown-backend-state-base";

/**
 * Backend state provider for single-select dropdown with paginated data
 * Not an Angular service - instantiate directly with constructor
 */
export class MxevolveSingleSelectBackendStateProvider<T, TParams = unknown>
  extends MxevolveDropdownBackendStateBase<T, TParams>
  implements MxEvolveSingleSelectDropdownState<T, TParams>
{
  selectedItem: WritableSignal<T | null> = signal<T | null>(null);

  dropdownOptions = computed<DropdownOption<T>[]>(() => {
    const items = this.items() || [];
    const selectedItem = this.selectedItem();

    if (selectedItem) {
      const selectedId = this.dataProvider.getItemId(selectedItem);
      const isSelectedInList = items.some(
        (item) => this.dataProvider.getItemId(item) === selectedId
      );

      if (!isSelectedInList) {
        return [
          this.dataProvider.toDropdownOption(selectedItem),
          ...items.map((item) => this.dataProvider.toDropdownOption(item)),
        ];
      }
    }

    return items.map((item) => this.dataProvider.toDropdownOption(item));
  });

  constructor(
    dataProvider: MxEvolveDropdownDataProvider<T, TParams>,
    destroyRef: DestroyRef,
    pageSize: number = DEFAULT_DROPDOWN_CONFIG.pageSize,
    debounceTime: number = DEFAULT_DROPDOWN_CONFIG.debounceTime
  ) {
    super(dataProvider, destroyRef, pageSize, debounceTime);

    this.items$.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
      this.syncSelectedItemWithList(value);
    });
  }

  /**
   * Syncs the selectedItem signal with the matching item from the loaded items list.
   * This ensures PrimeNG's reference comparison works correctly when the selected
   * item was set before items were loaded
   */
  private syncSelectedItemWithList(items: T[]): void {
    const currentSelected = this.selectedItem();
    if (!currentSelected || items.length === 0) {
      return;
    }

    const selectedId = this.dataProvider.getItemId(currentSelected);
    const matchingItem = items.find(
      (item) => this.dataProvider.getItemId(item) === selectedId
    );

    if (matchingItem && matchingItem !== currentSelected) {
      this.selectedItem.set(matchingItem);
    }
  }

  setSelectedItem(item: T | null): void {
    this.selectedItem.set(item);
  }
}
