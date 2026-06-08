import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { BadgeModule } from "primeng/badge";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemBoardColumnConfig } from "../model/work-item-board-column-config.model";

@Component({
  selector: "mxevolve-work-items-column-header",
  imports: [CardModule, BadgeModule],
  templateUrl: "./work-items-column-header.component.html",
  styleUrls: ["./work-items-column-header.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkItemsColumnHeaderComponent {
  @Input({ required: true }) columnId!: string;

  private readonly workItemState = inject(WorkItemBoardStateService);

  readonly columnState = computed(() =>
    this.workItemState.getColumnStateSignalForContext(this.columnId)()
  );

  readonly columnConfig = computed(() => {
    const configs = this.workItemState.columnConfigs();
    return (
      configs.find(
        (col: WorkItemBoardColumnConfig) => col.id === this.columnId
      ) || null
    );
  });

  readonly totalItems = computed(() => this.columnState().totalItems);
}
