import { Component, inject, ChangeDetectionStrategy } from "@angular/core";

import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemsSwimlaneComponent } from "../work-items-swimlane/work-items-swimlane.component";

@Component({
  selector: "mxevolve-work-items-swimlane-view",
  imports: [WorkItemsSwimlaneComponent],
  templateUrl: "./work-items-swimlane-view.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkItemsSwimlaneViewComponent {
  private readonly workItemState = inject(WorkItemBoardStateService);

  readonly swimlanes = this.workItemState.workItemSwimlaneConfigs;

  readonly trackBySwimlaneId = (_index: number, swimlane: { id: string }) =>
    swimlane.id;
}
