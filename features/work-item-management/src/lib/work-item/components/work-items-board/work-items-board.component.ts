import {
  Component,
  OnInit,
  inject,
  computed,
  Input,
  SimpleChanges,
  OnChanges,
} from "@angular/core";

import { WorkItemBoardStateService } from "./services/state/work-item-board-state.service";
import { KanbanViewService } from "./services/view-modes/kanban/kanban-view.service";
import { SwimlaneViewService } from "./services/view-modes/swimlane/swimlane-view.service";
import { WorkItemsBoardHeaderComponent } from "./work-items-board-header/work-items-board-header.component";
import { WorkItemsSwimlaneViewComponent } from "./work-items-swimlane-view/work-items-swimlane-view.component";
import { WorkItemsKanbanViewComponent } from "./work-items-kanban-view/work-items-kanban-view.component";
import { WorkItemBoardViewMode } from "./model/work-item-board-view-mode.enum";
import { WorkItemBoardUrlSyncService } from "./services/url-sync/work-item-board-url-sync.service";
import { WorkItemBoardFilterPersistenceService } from "./services/filter-persistence/work-item-board-filter-persistence.service";
import { WorkItemBoardRealtimeSyncService } from "./services/realtime-sync/work-item-board-realtime-sync.service";

@Component({
  selector: "mxevolve-work-items-board",
  imports: [
    WorkItemsBoardHeaderComponent,
    WorkItemsSwimlaneViewComponent,
    WorkItemsKanbanViewComponent,
  ],
  providers: [
    WorkItemBoardStateService,
    WorkItemBoardUrlSyncService,
    WorkItemBoardFilterPersistenceService,
    KanbanViewService,
    SwimlaneViewService,
    WorkItemBoardRealtimeSyncService,
  ],
  host: {
    style: "display: contents",
  },
  templateUrl: "./work-items-board.component.html",
})
export class WorkItemsBoardComponent implements OnInit, OnChanges {
  @Input() projectId?: string;

  private readonly workItemState = inject(WorkItemBoardStateService);
  private readonly realtimeSync = inject(WorkItemBoardRealtimeSyncService);

  readonly viewMode = computed(() => this.workItemState.viewMode());
  readonly isKanbanView = computed(
    () => this.viewMode() === WorkItemBoardViewMode.KANBAN
  );
  readonly isSwimlaneView = computed(
    () => this.viewMode() === WorkItemBoardViewMode.SWIMLANE
  );

  ngOnInit(): void {
    this.workItemState.initializeBoard();
    this.realtimeSync.connect();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["projectId"] && this.projectId) {
      this.workItemState.setIsProjectSpecific(true);
      this.workItemState.setSelectedProjects([this.projectId]);
    }
  }
}
