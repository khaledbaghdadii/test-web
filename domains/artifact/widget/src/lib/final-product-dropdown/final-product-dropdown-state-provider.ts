import { computed, DestroyRef, signal, WritableSignal } from "@angular/core";
import {
  DropdownOption,
  MxevolveSingleSelectBackendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import type { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import type {
  CommitLabelInfo,
  FinalProductDataProvider,
  FinalProductParams,
} from "./final-product-data-provider";

/**
 * Final Product dropdown state provider that
 *
 * - keeps the prefilled/initial final product visible in the dropdown options
 *   at all times, even after the user clears the current selection (without
 *   this, clearing removes the item from `dropdownOptions` since the shared
 *   base provider only pins the *currently selected* item, making it disappear
 *   from the list and impossible to search for again), and
 * - rebuilds the option labels once the commit descriptions arrive, so the
 *   asynchronously-loaded commit messages appear without refetching the list
 *   (legacy `final-product-dropdown-state.service.ts` behaviour).
 */
export class FinalProductDropdownStateProvider extends MxevolveSingleSelectBackendStateProvider<
  FinalProduct,
  FinalProductParams
> {
  private readonly pinnedItem: WritableSignal<FinalProduct | undefined> =
    signal(undefined);
  private readonly commitsInfo: WritableSignal<
    ReadonlyMap<string, CommitLabelInfo>
  > = signal(new Map());

  constructor(dataProvider: FinalProductDataProvider, destroyRef: DestroyRef) {
    super(dataProvider, destroyRef);

    this.dropdownOptions = computed<DropdownOption<FinalProduct>[]>(() => {
      const items = this.items() ?? [];
      const commitsInfo = this.commitsInfo();
      const idsInList = new Set(
        items.map((item) => dataProvider.getItemId(item))
      );

      const extras: FinalProduct[] = [];
      const pinned = this.pinnedItem();
      if (pinned && !idsInList.has(dataProvider.getItemId(pinned))) {
        extras.push(pinned);
        idsInList.add(dataProvider.getItemId(pinned));
      }

      const selected = this.selectedItem();
      if (selected && !idsInList.has(dataProvider.getItemId(selected))) {
        extras.push(selected);
      }

      return [...extras, ...items].map((item) =>
        dataProvider.toDropdownOption(item, commitsInfo)
      );
    });
  }

  /** Keep this final product visible in the dropdown options regardless of selection. */
  setPinnedItem(item: FinalProduct | undefined): void {
    this.pinnedItem.set(item);
  }

  /** Commit descriptions used to label the options, keyed by commit id. */
  setCommitsInfo(commitsInfo: ReadonlyMap<string, CommitLabelInfo>): void {
    this.commitsInfo.set(commitsInfo);
  }

  /** The commit ids currently represented in the option list. */
  visibleCommitIds(): string[] {
    const items = this.items() ?? [];
    return Array.from(
      new Set(
        [...items, this.pinnedItem(), this.selectedItem()]
          .filter((item): item is FinalProduct => !!item)
          .map((item) => item.configurationCommitId)
      )
    );
  }
}
