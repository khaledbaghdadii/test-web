import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  Component,
  Input,
  Signal,
  signal,
  WritableSignal,
  NgZone,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { By } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { WorkItemsKanbanViewComponent } from "./work-items-kanban-view.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";

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

describe("WorkItemsKanbanViewComponent", () => {
  let fixture: ComponentFixture<WorkItemsKanbanViewComponent>;
  let component: WorkItemsKanbanViewComponent;
  let state: MockWorkItemBoardStateService;
  let ngZone: NgZone;
  let scrollContainer: HTMLDivElement;

  beforeEach(async () => {
    jest.useFakeTimers();
    state = new MockWorkItemBoardStateService();
    TestBed.overrideComponent(WorkItemsKanbanViewComponent, {
      set: {
        imports: [
          CommonModule,
          MockWorkItemsColumnComponent,
          MockWorkItemCardSkeletonComponent,
        ],
        providers: [{ provide: WorkItemBoardStateService, useValue: state }],
      },
    });
    await TestBed.configureTestingModule({
      imports: [WorkItemsKanbanViewComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(WorkItemsKanbanViewComponent);
    component = fixture.componentInstance;
    ngZone = TestBed.inject(NgZone);
    scrollContainer = document.createElement("div");
    scrollContainer.style.height = "200px";
    scrollContainer.style.overflow = "auto";
    component.scrollContainer = scrollContainer;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function makeScrollable(opts?: {
    scrollTop?: number;
    clientHeight?: number;
    scrollHeight?: number;
  }) {
    const el = scrollContainer;
    el.scrollTop = opts?.scrollTop ?? 0;
    Object.defineProperty(el, "clientHeight", {
      value: opts?.clientHeight ?? 200,
      configurable: true,
    });
    Object.defineProperty(el, "scrollHeight", {
      value: opts?.scrollHeight ?? 1000,
      configurable: true,
    });
    return el;
  }

  it("should setup scroll subscription outside zone", () => {
    const spyRunOutside = jest.spyOn(ngZone, "runOutsideAngular");
    fixture.detectChanges();

    component.ngAfterViewInit();

    expect(spyRunOutside.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("should forward metrics on single scroll", () => {
    fixture.detectChanges();
    component.ngAfterViewInit();
    const el = makeScrollable({
      scrollTop: 100,
      clientHeight: 300,
      scrollHeight: 1600,
    });
    el.scrollTop = 250;

    el.dispatchEvent(new Event("scroll"));
    jest.runAllTimers();

    const [pos, height] = state.handleBoardScroll.mock.calls.at(-1)!;
    expect(pos).toBe(250 + 300);
    expect(height).toBe(1600);
  });

  it("should coalesce multiple scrolls and forward latest values", () => {
    fixture.detectChanges();
    component.ngAfterViewInit();
    const el = makeScrollable({
      scrollTop: 0,
      clientHeight: 250,
      scrollHeight: 2000,
    });

    el.scrollTop = 400;
    el.dispatchEvent(new Event("scroll"));
    el.scrollTop = 700;
    el.dispatchEvent(new Event("scroll"));
    jest.runAllTimers();

    const [lastPos, lastHeight] = state.handleBoardScroll.mock.calls.at(-1)!;
    expect(lastPos).toBe(700 + 250);
    expect(lastHeight).toBe(2000);
  });

  it("should run inner handler inside zone on scroll", () => {
    const runSpy = jest.spyOn(ngZone, "run");
    fixture.detectChanges();
    component.ngAfterViewInit();
    const el = makeScrollable();
    el.scrollTop = 100;

    el.dispatchEvent(new Event("scroll"));
    jest.runAllTimers();

    expect(runSpy).toHaveBeenCalled();
  });

  it("should compute columns and reflect updates", () => {
    fixture.detectChanges();

    expect(component.columns()).toEqual([{ id: "todo", title: "To Do" }]);
    state.setColumns([{ id: "A" }, { id: "B" }]);

    expect(component.columns()).toEqual([{ id: "A" }, { id: "B" }]);
  });

  it("should compute loading and reflect updates", () => {
    fixture.detectChanges();

    expect(component.columnsInLoadingState()).toBe(false);
    state.setLoading(true);

    expect(component.columnsInLoadingState()).toBe(true);
    state.setLoading(false);
    expect(component.columnsInLoadingState()).toBe(false);
  });

  it("should use trackBy column id", () => {
    const id = component.trackByColumnId(7, { id: "col-7" });

    expect(id).toBe("col-7");
  });

  it("should render skeletons when loading", () => {
    state.setLoading(true);
    state.setColumns([{ id: "todo" }, { id: "inprogress" }]);
    fixture.detectChanges();
    component.scrollContainer = scrollContainer;
    fixture.detectChanges();

    const skeletons = fixture.debugElement.queryAll(
      By.css("mxevolve-work-item-card-skeleton")
    );

    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render columns when items exist", () => {
    state.setLoading(false);
    state.setColumns([{ id: "todo" }, { id: "inprogress" }, { id: "review" }]);
    fixture.detectChanges();
    component.scrollContainer = scrollContainer;
    fixture.detectChanges();

    const cols = fixture.debugElement.queryAll(
      By.css("mxevolve-work-items-column")
    );

    expect(cols.length).toBe(3);
  });

  it("should render columns when loading even if no items", () => {
    state.setLoading(true);
    state.setColumns([{ id: "todo" }, { id: "inprogress" }]);
    fixture.detectChanges();
    component.scrollContainer = scrollContainer;
    fixture.detectChanges();

    const cols = fixture.debugElement.queryAll(
      By.css("mxevolve-work-items-column")
    );

    expect(cols.length).toBe(2);
  });

  it("should set data-column-id and aria-label attributes for each column", () => {
    state.setColumns([
      { id: "colA", title: "Alpha" },
      { id: "colB", title: "Beta" },
    ]);
    fixture.detectChanges();
    component.scrollContainer = scrollContainer;
    fixture.detectChanges();

    const colEls = fixture.debugElement.queryAll(By.css("[data-column-id]"));

    expect(colEls.length).toBe(2);
    expect(colEls[0].attributes["data-column-id"]).toBe("colA");
    expect(colEls[0].attributes["aria-label"]).toBe("Alpha column");
    expect(colEls[1].attributes["data-column-id"]).toBe("colB");
    expect(colEls[1].attributes["aria-label"]).toBe("Beta column");
  });

  it("should render nothing if columns is empty", () => {
    state.setColumns([]);
    fixture.detectChanges();
    component.scrollContainer = scrollContainer;
    fixture.detectChanges();

    const colEls = fixture.debugElement.queryAll(By.css("[data-column-id]"));

    expect(colEls.length).toBe(0);
  });

  it("should not throw if scrollContainer is not set", () => {
    // @ts-expect-error: testing undefined input
    component.scrollContainer = undefined;

    expect(() =>
      (
        component as unknown as { initializeScrollListener: () => void }
      ).initializeScrollListener()
    ).not.toThrow();
  });

  it("should not call handleBoardScroll if scrollContainer is not set", () => {
    // @ts-expect-error: testing undefined input
    component.scrollContainer = undefined;

    expect(() =>
      (
        component as unknown as { handleKanbanScroll: () => void }
      ).handleKanbanScroll()
    ).not.toThrow();
    expect(state.handleBoardScroll).not.toHaveBeenCalled();
  });
});
