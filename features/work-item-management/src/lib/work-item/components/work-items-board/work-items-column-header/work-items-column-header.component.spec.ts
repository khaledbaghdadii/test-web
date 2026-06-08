import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";

import { WorkItemsColumnHeaderComponent } from "./work-items-column-header.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemStatus } from "../../../model/work-item";

const MOCK_COLUMN_ID = "open";
const MOCK_COLUMN_CONFIG = {
  id: MOCK_COLUMN_ID,
  title: "Open Items",
  status: WorkItemStatus.OPEN,
};

const MOCK_COLUMN_STATE = {
  items: [],
  loading: false,
  currentPage: 0,
  isLastPage: false,
  totalItems: 15,
};

describe("WorkItemsColumnHeaderComponent", () => {
  let component: WorkItemsColumnHeaderComponent;
  let fixture: ComponentFixture<WorkItemsColumnHeaderComponent>;
  let mockStateService: {
    columnConfigs: jest.Mock;
    getColumnStateSignalForContext: jest.Mock;
  };
  const columnConfigsSignal = signal([MOCK_COLUMN_CONFIG]);
  const columnStateSignal = signal(MOCK_COLUMN_STATE);

  beforeEach(async () => {
    columnConfigsSignal.set([MOCK_COLUMN_CONFIG]);
    columnStateSignal.set(MOCK_COLUMN_STATE);
    mockStateService = {
      columnConfigs: jest.fn(() => columnConfigsSignal()),
      getColumnStateSignalForContext: jest.fn(() => columnStateSignal),
    };
    await TestBed.configureTestingModule({
      imports: [WorkItemsColumnHeaderComponent],
      providers: [
        { provide: WorkItemBoardStateService, useValue: mockStateService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WorkItemsColumnHeaderComponent);
    component = fixture.componentInstance;
    component.columnId = MOCK_COLUMN_ID;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create component successfully", () => {
    expect(component).toBeTruthy();
    expect(component).toBeInstanceOf(WorkItemsColumnHeaderComponent);
  });

  it("should require columnId input", () => {
    expect(component.columnId).toBe(MOCK_COLUMN_ID);
  });

  it("should use OnPush change detection strategy", () => {
    const componentDef = (
      component.constructor as unknown as {
        ɵcmp: { onPush: boolean | number };
      }
    ).ɵcmp;

    expect(componentDef.onPush).toBeTruthy();
  });

  it("should find column configuration from computed signal", () => {
    expect(component.columnConfig()).toEqual(MOCK_COLUMN_CONFIG);
  });

  it("should return null when column configuration is missing", () => {
    columnConfigsSignal.set([]);
    fixture.detectChanges();

    expect(component.columnConfig()).toBeNull();
  });

  it("should get column state from service", () => {
    expect(component.columnState()).toEqual(MOCK_COLUMN_STATE);
    expect(
      mockStateService.getColumnStateSignalForContext
    ).toHaveBeenCalledWith(MOCK_COLUMN_ID);
  });

  it("should return total items from column state", () => {
    expect(component.totalItems()).toBe(15);
  });

  it("should display column title in template", () => {
    const compiled = fixture.nativeElement;
    const titleElement = compiled.querySelector("span");

    expect(titleElement.textContent.trim()).toBe(MOCK_COLUMN_CONFIG.title);
  });

  it("should display total items count in badge", () => {
    const compiled = fixture.nativeElement;
    const badgeElement = compiled.querySelector("p-badge");

    expect(badgeElement).toBeTruthy();
    expect(
      badgeElement.getAttribute("value") || badgeElement.textContent.trim()
    ).toContain("15");
  });

  it("should display zero count when no items", () => {
    columnStateSignal.set({
      ...MOCK_COLUMN_STATE,
      totalItems: 0,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const badgeElement = compiled.querySelector("p-badge");

    expect(
      badgeElement.getAttribute("value") || badgeElement.textContent.trim()
    ).toContain("0");
  });

  it("should reflect state changes in total items", () => {
    columnStateSignal.set({
      ...MOCK_COLUMN_STATE,
      totalItems: 25,
    });

    expect(component.totalItems()).toBe(25);
  });

  it("should handle configuration changes", () => {
    const newConfig = {
      id: MOCK_COLUMN_ID,
      title: "Updated Column Title",
      status: WorkItemStatus.UNDERWAY,
    };

    columnConfigsSignal.set([newConfig]);

    expect(component.columnConfig()).toEqual(newConfig);
  });
});
