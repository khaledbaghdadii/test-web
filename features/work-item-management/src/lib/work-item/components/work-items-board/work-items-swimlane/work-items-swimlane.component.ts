import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  NgZone,
  ViewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { animationFrameScheduler, fromEvent } from "rxjs";
import { auditTime } from "rxjs/operators";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemBoardColumnConfig } from "../model/work-item-board-column-config.model";
import { WorkItemSwimlaneConfig } from "../model/work-item-swimlane-config.model";
import { WorkItemsColumnComponent } from "../work-items-column/work-items-column.component";
import { WorkItemCardSkeletonComponent } from "../../work-item-card/work-item-card-skeleton/work-item-card-skeleton.component";

@Component({
  selector: "mxevolve-work-items-swimlane",
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    BadgeModule,
    WorkItemsColumnComponent,
    WorkItemCardSkeletonComponent,
  ],
  templateUrl: "./work-items-swimlane.component.html",
  styleUrls: ["./work-items-swimlane.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkItemsSwimlaneComponent implements AfterViewInit {
  @Input({ required: true }) workItemSwimlaneConfig!: WorkItemSwimlaneConfig;

  @ViewChild("swimlaneContainer", { static: false })
  private readonly swimlaneContainer!: ElementRef<HTMLDivElement>;

  private readonly workItemState = inject(WorkItemBoardStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  private scrollListenerInitialized = false;

  readonly columns = computed(() => this.workItemState.columnConfigs());

  readonly isCollapsed = computed(
    () => this.getSwimlaneConfig()?.isCollapsed ?? false
  );

  readonly totalItems = computed(() =>
    this.columns().reduce(
      (total: number, column: WorkItemBoardColumnConfig) =>
        total + this.getColumnState(column.id).totalItems,
      0
    )
  );

  readonly trackByColumnId = (_: number, column: { id: string }) => column.id;

  ngAfterViewInit(): void {
    this.tryInitializeScrollListener();
  }

  toggleCollapse(): void {
    this.workItemState.toggleSwimlaneCollapse(this.workItemSwimlaneConfig.id);
  }

  private getSwimlaneConfig(): WorkItemSwimlaneConfig | undefined {
    return this.workItemState
      .workItemSwimlaneConfigs()
      .find((config) => config.id === this.workItemSwimlaneConfig.id);
  }

  private getColumnState(columnId: string) {
    return this.workItemState.getColumnStateSignalForContext(
      columnId,
      this.workItemSwimlaneConfig.id
    )();
  }

  private tryInitializeScrollListener(): void {
    const shouldInit =
      !this.scrollListenerInitialized &&
      this.swimlaneContainer?.nativeElement &&
      !this.isCollapsed();
    if (shouldInit) {
      this.initializeScrollListener();
      this.scrollListenerInitialized = true;
    } else if (this.scrollListenerInitialized && this.isCollapsed()) {
      this.scrollListenerInitialized = false;
    }
  }

  private initializeScrollListener(): void {
    const element = this.swimlaneContainer?.nativeElement;
    if (!element) return;
    this.ngZone.runOutsideAngular(() => {
      fromEvent(element, "scroll", { passive: true })
        .pipe(
          auditTime(0, animationFrameScheduler),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.ngZone.run(() => this.handleSwimlaneScroll()));
    });
  }

  private handleSwimlaneScroll(): void {
    const element = this.swimlaneContainer?.nativeElement;
    if (!element) return;

    const { scrollTop, clientHeight, scrollHeight } = element;
    const scrollPosition = scrollTop + clientHeight;

    this.workItemState.handleBoardScroll(
      scrollPosition,
      scrollHeight,
      this.workItemSwimlaneConfig.id
    );
  }
}
