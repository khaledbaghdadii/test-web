import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";

import { WorkItemsColumnComponent } from "./work-items-column.component";
import {
  WorkItemStatus,
  WorkItem,
  WorkItemType,
  WorkItemPriority,
} from "../../../model/work-item";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";

const MOCK_COLUMN_ID = "open";
const MOCK_COLUMN_CONFIG = {
  id: MOCK_COLUMN_ID,
  title: "Open Items",
  status: WorkItemStatus.OPEN,
};

const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: "item-1",
    projectId: "project-1",
    name: "Critical Bug Fix",
    description: "Fix authentication issue",
    requireAssignee: true,
    assignee: "john.doe",
    workItemCategory: "Bug Fix",
    domain: "Authentication",
    workItemType: WorkItemType.UNITARY,
    projectName: "projectName",
    workItemStatus: WorkItemStatus.OPEN,
    workItemPriority: WorkItemPriority.HIGH,
    metadata: { severity: "critical" },
    businessProcesses: [{ id: "auth-process" }],
    createdOn: new Date(),
    dueDate: new Date(),
    dueDateEditable: true,
  },
  {
    id: "item-2",
    projectId: "project-1",
    name: "Feature Enhancement",
    description: "Add new dashboard widget",
    requireAssignee: false,
    workItemCategory: "Feature",
    domain: "Dashboard",
    projectName: "projectName",
    workItemType: WorkItemType.AGGREGATE,
    workItemStatus: WorkItemStatus.OPEN,
    workItemPriority: WorkItemPriority.MEDIUM,
    metadata: { complexity: "medium" },
    businessProcesses: [{ id: "dashboard-process" }],
    createdOn: new Date(),
    dueDate: new Date(),
    dueDateEditable: true,
  },
];

const INITIAL_EMPTY_STATE = {
  items: [] as WorkItem[],
  loading: false,
  currentPage: 0,
  isLastPage: false,
  totalItems: 0,
};

const MOCK_COLUMN_STATE = {
  items: MOCK_WORK_ITEMS,
  loading: false,
  currentPage: 1,
  isLastPage: false,
  totalItems: 25,
};

@Component({
  selector: "mxevolve-work-item-card",
  template:
    '<div class="mock-work-item-card" [attr.data-item-id]="workItem.id">{{ workItem.name }}</div>',
  standalone: true,
})
class MockWorkItemCardComponent {
  @Input() workItem!: WorkItem;
}

describe("WorkItemsColumnComponent", () => {
  let component: WorkItemsColumnComponent;
  let fixture: ComponentFixture<WorkItemsColumnComponent>;
  let mockStateService: {
    columnConfigs: jest.Mock;
    getColumnStateObservable: jest.Mock;
    getColumnStateSignalForContext: jest.Mock;
  };
  let columnStateSubject: BehaviorSubject<typeof MOCK_COLUMN_STATE>;

  beforeEach(async () => {
    columnStateSubject = new BehaviorSubject(INITIAL_EMPTY_STATE);

    mockStateService = {
      columnConfigs: jest.fn().mockReturnValue([MOCK_COLUMN_CONFIG]),
      getColumnStateObservable: jest
        .fn()
        .mockReturnValue(columnStateSubject.asObservable()),
      getColumnStateSignalForContext: jest
        .fn()
        .mockReturnValue(() => columnStateSubject.value),
    };

    await TestBed.configureTestingModule({
      imports: [WorkItemsColumnComponent, MockWorkItemCardComponent],
      providers: [
        { provide: WorkItemBoardStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkItemsColumnComponent);
    component = fixture.componentInstance;
    component.columnId = MOCK_COLUMN_ID;
  });

  afterEach(() => {
    jest.clearAllMocks();
    columnStateSubject.complete();
  });

  describe("Component Initialization", () => {
    it("should create successfully", () => {
      expect(component).toBeTruthy();
      expect(component).toBeInstanceOf(WorkItemsColumnComponent);
    });

    it("should initialize with default state", () => {
      expect(component.items()).toEqual([]);
      expect(component.totalItems()).toBe(0);
    });
  });

  describe("Computed Signals", () => {
    it("should find column configuration", () => {
      expect(component.columnConfig()).toEqual(MOCK_COLUMN_CONFIG);
    });

    it("should return null for missing column configuration", () => {
      mockStateService.columnConfigs.mockReturnValue([]);

      expect(component.columnConfig()).toBeNull();
    });

    it("should reflect state updates in computed signals", () => {
      columnStateSubject.next(MOCK_COLUMN_STATE);

      expect(component.items()).toEqual(MOCK_WORK_ITEMS);
      expect(component.totalItems()).toBe(25);
    });
  });

  describe("State Management", () => {
    it("should update state when observable emits", () => {
      const newState = {
        ...MOCK_COLUMN_STATE,
        items: [MOCK_WORK_ITEMS[0]],
        totalItems: 1,
        loading: true,
      };

      columnStateSubject.next(newState);

      expect(component.items()).toEqual([MOCK_WORK_ITEMS[0]]);
      expect(component.totalItems()).toBe(1);
    });

    it("should handle empty state", () => {
      columnStateSubject.next({
        items: [],
        loading: false,
        currentPage: 0,
        isLastPage: true,
        totalItems: 0,
      });

      expect(component.items()).toEqual([]);
      expect(component.totalItems()).toBe(0);
    });
  });

  describe("Utility Functions", () => {
    it("should provide trackBy function for performance", () => {
      const mockItem = { id: "test-id" } as WorkItem;
      const result = component.trackByWorkItemId(0, mockItem);

      expect(result).toBe("test-id");
    });
  });

  describe("Component Architecture", () => {
    it("should use OnPush change detection strategy", () => {
      const componentDef = (
        component.constructor as unknown as {
          ɵcmp: { onPush: boolean | number };
        }
      ).ɵcmp;

      expect(componentDef.onPush).toBeTruthy();
    });
  });
});
