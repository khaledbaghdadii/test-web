import { Component, inject } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { WorkItemBoardStateService } from "../../services/state/work-item-board-state.service";
import { WorkItemSwimlaneSelectOption } from "../../model/work-item-swimlane-select-option";
import { WorkItemSwimlaneOptionType } from "../../model/work-item-swimlane-option-type.enum";

@Component({
  selector: "mxevolve-work-item-swimlane-select",
  standalone: true,
  imports: [FormsModule, SelectModule],
  templateUrl: "./work-item-swimlane-select.component.html",
})
export class WorkItemSwimlaneSelectComponent {
  private readonly workItemState = inject(WorkItemBoardStateService);

  get options(): WorkItemSwimlaneSelectOption[] {
    return this.workItemState.swimlaneOptions;
  }

  get selected(): WorkItemSwimlaneOptionType | null {
    return this.workItemState.filters.sortBy() as WorkItemSwimlaneOptionType | null;
  }

  onSortByChange(sortBy: WorkItemSwimlaneOptionType | null): void {
    this.workItemState.setSortBy(sortBy);
  }
}
