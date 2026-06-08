import {
  Component,
  AfterViewInit,
  DestroyRef,
  NgZone,
  inject,
  computed,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";

import { auditTime } from "rxjs/operators";
import { animationFrameScheduler, fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemsColumnComponent } from "../work-items-column/work-items-column.component";
import { WorkItemCardSkeletonComponent } from "../../work-item-card/work-item-card-skeleton/work-item-card-skeleton.component";

@Component({
  selector: "mxevolve-work-items-kanban-view",
  imports: [WorkItemsColumnComponent, WorkItemCardSkeletonComponent],
  templateUrl: "./work-items-kanban-view.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: "display: contents",
  },
})
export class WorkItemsKanbanViewComponent implements AfterViewInit {
  @Input() scrollContainer!: HTMLDivElement;

  private readonly workItemState = inject(WorkItemBoardStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  readonly columns = computed(() => this.workItemState.columnConfigs());
  readonly columnsInLoadingState = computed(() =>
    this.workItemState.columnsInLoadingState()
  );

  readonly trackByColumnId = (_index: number, column: { id: string }) =>
    column.id;

  ngAfterViewInit(): void {
    this.initializeScrollListener();
  }

  private initializeScrollListener(): void {
    const el = this.scrollContainer;
    if (!el) return;
    this.ngZone.runOutsideAngular(() => {
      fromEvent(el, "scroll", { passive: true })
        .pipe(
          auditTime(0, animationFrameScheduler),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.ngZone.run(() => this.handleKanbanScroll());
        });
    });
  }

  private handleKanbanScroll(): void {
    const el = this.scrollContainer;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    const scrollPosition = scrollTop + clientHeight;
    this.workItemState.handleBoardScroll(scrollPosition, scrollHeight);
  }
}
