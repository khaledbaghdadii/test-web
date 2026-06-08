import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input, ElementRef } from "@angular/core";
import { By } from "@angular/platform-browser";

import { WorkItemsSwimlaneComponent } from "./work-items-swimlane.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemBoardColumnConfig } from "../model/work-item-board-column-config.model";
import { WorkItemStatus } from "../../../model/work-item";
import { WorkItemsColumnComponent } from "../work-items-column/work-items-column.component";
import { WorkItemCardSkeletonComponent } from "../../work-item-card/work-item-card-skeleton/work-item-card-skeleton.component";
import { WorkItemSwimlaneConfig } from "../model/work-item-swimlane-config.model";
import { WorkItemSwimlaneGroupBy } from "../model/work-item-swimlane-group-by.enum";

@Component({
  selector: "mxevolve-work-items-column",
  standalone: true,
  template: "",
})
class MockWorkItemsColumn {
  @Input() columnId: string = "";
  @Input() swimlaneId: string = "";
}

@Component({
  selector: "mxevolve-work-item-card-skeleton",
  standalone: true,
  template: "",
})
class MockWorkItemCardSkeleton {}

describe("WorkItemsSwimlaneComponent", () => {
  let fixture: ComponentFixture<WorkItemsSwimlaneComponent>;
  let component: WorkItemsSwimlaneComponent;

  let state: {
    columnConfigs: jest.Mock;
    workItemSwimlaneConfigs: jest.Mock;
    getColumnStateSignalForContext: jest.Mock;
    toggleSwimlaneCollapse: jest.Mock;
    handleBoardScroll: jest.Mock;
  };

  const SWIMLANE: WorkItemSwimlaneConfig = {
    id: "high",
    title: "High Priority",
    groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
    value: "HIGH",
    isCollapsed: false,
  };

  const COLUMNS: WorkItemBoardColumnConfig[] = [
    { id: "open", title: "Open", status: WorkItemStatus.OPEN },
    { id: "done", title: "Done", status: WorkItemStatus.DONE },
  ];

  beforeAll(() => {
    jest.useFakeTimers();
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        return setTimeout(() => cb(performance.now()), 16) as unknown as number;
      });
  });

  afterAll(() => {
    (window.requestAnimationFrame as jest.Mock).mockRestore?.();
    jest.useRealTimers();
  });

  beforeEach(async () => {
    state = {
      columnConfigs: jest.fn().mockReturnValue(COLUMNS),
      workItemSwimlaneConfigs: jest.fn().mockReturnValue([SWIMLANE]),
      getColumnStateSignalForContext: jest
        .fn()
        .mockImplementation((colId: string) => {
          return () => ({
            totalItems: colId === "open" ? 3 : 2,
            loading: colId === "open",
          });
        }),
      toggleSwimlaneCollapse: jest.fn(),
      handleBoardScroll: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [WorkItemsSwimlaneComponent],
      providers: [{ provide: WorkItemBoardStateService, useValue: state }],
    })
      .overrideComponent(WorkItemsSwimlaneComponent, {
        remove: {
          imports: [WorkItemsColumnComponent, WorkItemCardSkeletonComponent],
        },
        add: { imports: [MockWorkItemsColumn, MockWorkItemCardSkeleton] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(WorkItemsSwimlaneComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workItemSwimlaneConfig", { ...SWIMLANE });
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  async function flushAnimationFrame() {
    await Promise.resolve();
    jest.advanceTimersByTime(16);
  }

  function getContainerEl(): HTMLDivElement | null {
    const ref = (
      component as unknown as { swimlaneContainer?: ElementRef<HTMLDivElement> }
    ).swimlaneContainer;
    return ref?.nativeElement ?? null;
  }

  function makeScrollable(
    el: HTMLDivElement,
    opts?: { scrollTop?: number; clientHeight?: number; scrollHeight?: number }
  ) {
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

  async function setupFresh(
    overrides?: Partial<typeof state>,
    swimlane: WorkItemSwimlaneConfig = SWIMLANE
  ) {
    if (overrides) Object.assign(state, overrides);
    fixture.destroy();
    fixture = TestBed.createComponent(WorkItemsSwimlaneComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workItemSwimlaneConfig", { ...swimlane });
    fixture.detectChanges();
  }

  it("creates the component", () => {
    expect(component).toBeTruthy();
  });

  it("exposes columns from state", () => {
    expect(component.columns()).toEqual(COLUMNS);
  });

  it("reflects non-collapsed swimlane", () => {
    state.workItemSwimlaneConfigs.mockReturnValue([
      { ...SWIMLANE, isCollapsed: false },
    ]);

    fixture.detectChanges();

    expect(component.isCollapsed()).toBe(false);
  });

  it("sums per-column totals into totalItems", () => {
    expect(component.totalItems()).toBe(5);
  });

  it("toggles collapse via the state service", () => {
    const toggleBtn = fixture.debugElement.query(
      By.css('[data-testid="swimlane-collapse-toggle"]')
    );

    toggleBtn.triggerEventHandler("onClick", {});

    expect(state.toggleSwimlaneCollapse).toHaveBeenCalledWith("high");
  });

  it("initializes scroll listener when expanded and container is present", () => {
    const container = getContainerEl();

    expect(container).toBeTruthy();
  });

  it("forwards scroll metrics with swimlane id on scroll", async () => {
    const el = getContainerEl()!;
    makeScrollable(el, {
      scrollTop: 100,
      clientHeight: 300,
      scrollHeight: 1600,
    });
    el.scrollTop = 250;
    el.dispatchEvent(new Event("scroll"));

    await flushAnimationFrame();

    const [pos, height, laneId] = state.handleBoardScroll.mock.calls.at(-1)!;
    expect(pos).toBe(250 + 300);
    expect(height).toBe(1600);
    expect(laneId).toBe("high");
  });

  it("coalesces rapid scroll events and forwards only the latest values (rAF)", async () => {
    const el = getContainerEl()!;
    makeScrollable(el, { scrollTop: 0, clientHeight: 250, scrollHeight: 2000 });
    el.scrollTop = 400;
    el.dispatchEvent(new Event("scroll"));
    el.scrollTop = 700;
    el.dispatchEvent(new Event("scroll"));

    await flushAnimationFrame();

    const [pos, height] = state.handleBoardScroll.mock.calls.at(-1)!;
    expect(pos).toBe(700 + 250);
    expect(height).toBe(2000);
  });

  it("does not forward scroll when container is absent", () => {
    (
      component as unknown as { swimlaneContainer?: ElementRef<HTMLDivElement> }
    ).swimlaneContainer = undefined;

    (
      component as unknown as { handleSwimlaneScroll: () => void }
    ).handleSwimlaneScroll();

    expect(state.handleBoardScroll).not.toHaveBeenCalled();
  });

  it("does not respond to scroll when initialized collapsed", async () => {
    await setupFresh({
      workItemSwimlaneConfigs: jest
        .fn()
        .mockReturnValue([{ ...SWIMLANE, isCollapsed: true }]),
    });
    const el = getContainerEl();
    if (el) {
      el.dispatchEvent(new Event("scroll"));
      await flushAnimationFrame();
    }
    expect(state.handleBoardScroll).not.toHaveBeenCalled();
  });

  it("re-initializes scroll listener after collapse and expand cycle", async () => {
    const el = getContainerEl()!;
    makeScrollable(el, { scrollTop: 0, clientHeight: 200, scrollHeight: 1000 });
    state.workItemSwimlaneConfigs.mockReturnValue([
      { ...SWIMLANE, isCollapsed: true },
    ]);
    fixture.detectChanges();

    state.workItemSwimlaneConfigs.mockReturnValue([
      { ...SWIMLANE, isCollapsed: false },
    ]);
    fixture.detectChanges();

    el.scrollTop = 100;
    el.dispatchEvent(new Event("scroll"));
    await flushAnimationFrame();

    expect(state.handleBoardScroll).toHaveBeenCalledWith(300, 1000, "high");
  });

  it("passes columnId and swimlaneId to child column components", async () => {
    await setupFresh({
      columnConfigs: jest.fn().mockReturnValue([
        { id: "open", title: "Open", status: WorkItemStatus.OPEN },
        { id: "review", title: "Review", status: WorkItemStatus.DONE },
      ]),
    });

    const children = fixture.debugElement.queryAll(
      By.directive(MockWorkItemsColumn)
    );
    const inputs = children.map(
      (de) => de.componentInstance as MockWorkItemsColumn
    );

    expect(inputs.length).toBe(2);
    expect(inputs[0].columnId).toBe("open");
    expect(inputs[0].swimlaneId).toBe("high");
    expect(inputs[1].columnId).toBe("review");
    expect(inputs[1].swimlaneId).toBe("high");
  });

  it("renders no child columns when there are no columns", async () => {
    await setupFresh({ columnConfigs: jest.fn().mockReturnValue([]) });

    const children = fixture.debugElement.queryAll(
      By.directive(MockWorkItemsColumn)
    );

    expect(children.length).toBe(0);
  });

  it("trackByColumnId returns the id", () => {
    expect(component.trackByColumnId(0, { id: "foo" })).toBe("foo");
  });
});
