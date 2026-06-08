import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { NgClass } from "@angular/common";
import { InputTextModule } from "primeng/inputtext";
import { DatePickerModule } from "primeng/datepicker";
import { WorkItemPriorityFilterComponent } from "./work-item-priority-filter/work-item-priority-filter.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemPriority } from "../../../model/work-item";
import { MultiSelectModule } from "primeng/multiselect";
import { MultiTagsInputComponent } from "../../../../../../../../ui/inputs/src/lib/multi-tags-input/multi-tags-input.component";
import { SelectModule } from "primeng/select";
import { WorkItemSwimlaneSelectComponent } from "./work-item-swimlane-dropdown/work-item-swimlane-select.component";
import { WorkItemsObjectIdMultiSelectComponent } from "./work-items-object-id-multi-select-component/work-items-object-id-multi-select.component";
import { WorkItemObjectIdOption } from "./work-items-object-id-multi-select-component/state-service/work-items-object-id-multi-select-state.service";

@Component({
  selector: "mxevolve-work-items-board-filters",
  imports: [
    NgClass,
    FormsModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    MultiTagsInputComponent,
    WorkItemPriorityFilterComponent,
    WorkItemSwimlaneSelectComponent,
    WorkItemsObjectIdMultiSelectComponent,
  ],
  templateUrl: "./work-items-board-filters.component.html",
  styleUrl: "./work-items-board-filters.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkItemsBoardFiltersComponent {
  private readonly workItemState = inject(WorkItemBoardStateService);

  readonly workItemStatuses = computed(() =>
    this.workItemState.columnConfigs().map((col) => col.status)
  );

  readonly selectedPriority = computed(() =>
    this.workItemState.filters.selectedPriority()
  );

  readonly selectedObjectIds = computed(() => {
    const ids = this.workItemState.filters.selectedObjectIds();
    return ids.map((id) => ({ id } as WorkItemObjectIdOption));
  });

  readonly selectedAssignees = computed(() =>
    this.workItemState.filters.selectedAssignees()
  );

  readonly selectedCategories = computed(() =>
    this.workItemState.filters.selectedCategories()
  );

  readonly selectedDateRange = computed(() =>
    this.workItemState.filters.selectedDateRange()
  );

  readonly availableCategories = computed(() =>
    this.workItemState.availableCategories()
  );

  readonly selectedProjects = computed(() =>
    this.workItemState.filters.selectedProjects()
  );

  private static readonly ACTIVE_FILTER_CLASSES = "filter-active";

  readonly filterHighlight = computed(() => {
    const cls = WorkItemsBoardFiltersComponent.ACTIVE_FILTER_CLASSES;
    return {
      sortBy: this.workItemState.filters.sortBy() ? cls : "",
      priority: this.selectedPriority() ? cls : "",
      objectIds: this.selectedObjectIds().length > 0 ? cls : "",
      assignees: this.selectedAssignees().length > 0 ? cls : "",
      categories: this.selectedCategories().length > 0 ? cls : "",
      dateRange: this.selectedDateRange() ? cls : "",
    };
  });

  onObjectIdsChange(objectIds: WorkItemObjectIdOption[]): void {
    this.workItemState.setSelectedObjectIds(
      objectIds.map((option) => option.id)
    );
  }

  onPriorityChange(priority: WorkItemPriority | null): void {
    this.workItemState.setSelectedPriority(priority);
  }

  onAssigneesChange(assignees: string[]): void {
    this.workItemState.setSelectedAssignees(assignees);
  }

  onCategoriesChange(categories: string[]): void {
    this.workItemState.setSelectedCategories(categories);
  }

  onDateRangeChange(dates: Date[] | null): void {
    if (!dates || dates.length === 0) {
      this.workItemState.setSelectedDateRange(null);
      return;
    }
    const hasFirstDate = dates[0];
    const hasSecondDate = dates.length === 2 && dates[1];
    if (!hasFirstDate) {
      this.workItemState.setSelectedDateRange(null);
      return;
    }
    const startDate = new Date(dates[0]);
    startDate.setHours(0, 0, 0, 0);
    if (!hasSecondDate) {
      this.workItemState.setSelectedDateRange({ startDate, endDate: null });
      return;
    }
    const endDate = new Date(dates[1]);
    endDate.setHours(23, 59, 59, 999);
    this.workItemState.setSelectedDateRange({ startDate, endDate });
  }

  clearCategoryFilter(): void {
    this.workItemState.setSelectedCategories([]);
  }
}
