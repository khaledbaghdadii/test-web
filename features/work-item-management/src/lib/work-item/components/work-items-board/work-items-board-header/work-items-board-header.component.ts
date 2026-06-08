import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";

import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemsBoardTitleControlsComponent } from "../work-items-board-title-controls/work-items-board-title-controls.component";
import { WorkItemsBoardFiltersComponent } from "../work-items-board-filters/work-items-board-filters.component";
import { WorkItemsColumnHeaderComponent } from "../work-items-column-header/work-items-column-header.component";

@Component({
  selector: "mxevolve-work-items-board-header",
  imports: [
    WorkItemsBoardTitleControlsComponent,
    WorkItemsBoardFiltersComponent,
    WorkItemsColumnHeaderComponent,
  ],
  templateUrl: "./work-items-board-header.component.html",
  styleUrls: ["./work-items-board-header.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkItemsBoardHeaderComponent {
  private readonly workItemState = inject(WorkItemBoardStateService);

  readonly columns = computed(() => this.workItemState.columnConfigs());

  readonly trackByColumnId = (_index: number, column: { id: string }) =>
    column.id;
}
