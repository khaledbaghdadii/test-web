import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { BadgeModule } from "primeng/badge";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { WorkItem } from "../../../model/work-item";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemBoardColumnConfig } from "../model/work-item-board-column-config.model";
import { WorkItemCardComponent } from "../../work-item-card/work-item-card.component";

@Component({
  selector: "mxevolve-work-items-column",
  imports: [
    CardModule,
    BadgeModule,
    ProgressSpinnerModule,
    WorkItemCardComponent,
  ],
  templateUrl: "./work-items-column.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkItemsColumnComponent {
  @Input({ required: true }) columnId!: string;
  @Input() swimlaneId?: string;

  private readonly workItemState = inject(WorkItemBoardStateService);

  readonly columnState = computed(() =>
    this.workItemState.getColumnStateSignalForContext(
      this.columnId,
      this.swimlaneId
    )()
  );

  readonly columnConfig = computed(() => {
    const configs = this.workItemState.columnConfigs();
    return (
      configs.find(
        (col: WorkItemBoardColumnConfig) => col.id === this.columnId
      ) ?? null
    );
  });

  readonly items = computed(() => this.columnState().items);
  readonly totalItems = computed(() => this.columnState().totalItems);

  readonly trackByWorkItemId = (_: number, item: WorkItem) => item.id;
}
