import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
  signal,
  WritableSignal,
} from "@angular/core";
import { WorkItemsBoardFiltersComponent } from "./work-items-board-filters.component";
import { DomTestUtils } from "@mxevolve/testing";
import { WorkItemPriority, WorkItemStatus } from "../../../model/work-item";
import { WorkItemBoardViewMode } from "../model/work-item-board-view-mode.enum";
import { WorkItemObjectIdOption } from "./work-items-object-id-multi-select-component/state-service/work-items-object-id-multi-select-state.service";
import { WorkItemsObjectIdMultiSelectComponent } from "./work-items-object-id-multi-select-component/work-items-object-id-multi-select.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";

@Component({
  selector: "mxevolve-work-items-object-id-multi-select",
  template:
    '<div data-testid="object-id-multiselect">Mock Object Id Multiselect</div>',
  standalone: true,
})
class MockWorkItemsObjectIdMultiSelectComponent {
  @Input() selectedObjectIds: WorkItemObjectIdOption[] = [];
  @Input() projectIds: string[] | undefined;
  @Input() workItemStatuses: WorkItemStatus[] | undefined;
  @Output() selectedObjectIdsChange = new EventEmitter<
    WorkItemObjectIdOption[]
  >();
}

describe("WorkItemsBoardFiltersComponent", () => {
  let component: WorkItemsBoardFiltersComponent;
  let fixture: ComponentFixture<WorkItemsBoardFiltersComponent>;
  let mockWorkItemState: jest.Mocked<WorkItemBoardStateService>;

  beforeEach(async () => {
    const mockWorkItemStateSpy = {
      filters: {
        selectedPriority: signal<WorkItemPriority | null>(null),
        selectedAssignees: signal<string[]>([]),
        selectedCategories: signal<string[]>([]),
        selectedDateRange: signal(null),
        showMyTasksOnly: signal(false),
        selectedProjects: signal<string[]>([]),
        selectedObjectIds: signal<string[]>([]),
        sortBy: signal<string | null>(null),
      },
      availableCategories: signal([]),
      columnConfigs: signal([
        { id: "open", title: "Open", status: WorkItemStatus.OPEN },
        { id: "assigned", title: "Assigned", status: WorkItemStatus.ASSIGNED },
        { id: "underway", title: "Underway", status: WorkItemStatus.UNDERWAY },
        { id: "pending", title: "Pending", status: WorkItemStatus.PENDING },
        { id: "done", title: "Done", status: WorkItemStatus.DONE },
      ]),
      setSelectedPriority: jest.fn(),
      setSelectedAssignees: jest.fn(),
      setSelectedCategories: jest.fn(),
      setSelectedDateRange: jest.fn(),
      setSelectedObjectIds: jest.fn(),
      viewMode: signal(WorkItemBoardViewMode.KANBAN),
      workItemSwimlaneConfigs: signal([]),
    };

    await TestBed.configureTestingModule({
      imports: [
        WorkItemsBoardFiltersComponent,
        MockWorkItemsObjectIdMultiSelectComponent,
      ],
      providers: [
        { provide: WorkItemBoardStateService, useValue: mockWorkItemStateSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(WorkItemsBoardFiltersComponent, {
        remove: {
          imports: [WorkItemsObjectIdMultiSelectComponent],
        },
        add: {
          imports: [MockWorkItemsObjectIdMultiSelectComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkItemsBoardFiltersComponent);
    component = fixture.componentInstance;
    mockWorkItemState = TestBed.inject(
      WorkItemBoardStateService
    ) as jest.Mocked<WorkItemBoardStateService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call setSelectedPriority when priority changes", () => {
    component.onPriorityChange(WorkItemPriority.HIGH);

    expect(mockWorkItemState.setSelectedPriority).toHaveBeenCalledWith(
      WorkItemPriority.HIGH
    );
  });

  it("should call setAssigneeFilter when assignee changes", () => {
    component.onAssigneesChange(["john.doe"]);

    expect(mockWorkItemState.setSelectedAssignees).toHaveBeenCalledWith([
      "john.doe",
    ]);
  });

  it("should call setSelectedCategories when categories change", () => {
    const categories = ["development", "testing"];
    component.onCategoriesChange(categories);

    expect(mockWorkItemState.setSelectedCategories).toHaveBeenCalledWith(
      categories
    );
  });

  it("should call setSelectedDateRange when date range changes", () => {
    const dates = [
      new Date("2024-01-01T12:00:00"),
      new Date("2024-01-31T12:00:00"),
    ];

    component.onDateRangeChange(dates);

    expect(mockWorkItemState.setSelectedDateRange).toHaveBeenCalled();
    const call = mockWorkItemState.setSelectedDateRange.mock.calls[0][0];
    expect(call!.startDate!.getHours()).toBe(0);
    expect(call!.startDate!.getMinutes()).toBe(0);
    expect(call!.endDate!.getHours()).toBe(23);
    expect(call!.endDate!.getMinutes()).toBe(59);
  });

  it("should clear date range when null dates are provided", () => {
    component.onDateRangeChange(null);

    expect(mockWorkItemState.setSelectedDateRange).toHaveBeenCalledWith(null);
  });

  it("should clear date range when empty dates array is provided", () => {
    component.onDateRangeChange([]);

    expect(mockWorkItemState.setSelectedDateRange).toHaveBeenCalledWith(null);
  });

  it("should clear date range when first date is null", () => {
    const dates = [null as unknown as Date];

    component.onDateRangeChange(dates);

    expect(mockWorkItemState.setSelectedDateRange).toHaveBeenCalledWith(null);
  });

  it("should handle single date selection", () => {
    const dates = [new Date("2024-01-01T12:00:00")];

    component.onDateRangeChange(dates);

    expect(mockWorkItemState.setSelectedDateRange).toHaveBeenCalled();
    const call = mockWorkItemState.setSelectedDateRange.mock.calls[0][0];
    expect(call!.startDate!.getHours()).toBe(0);
    expect(call!.endDate).toBeNull();
  });

  it("should clear category filter when clearCategoryFilter is called", () => {
    component.clearCategoryFilter();

    expect(mockWorkItemState.setSelectedCategories).toHaveBeenCalledWith([]);
  });

  it("should delegate object id selection changes to state service", () => {
    const objectIdOptions: WorkItemObjectIdOption[] = [
      { id: "obj-1" },
      { id: "obj-2" },
    ];

    component.onObjectIdsChange(objectIdOptions);

    expect(mockWorkItemState.setSelectedObjectIds).toHaveBeenCalledWith([
      "obj-1",
      "obj-2",
    ]);
  });

  describe("filter highlight", () => {
    const HIGHLIGHT_CLASS = "filter-active";

    function getFilterWrapper(testId: string): HTMLElement {
      return DomTestUtils.getElementByTestId(
        fixture,
        testId
      ).getNativeElement();
    }

    it("should not highlight any filter when no filters are active", () => {
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-sortBy").classList).not.toContain(
        HIGHLIGHT_CLASS
      );
      expect(
        getFilterWrapper("filter-wrapper-priority").classList
      ).not.toContain(HIGHLIGHT_CLASS);
      expect(
        getFilterWrapper("filter-wrapper-objectIds").classList
      ).not.toContain(HIGHLIGHT_CLASS);
      expect(
        getFilterWrapper("filter-wrapper-assignees").classList
      ).not.toContain(HIGHLIGHT_CLASS);
      expect(
        getFilterWrapper("filter-wrapper-categories").classList
      ).not.toContain(HIGHLIGHT_CLASS);
      expect(
        getFilterWrapper("filter-wrapper-dateRange").classList
      ).not.toContain(HIGHLIGHT_CLASS);
    });

    it("should highlight sortBy wrapper when sort is active", () => {
      (mockWorkItemState.filters.sortBy as WritableSignal<string | null>).set(
        "priority"
      );
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-sortBy").classList).toContain(
        HIGHLIGHT_CLASS
      );
    });

    it("should highlight priority wrapper when priority is selected", () => {
      (
        mockWorkItemState.filters
          .selectedPriority as WritableSignal<WorkItemPriority | null>
      ).set(WorkItemPriority.HIGH);
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-priority").classList).toContain(
        HIGHLIGHT_CLASS
      );
    });

    it("should highlight objectIds wrapper when object IDs are selected", () => {
      (
        mockWorkItemState.filters.selectedObjectIds as WritableSignal<string[]>
      ).set(["WI-001"]);
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-objectIds").classList).toContain(
        HIGHLIGHT_CLASS
      );
    });

    it("should highlight assignees wrapper when assignees are selected", () => {
      (
        mockWorkItemState.filters.selectedAssignees as WritableSignal<string[]>
      ).set(["john.doe"]);
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-assignees").classList).toContain(
        HIGHLIGHT_CLASS
      );
    });

    it("should highlight categories wrapper when categories are selected", () => {
      (
        mockWorkItemState.filters.selectedCategories as WritableSignal<string[]>
      ).set(["frontend"]);
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-categories").classList).toContain(
        HIGHLIGHT_CLASS
      );
    });

    it("should highlight dateRange wrapper when date range is selected", () => {
      (
        mockWorkItemState.filters.selectedDateRange as WritableSignal<unknown>
      ).set({
        startDate: new Date(),
        endDate: new Date(),
      });
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-dateRange").classList).toContain(
        HIGHLIGHT_CLASS
      );
    });

    it("should remove highlight when filter is cleared", () => {
      (
        mockWorkItemState.filters
          .selectedPriority as WritableSignal<WorkItemPriority | null>
      ).set(WorkItemPriority.HIGH);
      fixture.detectChanges();
      expect(getFilterWrapper("filter-wrapper-priority").classList).toContain(
        HIGHLIGHT_CLASS
      );

      (
        mockWorkItemState.filters
          .selectedPriority as WritableSignal<WorkItemPriority | null>
      ).set(null);
      fixture.detectChanges();
      expect(
        getFilterWrapper("filter-wrapper-priority").classList
      ).not.toContain(HIGHLIGHT_CLASS);
    });

    it("should highlight multiple filters independently", () => {
      (
        mockWorkItemState.filters
          .selectedPriority as WritableSignal<WorkItemPriority | null>
      ).set(WorkItemPriority.LOW);
      (
        mockWorkItemState.filters.selectedAssignees as WritableSignal<string[]>
      ).set(["jane.doe"]);
      fixture.detectChanges();

      expect(getFilterWrapper("filter-wrapper-priority").classList).toContain(
        HIGHLIGHT_CLASS
      );
      expect(getFilterWrapper("filter-wrapper-assignees").classList).toContain(
        HIGHLIGHT_CLASS
      );
      expect(getFilterWrapper("filter-wrapper-sortBy").classList).not.toContain(
        HIGHLIGHT_CLASS
      );
      expect(
        getFilterWrapper("filter-wrapper-objectIds").classList
      ).not.toContain(HIGHLIGHT_CLASS);
      expect(
        getFilterWrapper("filter-wrapper-categories").classList
      ).not.toContain(HIGHLIGHT_CLASS);
      expect(
        getFilterWrapper("filter-wrapper-dateRange").classList
      ).not.toContain(HIGHLIGHT_CLASS);
    });
  });
});
