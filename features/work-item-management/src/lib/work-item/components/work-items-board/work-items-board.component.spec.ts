import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  NO_ERRORS_SCHEMA,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { By } from "@angular/platform-browser";
import { WorkItemsBoardComponent } from "./work-items-board.component";
import { WorkItemBoardStateService } from "./services/state/work-item-board-state.service";
import { WorkItemBoardViewMode } from "./model/work-item-board-view-mode.enum";
import { WorkItemBoardRealtimeSyncService } from "./services/realtime-sync/work-item-board-realtime-sync.service";

const TEST_PROJECT_ID = "project-123";
const OLD_PROJECT_ID = "old-id";

class MockWorkItemBoardStateService {
  private readonly columns = signal<{ id: string; title?: string }[]>([
    { id: "todo", title: "To Do" },
  ]);
  private readonly isLoading = signal<boolean>(false);
  readonly totalItemsSignal: Signal<number> = signal<number>(0);

  initializeBoard = jest.fn();
  columnConfigs = jest.fn(() => this.columns());
  columnsInLoadingState = jest.fn(() => this.isLoading());
  handleBoardScroll = jest.fn();
  setSelectedProjects = jest.fn();
  setIsProjectSpecific = jest.fn();

  readonly viewModeSignal = signal(WorkItemBoardViewMode.KANBAN);
  viewMode = () => this.viewModeSignal();

  setColumns(v: { id: string; title?: string }[]) {
    this.columns.set(v);
  }
  setLoading(v: boolean) {
    this.isLoading.set(v);
  }
  setTotal(n: number) {
    (this.totalItemsSignal as WritableSignal<number>).set(n);
  }
}

class MockWorkItemBoardRealtimeSyncService {
  connect = jest.fn();
  disconnect = jest.fn();
}

@Component({
  selector: "mxevolve-work-items-board-header",
  standalone: true,
  template: "",
})
class MockWorkItemsBoardHeaderComponent {}

@Component({
  selector: "mxevolve-work-items-board-filters",
  standalone: true,
  template: "",
})
class MockWorkItemsBoardFiltersComponent {}

@Component({
  selector: "mxevolve-work-items-column",
  standalone: true,
  template: "",
})
class MockWorkItemsColumnComponent {
  @Input() columnId?: string;
  @Input() title?: string;
}

@Component({
  selector: "mxevolve-work-item-card-skeleton",
  standalone: true,
  template: "",
})
class MockWorkItemCardSkeletonComponent {}

@Component({
  selector: "mxevolve-work-items-kanban-view",
  standalone: true,
  template: "",
})
class MockWorkItemsKanbanViewComponent {
  @Input() scrollContainer?: HTMLDivElement;
}

@Component({
  selector: "mxevolve-work-items-swimlane-view",
  standalone: true,
  template: "",
})
class MockWorkItemsSwimlaneViewComponent {}

describe("WorkItemsBoardComponent", () => {
  let fixture: ComponentFixture<WorkItemsBoardComponent>;
  let component: WorkItemsBoardComponent;
  let state: MockWorkItemBoardStateService;
  let realtimeSync: MockWorkItemBoardRealtimeSyncService;

  beforeEach(async () => {
    jest.useFakeTimers();
    state = new MockWorkItemBoardStateService();
    realtimeSync = new MockWorkItemBoardRealtimeSyncService();

    TestBed.overrideComponent(WorkItemsBoardComponent, {
      set: {
        imports: [
          CommonModule,
          MockWorkItemsBoardHeaderComponent,
          MockWorkItemsBoardFiltersComponent,
          MockWorkItemsColumnComponent,
          MockWorkItemCardSkeletonComponent,
          MockWorkItemsKanbanViewComponent,
          MockWorkItemsSwimlaneViewComponent,
        ],
        providers: [
          { provide: WorkItemBoardStateService, useValue: state },
          { provide: WorkItemBoardRealtimeSyncService, useValue: realtimeSync },
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [WorkItemsBoardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkItemsBoardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should always render header", () => {
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css("mxevolve-work-items-board-header"))
    ).toBeTruthy();
  });

  it("should not call setSelectedProjects or setIsProjectSpecific if projectId is not present", () => {
    fixture.detectChanges();
    const setIsProjectSpecificSpy = jest.spyOn(state, "setIsProjectSpecific");
    const setSelectedProjectsSpy = jest.spyOn(state, "setSelectedProjects");

    component.projectId = undefined;
    component.ngOnChanges({
      projectId: {
        currentValue: undefined,
        previousValue: OLD_PROJECT_ID,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(setIsProjectSpecificSpy).not.toHaveBeenCalled();
    expect(setSelectedProjectsSpy).not.toHaveBeenCalled();
  });

  it("should not call setSelectedProjects or setIsProjectSpecific if projectId did not change", () => {
    fixture.detectChanges();
    const setIsProjectSpecificSpy = jest.spyOn(state, "setIsProjectSpecific");
    const setSelectedProjectsSpy = jest.spyOn(state, "setSelectedProjects");
    component.projectId = TEST_PROJECT_ID;

    component.ngOnChanges({});

    expect(setIsProjectSpecificSpy).not.toHaveBeenCalled();
    expect(setSelectedProjectsSpy).not.toHaveBeenCalled();
  });

  it("should render Kanban view when viewMode is KANBAN", () => {
    state.viewMode = () => WorkItemBoardViewMode.KANBAN;
    fixture.detectChanges();

    const kanban = fixture.debugElement.query(
      By.css("mxevolve-work-items-kanban-view")
    );
    const swimlane = fixture.debugElement.query(
      By.css("mxevolve-work-items-swimlane-view")
    );
    expect(kanban).toBeTruthy();
    expect(swimlane).toBeFalsy();
  });

  it("should render Swimlane view when viewMode is SWIMLANE", () => {
    state.viewMode = () => WorkItemBoardViewMode.SWIMLANE;

    fixture.detectChanges();

    const kanban = fixture.debugElement.query(
      By.css("mxevolve-work-items-kanban-view")
    );
    const swimlane = fixture.debugElement.query(
      By.css("mxevolve-work-items-swimlane-view")
    );
    expect(kanban).toBeFalsy();
    expect(swimlane).toBeTruthy();
  });

  describe("computed signals", () => {
    it("should expose viewMode computed signal", () => {
      state.viewModeSignal.set(WorkItemBoardViewMode.KANBAN);
      fixture.detectChanges();

      expect(component.viewMode()).toBe(WorkItemBoardViewMode.KANBAN);

      state.viewModeSignal.set(WorkItemBoardViewMode.SWIMLANE);
      fixture.detectChanges();

      expect(component.viewMode()).toBe(WorkItemBoardViewMode.SWIMLANE);
    });

    it("should expose isKanbanView computed signal", () => {
      state.viewModeSignal.set(WorkItemBoardViewMode.KANBAN);
      fixture.detectChanges();

      expect(component.isKanbanView()).toBe(true);
      expect(component.isSwimlaneView()).toBe(false);
    });

    it("should expose isSwimlaneView computed signal", () => {
      state.viewModeSignal.set(WorkItemBoardViewMode.SWIMLANE);
      fixture.detectChanges();

      expect(component.isSwimlaneView()).toBe(true);
      expect(component.isKanbanView()).toBe(false);
    });

    it("should update computed signals reactively when viewMode changes", () => {
      state.viewModeSignal.set(WorkItemBoardViewMode.KANBAN);
      fixture.detectChanges();

      expect(component.isKanbanView()).toBe(true);
      expect(component.isSwimlaneView()).toBe(false);

      state.viewModeSignal.set(WorkItemBoardViewMode.SWIMLANE);
      fixture.detectChanges();

      expect(component.isKanbanView()).toBe(false);
      expect(component.isSwimlaneView()).toBe(true);
    });
  });

  describe("lifecycle", () => {
    it("should call both initializeBoard and connect on component initialization", () => {
      expect(state.initializeBoard).not.toHaveBeenCalled();
      expect(realtimeSync.connect).not.toHaveBeenCalled();

      fixture.detectChanges();

      expect(state.initializeBoard).toHaveBeenCalledTimes(1);
      expect(realtimeSync.connect).toHaveBeenCalledTimes(1);
    });

    it("should handle projectId input on first change", () => {
      component.projectId = TEST_PROJECT_ID;

      component.ngOnChanges({
        projectId: {
          currentValue: TEST_PROJECT_ID,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(state.setIsProjectSpecific).toHaveBeenCalledWith(true);
      expect(state.setSelectedProjects).toHaveBeenCalledWith([TEST_PROJECT_ID]);
    });

    it("should handle projectId input on subsequent changes", () => {
      component.projectId = TEST_PROJECT_ID;

      component.ngOnChanges({
        projectId: {
          currentValue: TEST_PROJECT_ID,
          previousValue: OLD_PROJECT_ID,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(state.setIsProjectSpecific).toHaveBeenCalledWith(true);
      expect(state.setSelectedProjects).toHaveBeenCalledWith([TEST_PROJECT_ID]);
    });
  });
});
