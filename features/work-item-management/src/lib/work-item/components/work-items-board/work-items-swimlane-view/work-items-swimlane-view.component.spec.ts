import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input, signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { WorkItemsSwimlaneViewComponent } from "./work-items-swimlane-view.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemSwimlaneGroupBy } from "../model/work-item-swimlane-group-by.enum";
import { WorkItemSwimlaneConfig } from "../model/work-item-swimlane-config.model";
import { WorkItemsSwimlaneComponent } from "../work-items-swimlane/work-items-swimlane.component";

@Component({
  selector: "mxevolve-work-items-swimlane",
  standalone: true,
  template: "",
})
class MockSwimlaneComponent {
  @Input() workItemSwimlaneConfig?: WorkItemSwimlaneConfig;
}

function createMockStateService() {
  const swimlanes = signal<WorkItemSwimlaneConfig[]>([
    {
      id: "high-priority",
      title: "High",
      groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
      value: "HIGH",
      isCollapsed: false,
    },
    {
      id: "low-priority",
      title: "Low",
      groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
      value: "LOW",
      isCollapsed: false,
    },
  ]);
  const priority = signal<string | null>(null);
  const categories = signal<string[]>([]);

  return {
    workItemSwimlaneConfigs: swimlanes.asReadonly(),
    filters: {
      selectedPriority: priority.asReadonly(),
      selectedCategories: categories.asReadonly(),
    },
    _setSwimlanes: (configs: WorkItemSwimlaneConfig[]) =>
      swimlanes.set(configs),
    _setPriority: (value: string | null) => priority.set(value),
    _setCategories: (values: string[]) => categories.set(values),
  };
}

describe("WorkItemsSwimlaneViewComponent", () => {
  let component: WorkItemsSwimlaneViewComponent;
  let fixture: ComponentFixture<WorkItemsSwimlaneViewComponent>;
  let mockState: ReturnType<typeof createMockStateService>;

  function getSwimlaneElements() {
    return fixture.debugElement.queryAll(By.directive(MockSwimlaneComponent));
  }

  beforeEach(async () => {
    mockState = createMockStateService();

    await TestBed.configureTestingModule({
      imports: [WorkItemsSwimlaneViewComponent],
      providers: [{ provide: WorkItemBoardStateService, useValue: mockState }],
    })
      .overrideComponent(WorkItemsSwimlaneViewComponent, {
        remove: { imports: [WorkItemsSwimlaneComponent] },
        add: { imports: [MockSwimlaneComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkItemsSwimlaneViewComponent);
    component = fixture.componentInstance;
  });

  describe("Swimlane Rendering", () => {
    it("should render all swimlanes when state contains swimlane configs", () => {
      fixture.detectChanges();

      expect(getSwimlaneElements()).toHaveLength(2);
    });

    it("should update rendered swimlanes when swimlane configs change", () => {
      fixture.detectChanges();

      mockState._setSwimlanes([
        {
          id: "bug",
          title: "Bug",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "bug",
          isCollapsed: false,
        },
        {
          id: "feature",
          title: "Feature",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "feature",
          isCollapsed: false,
        },
        {
          id: "task",
          title: "Task",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "task",
          isCollapsed: false,
        },
      ]);
      fixture.detectChanges();

      expect(getSwimlaneElements()).toHaveLength(3);
    });
  });

  describe("Priority Filtering", () => {
    it("should show all priority swimlanes when no priority filter is set", () => {
      fixture.detectChanges();

      expect(getSwimlaneElements()).toHaveLength(2);
    });

    it("should display only swimlanes provided by the state service when priority filter is set", () => {
      mockState._setSwimlanes([
        {
          id: "high-priority",
          title: "High",
          groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
          value: "HIGH",
          isCollapsed: false,
        },
      ]);
      mockState._setPriority("HIGH");

      fixture.detectChanges();

      const elements = getSwimlaneElements();
      expect(elements).toHaveLength(1);
      expect(elements[0].componentInstance.workItemSwimlaneConfig?.value).toBe(
        "HIGH"
      );
    });
  });

  describe("Category Filtering", () => {
    beforeEach(() => {
      mockState._setSwimlanes([
        {
          id: "bug",
          title: "Bug",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "bug",
          isCollapsed: false,
        },
        {
          id: "feature",
          title: "Feature",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "feature",
          isCollapsed: false,
        },
        {
          id: "task",
          title: "Task",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "task",
          isCollapsed: false,
        },
      ]);
    });

    it("should show all category swimlanes when no category filter is set", () => {
      fixture.detectChanges();

      expect(getSwimlaneElements()).toHaveLength(3);
    });

    it("should display only swimlanes provided by the state service when category filter is set", () => {
      mockState._setSwimlanes([
        {
          id: "bug",
          title: "Bug",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "bug",
          isCollapsed: false,
        },
        {
          id: "task",
          title: "Task",
          groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
          value: "task",
          isCollapsed: false,
        },
      ]);
      mockState._setCategories(["bug", "task"]);

      fixture.detectChanges();

      const elements = getSwimlaneElements();
      expect(elements).toHaveLength(2);
      expect(
        elements.map((el) => el.componentInstance.workItemSwimlaneConfig?.value)
      ).toEqual(["bug", "task"]);
    });
  });

  describe("trackBySwimlaneId", () => {
    it("should return swimlane id when called", () => {
      const swimlane = { id: "test-swimlane" };

      const result = component.trackBySwimlaneId(0, swimlane);

      expect(result).toBe("test-swimlane");
    });
  });
});
