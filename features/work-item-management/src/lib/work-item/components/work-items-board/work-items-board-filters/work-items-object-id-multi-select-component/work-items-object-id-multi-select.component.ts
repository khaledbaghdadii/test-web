import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import { InputTextModule } from "primeng/inputtext";
import { AutoFocus } from "primeng/autofocus";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { LazyLoadEvent } from "primeng/api";
import {
  WorkItemsObjectIdMultiSelectStateService,
  WorkItemObjectIdOption,
} from "./state-service/work-items-object-id-multi-select-state.service";
import { WorkItemStatus } from "../../../../model/work-item";

@Component({
  selector: "mxevolve-work-items-object-id-multi-select",
  templateUrl: "./work-items-object-id-multi-select.component.html",
  standalone: true,
  imports: [
    MultiSelectModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    AutoFocus,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [WorkItemsObjectIdMultiSelectStateService],
})
export class WorkItemsObjectIdMultiSelectComponent {
  private readonly stateService = inject(
    WorkItemsObjectIdMultiSelectStateService
  );

  @Input() selectedObjectIds: WorkItemObjectIdOption[];
  @Input() set projectIds(ids: string[] | undefined) {
    this.stateService.setProjectIdsSubject(ids);
  }
  @Input() set workItemStatuses(statuses: WorkItemStatus[] | undefined) {
    this.stateService.setWorkItemStatusesSubject(statuses);
  }

  @Output() selectedObjectIdsChange = new EventEmitter<
    WorkItemObjectIdOption[]
  >();

  readonly itemsStep = 5;
  readonly virtualScrollItemSize = 40;

  readonly errorMessageSignal = this.stateService.errorMessageSignal;
  readonly isLastPageSignal = this.stateService.isLastPageSignal;
  readonly isLoadingDataSignal = this.stateService.isLoadingDataSignal;
  readonly pageIndexSignal = this.stateService.pageIndexSignal;
  readonly searchKeySignal = this.stateService.searchKeySignal;
  readonly optionsSignal = this.stateService.workItemObjectIdOptionsSignal;

  sortedOptions = computed(() => {
    const selectedObjectIds = this.selectedObjectIds ?? [];
    const selectedIds = new Set(
      selectedObjectIds.map((o: WorkItemObjectIdOption) => o.id)
    );
    const allObjectIds = this.optionsSignal();
    const missingSelectedObjectIds = selectedObjectIds.filter(
      (selected: WorkItemObjectIdOption) =>
        !allObjectIds.some((o) => o.id === selected.id)
    );
    const merged = [...missingSelectedObjectIds, ...allObjectIds];
    return [
      ...merged.filter((o) => selectedIds.has(o.id)),
      ...merged.filter((o) => !selectedIds.has(o.id)),
    ];
  });

  handleSelectionChange(selected: WorkItemObjectIdOption[]): void {
    this.selectedObjectIdsChange.emit(selected);
  }

  handleClearSelection(): void {
    this.selectedObjectIdsChange.emit([]);
  }

  handleScroll = (event: LazyLoadEvent): void => {
    if (this.shouldLoadMoreData(event.last ?? 0)) {
      this.stateService.setPageIndexSubject(this.pageIndexSignal() + 1);
    }
  };

  handleSearchKeyChange(search: string): void {
    this.stateService.setPageIndexSubject(0);
    this.stateService.setSearchKeySubject(search);
  }

  handleClearSearchKey(event: { stopPropagation: () => void }) {
    if (this.searchKeySignal()) {
      event.stopPropagation();
      this.stateService.setPageIndexSubject(0);
      this.stateService.setSearchKeySubject("");
    }
  }

  private shouldLoadMoreData(last: number): boolean {
    return (
      !this.isLastPageSignal() &&
      this.sortedOptions().length <= last &&
      !this.isLoadingDataSignal()
    );
  }
}
