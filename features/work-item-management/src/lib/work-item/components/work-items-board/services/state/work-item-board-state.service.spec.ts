import { TestBed } from "@angular/core/testing";
import { signal, computed } from "@angular/core";
import { of, throwError } from "rxjs";
import { WorkItemBoardStateService } from "./work-item-board-state.service";
import { KanbanViewService } from "../view-modes/kanban/kanban-view.service";
import {
  SwimlaneViewService,
  CategoryOption,
} from "../view-modes/swimlane/swimlane-view.service";
import { WorkItemService } from "../../../../services/work-item-api/work-item.service";
import { FormatLabelPipe } from "@mxflow/pipe";
import { AuthenticationService } from "@mxflow/core/auth";
import {
  WorkItemPriority,
  WorkItem,
  WorkItemStatus,
} from "../../../../model/work-item";
import { WorkItemSwimlaneOptionType } from "../../model/work-item-swimlane-option-type.enum";
import { WorkItemBoardViewMode } from "../../model/work-item-board-view-mode.enum";
import { WorkItemSwimlaneGroupBy } from "../../model/work-item-swimlane-group-by.enum";
import { WorkItemSwimlaneConfig } from "../../model/work-item-swimlane-config.model";
import { WorkItemsColumnState } from "../../model/work-items-column-state.model";
import { WorkItemBoardUrlSyncService } from "../url-sync/work-item-board-url-sync.service";
import { WorkItemBoardFilterPersistenceService } from "../filter-persistence/work-item-board-filter-persistence.service";
import {
  WorkItemChange,
  WorkItemChangeAction,
} from "../../model/work-item-change.model";

type KanbanServiceMock = {
  initializeColumns: jest.Mock;
  getColumnState: jest.Mock;
  loadData: jest.Mock;
  reset: jest.Mock;
  shouldLoadMore: jest.Mock;
  getHighestPage: jest.Mock;
  isLoading: jest.Mock;
  addWorkItem: jest.Mock;
  updateWorkItem: jest.Mock;
  removeWorkItem: jest.Mock;
  allVisibleWorkItems?: ReturnType<typeof computed<WorkItem[]>>;
};

type SwimlaneServiceMock = {
  swimlanes: () => WorkItemSwimlaneConfig[];
  swimlaneOptions: unknown[];
  initializeSwimlane: jest.Mock;
  getColumnStateForSwimlane: jest.Mock;
  getAggregatedColumnState: jest.Mock;
  loadSwimlaneData: jest.Mock;
  shouldLoadMore: jest.Mock;
  getHighestPage: jest.Mock;
  reset: jest.Mock;
  toggleCollapse: jest.Mock;
  setSwimlanesByPriority: jest.Mock;
  setSwimlanesByCategories: jest.Mock;
  setSwimlanesByDueDate: jest.Mock;
  isLoading: jest.Mock;
  addWorkItem: jest.Mock;
  updateWorkItem: jest.Mock;
  removeWorkItem: jest.Mock;
  allVisibleWorkItems?: ReturnType<typeof computed<WorkItem[]>>;
};

const createColumnState = (
  overrides: Partial<WorkItemsColumnState> = {}
): WorkItemsColumnState => ({
  items: [],
  currentPage: 0,
  isLastPage: false,
  totalItems: 0,
  ...overrides,
});

const createMatchingWorkItem = (overrides: Partial<WorkItem> = {}): WorkItem =>
  ({
    id: "wi-1",
    workItemStatus: WorkItemStatus.OPEN,
    assignee: "tester",
    ...overrides,
  } as WorkItem);

const waitForMicrotasks = () =>
  new Promise<void>((resolve) => queueMicrotask(() => resolve()));

describe("WorkItemBoardStateService", () => {
  let service: WorkItemBoardStateService;
  let kanbanServiceMock: KanbanServiceMock;
  let swimlaneServiceMock: SwimlaneServiceMock;
  let workItemServiceMock: { getWorkItemCategories: jest.Mock };
  let authServiceMock: { getUsername: jest.Mock };
  let formatLabelPipeMock: { transform: jest.Mock };
  let urlSyncServiceMock: {
    getFiltersFromUrl: jest.Mock;
    syncFiltersToUrl: jest.Mock;
  };
  let filterPersistenceServiceMock: {
    saveFilters: jest.Mock;
    loadFilters: jest.Mock;
    clearFilters: jest.Mock;
  };

  const highPriorityLane: WorkItemSwimlaneConfig = {
    id: "high",
    title: "High",
    groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
    value: WorkItemPriority.HIGH,
    isCollapsed: false,
  };
  const mediumPriorityLane: WorkItemSwimlaneConfig = {
    id: "medium",
    title: "Medium",
    groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
    value: WorkItemPriority.MEDIUM,
    isCollapsed: false,
  };

  beforeEach(() => {
    const swimlaneConfigsSignal = signal<WorkItemSwimlaneConfig[]>([]);

    kanbanServiceMock = {
      initializeColumns: jest.fn(),
      getColumnState: jest.fn(() => signal(createColumnState()).asReadonly()),
      loadData: jest.fn(() => of(undefined)),
      reset: jest.fn(),
      shouldLoadMore: jest.fn(() => false),
      getHighestPage: jest.fn(() => 0),
      isLoading: jest.fn(() => false),
      addWorkItem: jest.fn(),
      updateWorkItem: jest.fn(),
      removeWorkItem: jest.fn(),
      allVisibleWorkItems: computed(() => []),
    };

    swimlaneServiceMock = {
      swimlanes: () => swimlaneConfigsSignal(),
      swimlaneOptions: [],
      initializeSwimlane: jest.fn(),
      getColumnStateForSwimlane: jest.fn(() =>
        signal(createColumnState()).asReadonly()
      ),
      getAggregatedColumnState: jest.fn(() =>
        computed(() => createColumnState())
      ),
      loadSwimlaneData: jest.fn(() => of(undefined)),
      shouldLoadMore: jest.fn(() => false),
      getHighestPage: jest.fn(() => 0),
      reset: jest.fn(),
      toggleCollapse: jest.fn(),
      setSwimlanesByPriority: jest.fn(() =>
        swimlaneConfigsSignal.set([highPriorityLane, mediumPriorityLane])
      ),
      setSwimlanesByCategories: jest.fn((categories: CategoryOption[]) =>
        swimlaneConfigsSignal.set(
          categories.map((category) => ({
            id: category.value,
            title: category.label,
            groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
            value: category.value,
            isCollapsed: false,
          }))
        )
      ),
      setSwimlanesByDueDate: jest.fn(() => swimlaneConfigsSignal.set([])),
      isLoading: jest.fn(() => false),
      addWorkItem: jest.fn(),
      updateWorkItem: jest.fn(),
      removeWorkItem: jest.fn(),
      allVisibleWorkItems: computed(() => []),
    };

    workItemServiceMock = {
      getWorkItemCategories: jest.fn(() => of<string[]>([])),
    };

    authServiceMock = {
      getUsername: jest.fn(() => "tester"),
    };

    formatLabelPipeMock = {
      transform: jest.fn((value: string) => value.toUpperCase()),
    };

    urlSyncServiceMock = {
      getFiltersFromUrl: jest.fn(() => ({})),
      syncFiltersToUrl: jest.fn(() => Promise.resolve()),
    };

    filterPersistenceServiceMock = {
      saveFilters: jest.fn(),
      loadFilters: jest.fn(() => null),
      clearFilters: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkItemBoardStateService,
        { provide: KanbanViewService, useValue: kanbanServiceMock },
        { provide: SwimlaneViewService, useValue: swimlaneServiceMock },
        { provide: WorkItemService, useValue: workItemServiceMock },
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: FormatLabelPipe, useValue: formatLabelPipeMock },
        { provide: WorkItemBoardUrlSyncService, useValue: urlSyncServiceMock },
        {
          provide: WorkItemBoardFilterPersistenceService,
          useValue: filterPersistenceServiceMock,
        },
      ],
    });

    service = TestBed.inject(WorkItemBoardStateService);
  });

  it("should initialize board only once and preload categories when no URL filters exist", async () => {
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(
      of(["category-a"])
    );
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});

    await service.initializeBoard();

    expect(urlSyncServiceMock.getFiltersFromUrl).toHaveBeenCalled();
    expect(authServiceMock.getUsername).toHaveBeenCalled();
    expect(service.filters.selectedAssignees()).toEqual(["tester"]);
    expect(workItemServiceMock.getWorkItemCategories).toHaveBeenCalledWith(
      undefined
    );
    expect(formatLabelPipeMock.transform).toHaveBeenCalledWith("category-a");
    expect(service.availableCategories()).toEqual([
      { label: "CATEGORY-A", value: "category-a" },
    ]);
    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({
        assignees: ["tester"],
        resolvedDateSince: expect.any(String),
      }),
      0
    );

    jest.clearAllMocks();
    await service.initializeBoard();

    expect(kanbanServiceMock.loadData).not.toHaveBeenCalled();
  });

  it("should update available categories before restoring filters from URL during initialization", async () => {
    const callOrder: string[] = [];
    workItemServiceMock.getWorkItemCategories.mockImplementation(() => {
      callOrder.push("updateAvailableCategories");
      return of(["category-a"]);
    });
    urlSyncServiceMock.getFiltersFromUrl.mockImplementation(() => {
      callOrder.push("restoreFiltersFromUrl");
      return {};
    });

    await service.initializeBoard();

    expect(callOrder).toEqual([
      "updateAvailableCategories",
      "restoreFiltersFromUrl",
    ]);
  });

  it("should restore filters from localStorage when no URL filters exist", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});
    filterPersistenceServiceMock.loadFilters.mockReturnValueOnce({
      searchKey: "persisted search",
      selectedAssignees: ["persisted-user"],
    });

    await service.initializeBoard();

    expect(filterPersistenceServiceMock.loadFilters).toHaveBeenCalledWith(
      "tester"
    );
    expect(service.filters.searchKey()).toBe("persisted search");
    expect(service.filters.selectedAssignees()).toEqual(["persisted-user"]);
  });

  it("should not restore from localStorage when URL filters exist", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      searchKey: "url search",
    });

    await service.initializeBoard();

    expect(filterPersistenceServiceMock.loadFilters).not.toHaveBeenCalled();
    expect(service.filters.searchKey()).toBe("url search");
  });

  it("should default to current user when neither URL nor localStorage filters exist", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});
    filterPersistenceServiceMock.loadFilters.mockReturnValueOnce(null);

    await service.initializeBoard();

    expect(service.filters.selectedAssignees()).toEqual(["tester"]);
  });

  it("should not default to current user when localStorage entry exists but filters are empty", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});
    filterPersistenceServiceMock.loadFilters.mockReturnValueOnce({});

    await service.initializeBoard();

    expect(service.filters.selectedAssignees()).toEqual([]);
  });

  it("should save filters to localStorage when filters change", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSearchKey("new search");
    await waitForMicrotasks();

    expect(filterPersistenceServiceMock.saveFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        searchKey: "new search",
      }),
      "tester"
    );
  });

  it("should not restore persisted project filter when board is project-specific", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});
    filterPersistenceServiceMock.loadFilters.mockReturnValueOnce({
      searchKey: "persisted search",
      selectedProjects: ["old-project"],
      selectedAssignees: ["persisted-user"],
    });

    service.setIsProjectSpecific(true);
    await service.initializeBoard();

    expect(service.filters.searchKey()).toBe("persisted search");
    expect(service.filters.selectedAssignees()).toEqual(["persisted-user"]);
    expect(service.filters.selectedProjects()).toEqual([]);
  });

  it("should restore persisted project filter when board is not project-specific", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});
    filterPersistenceServiceMock.loadFilters.mockReturnValueOnce({
      selectedProjects: ["proj-1", "proj-2"],
    });

    await service.initializeBoard();

    expect(service.filters.selectedProjects()).toEqual(["proj-1", "proj-2"]);
  });

  it("should preserve previously persisted project filter when board is project-specific", async () => {
    service.setIsProjectSpecific(true);
    await service.initializeBoard();
    jest.clearAllMocks();

    filterPersistenceServiceMock.loadFilters.mockReturnValue({
      selectedProjects: ["previously-persisted-proj"],
    });

    service.setSearchKey("new search");
    await waitForMicrotasks();

    expect(filterPersistenceServiceMock.saveFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedProjects: ["previously-persisted-proj"],
      }),
      "tester"
    );
  });

  it("should switch to swimlane mode when sorting by priority", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    await waitForMicrotasks();

    const swimlanes = swimlaneServiceMock.swimlanes();
    expect(service.viewMode()).toBe(WorkItemBoardViewMode.SWIMLANE);
    expect(swimlaneServiceMock.setSwimlanesByPriority).toHaveBeenCalled();
    expect(swimlaneServiceMock.reset).toHaveBeenCalled();
    expect(swimlanes.length).toBeGreaterThan(0);
    expect(swimlaneServiceMock.initializeSwimlane).toHaveBeenCalledTimes(
      swimlanes.length
    );
    expect(swimlaneServiceMock.loadSwimlaneData).toHaveBeenCalledTimes(
      swimlanes.length
    );
    expect(swimlaneServiceMock.loadSwimlaneData).toHaveBeenCalledWith(
      expect.any(String),
      service.columnConfigs(),
      expect.objectContaining({
        resolvedDateSince: expect.any(String),
      }),
      0
    );
  });

  it("should keep category filters when sorting by category", async () => {
    await service.initializeBoard();
    service.setSelectedCategories(["cat-1"]);

    service.setSortBy(WorkItemSwimlaneOptionType.CATEGORY);

    expect(service.filters.selectedCategories()).toEqual(["cat-1"]);
    expect(swimlaneServiceMock.setSwimlanesByCategories).toHaveBeenCalledWith(
      service.availableCategories(),
      ["cat-1"]
    );
  });

  it("should keep priority filter when sorting by priority", async () => {
    await service.initializeBoard();
    service.setSelectedPriority(WorkItemPriority.MEDIUM);

    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);

    expect(service.filters.selectedPriority()).toBe(WorkItemPriority.MEDIUM);
    expect(swimlaneServiceMock.setSwimlanesByPriority).toHaveBeenCalledWith(
      WorkItemPriority.MEDIUM
    );
  });

  it("should keep date range filter when sorting by due date", async () => {
    await service.initializeBoard();
    const dateRange = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    };
    service.setSelectedDateRange(dateRange);

    service.setSortBy(WorkItemSwimlaneOptionType.DUE_DATE);

    expect(service.filters.selectedDateRange()).toEqual(dateRange);
    expect(swimlaneServiceMock.setSwimlanesByDueDate).toHaveBeenCalledWith({
      from: dateRange.startDate.toISOString(),
      to: dateRange.endDate.toISOString(),
    });
  });

  it("should restore kanban mode when sort is cleared", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    jest.clearAllMocks();

    service.setSortBy(null);
    await waitForMicrotasks();

    expect(service.viewMode()).toBe(WorkItemBoardViewMode.KANBAN);
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.any(Object),
      0
    );
    expect(swimlaneServiceMock.reset).not.toHaveBeenCalled();
  });

  it("should reconfigure swimlanes when priority filter changes in priority mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    jest.clearAllMocks();

    service.setSelectedPriority(WorkItemPriority.HIGH);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByPriority).toHaveBeenCalledWith(
      WorkItemPriority.HIGH
    );
    expect(swimlaneServiceMock.reset).toHaveBeenCalled();
  });

  it("should reconfigure swimlanes when category filter changes in category mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.CATEGORY);
    jest.clearAllMocks();

    service.setSelectedCategories(["bug", "feature"]);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByCategories).toHaveBeenCalledWith(
      service.availableCategories(),
      ["bug", "feature"]
    );
    expect(swimlaneServiceMock.reset).toHaveBeenCalled();
  });

  it("should not reconfigure swimlanes when priority filter changes in kanban mode", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedPriority(WorkItemPriority.HIGH);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByPriority).not.toHaveBeenCalled();
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
  });

  it("should not reconfigure swimlanes when category filter changes in kanban mode", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedCategories(["bug"]);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByCategories).not.toHaveBeenCalled();
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
  });

  it("should aggregate totals across swimlanes", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    swimlaneServiceMock.getAggregatedColumnState.mockReturnValue(
      computed(() => ({
        totalItems: 5,
        currentPage: 0,
        items: [{ id: "1" }, { id: "2" }] as WorkItem[],
      }))
    );

    const aggregated = service.getColumnStateSignalForContext("open");

    expect(aggregated()).toEqual(
      expect.objectContaining({
        totalItems: 5,
        items: [{ id: "1" }, { id: "2" }],
      })
    );
    expect(swimlaneServiceMock.getAggregatedColumnState).toHaveBeenCalledWith(
      "open"
    );
  });

  it("should return lane specific state when context is provided", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    swimlaneServiceMock.getColumnStateForSwimlane.mockReturnValue(
      signal(createColumnState({ totalItems: 2 })).asReadonly()
    );

    const laneState = service.getColumnStateSignalForContext("open", "high");

    expect(laneState()).toEqual(expect.objectContaining({ totalItems: 2 }));
  });

  it("should delegate scroll loading to kanban loader", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();
    kanbanServiceMock.shouldLoadMore.mockReturnValueOnce(true);
    kanbanServiceMock.getHighestPage.mockReturnValueOnce(1);

    service.handleBoardScroll(120, 300);

    expect(kanbanServiceMock.shouldLoadMore).toHaveBeenCalledWith(120, 300);
    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.any(Object),
      2
    );
  });

  it("should delegate scroll loading to swimlane loader", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    jest.clearAllMocks();
    swimlaneServiceMock.shouldLoadMore.mockReturnValueOnce(true);
    swimlaneServiceMock.getHighestPage.mockReturnValueOnce(0);

    service.handleBoardScroll(200, 300, "high");

    expect(swimlaneServiceMock.shouldLoadMore).toHaveBeenCalledWith(200, 300);
    expect(swimlaneServiceMock.loadSwimlaneData).toHaveBeenCalledWith(
      "high",
      service.columnConfigs(),
      expect.any(Object),
      1
    );
  });

  it("should update filters and categories when projects change", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(of([]));

    await service.setSelectedProjects(["p1", "p2"]);

    expect(workItemServiceMock.getWorkItemCategories).toHaveBeenCalledWith([
      "p1",
      "p2",
    ]);
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({ projectIds: ["p1", "p2"] }),
      0
    );
  });

  it("should include resolved date filter when columns contain completed statuses", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();
    const now = Date.UTC(2024, 0, 10);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);

    service.fullBoardRefresh();
    await waitForMicrotasks();

    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({
        resolvedDateSince: new Date(
          now - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
      0
    );
    dateSpy.mockRestore();
  });

  it("should always include resolvedDateSince filter even when all other filters are empty", async () => {
    await service.initializeBoard();
    service.setShowMyTasksOnly(false);
    jest.clearAllMocks();
    const now = Date.UTC(2024, 5, 15);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);

    service.fullBoardRefresh();
    await waitForMicrotasks();

    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({
        search: undefined,
        projectIds: undefined,
        workItemPriority: undefined,
        workItemCategories: undefined,
        dueDateFrom: undefined,
        dueDateTo: undefined,
        assignees: [],
        objectIds: undefined,
        resolvedDateSince: new Date(
          now - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
      0
    );
    dateSpy.mockRestore();
  });

  it("should not refresh view when filters change before initialization", async () => {
    await service.setSelectedProjects(["p1", "p2"]);
    service.setSelectedPriority(WorkItemPriority.HIGH);
    service.setSearchKey("test");

    expect(kanbanServiceMock.reset).not.toHaveBeenCalled();
    expect(kanbanServiceMock.loadData).not.toHaveBeenCalled();
    expect(swimlaneServiceMock.reset).not.toHaveBeenCalled();
    expect(swimlaneServiceMock.loadSwimlaneData).not.toHaveBeenCalled();
  });

  it("should refresh view after initialization when filters change", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSearchKey("test search");
    await waitForMicrotasks();

    expect(kanbanServiceMock.reset).toHaveBeenCalled();
    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({ search: "test search" }),
      0
    );
  });

  it("should set project specific flag when setIsProjectSpecific is called", () => {
    service.setIsProjectSpecific(true);

    expect(service.isProjectSpecific()).toBe(true);
  });

  it("should toggle swimlane collapse when toggleSwimlaneCollapse is called", () => {
    service.toggleSwimlaneCollapse("high");

    expect(swimlaneServiceMock.toggleCollapse).toHaveBeenCalledWith("high");
  });

  it("should return kanban column state when in kanban mode", async () => {
    await service.initializeBoard();
    const expectedState = signal(
      createColumnState({ totalItems: 7 })
    ).asReadonly();
    kanbanServiceMock.getColumnState.mockReturnValueOnce(expectedState);

    const state = service.getColumnStateSignalForContext("assigned");

    expect(state).toBe(expectedState);
    expect(kanbanServiceMock.getColumnState).toHaveBeenCalledWith("assigned");
  });

  it("should set show my tasks only to false and clear assignees when toggled off", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setShowMyTasksOnly(false);
    await waitForMicrotasks();

    expect(service.filters.showMyTasksOnly()).toBe(false);
    expect(service.filters.selectedAssignees()).toEqual([]);
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
  });

  it("should set show my tasks only to true and set assignee to current user when toggled on", async () => {
    await service.initializeBoard();
    service.setShowMyTasksOnly(false);
    jest.clearAllMocks();

    service.setShowMyTasksOnly(true);
    await waitForMicrotasks();

    expect(service.filters.showMyTasksOnly()).toBe(true);
    expect(service.filters.selectedAssignees()).toEqual(["tester"]);
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
  });

  it("should set selected assignees when setSelectedAssignees is called", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedAssignees(["user1", "user2"]);
    await waitForMicrotasks();

    expect(service.filters.selectedAssignees()).toEqual(["user1", "user2"]);
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
  });

  it("should update filters when object ids change", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedObjectIds(["o1", "o2"]);
    await waitForMicrotasks();

    expect(service.filters.selectedObjectIds()).toEqual(["o1", "o2"]);
    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({ objectIds: ["o1", "o2"] }),
      0
    );
  });

  it("should not load more data when shouldLoadMore returns false in kanban mode", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();
    kanbanServiceMock.shouldLoadMore.mockReturnValueOnce(false);

    service.handleBoardScroll(50, 300);

    expect(kanbanServiceMock.shouldLoadMore).toHaveBeenCalledWith(50, 300);
    expect(kanbanServiceMock.loadData).not.toHaveBeenCalled();
  });

  it("should not load more data when shouldLoadMore returns false in swimlane mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    jest.clearAllMocks();
    swimlaneServiceMock.shouldLoadMore.mockReturnValueOnce(false);

    service.handleBoardScroll(50, 300, "high");

    expect(swimlaneServiceMock.shouldLoadMore).toHaveBeenCalledWith(50, 300);
    expect(swimlaneServiceMock.loadSwimlaneData).not.toHaveBeenCalled();
  });

  it("should not load more data when swimlaneId is missing in swimlane mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    jest.clearAllMocks();

    service.handleBoardScroll(50, 300);

    expect(swimlaneServiceMock.shouldLoadMore).not.toHaveBeenCalled();
    expect(swimlaneServiceMock.loadSwimlaneData).not.toHaveBeenCalled();
  });

  it("should reconfigure swimlanes when date range filter changes in due date mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.DUE_DATE);
    jest.clearAllMocks();
    const dateRange = {
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-02-28"),
    };

    service.setSelectedDateRange(dateRange);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByDueDate).toHaveBeenCalledWith({
      from: dateRange.startDate.toISOString(),
      to: dateRange.endDate.toISOString(),
    });
    expect(swimlaneServiceMock.reset).toHaveBeenCalled();
  });

  it("should set null date range filter when cleared in due date mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.DUE_DATE);
    jest.clearAllMocks();

    service.setSelectedDateRange(null);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByDueDate).toHaveBeenCalledWith(
      undefined
    );
    expect(swimlaneServiceMock.reset).toHaveBeenCalled();
  });

  it("should not reconfigure swimlanes when date range filter changes in kanban mode", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();
    const dateRange = {
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-02-28"),
    };

    service.setSelectedDateRange(dateRange);
    await waitForMicrotasks();

    expect(swimlaneServiceMock.setSwimlanesByDueDate).not.toHaveBeenCalled();
    expect(kanbanServiceMock.reset).toHaveBeenCalled();
  });

  it("should return swimlane loading state when in swimlane mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    swimlaneServiceMock.isLoading.mockReturnValueOnce(true);

    const isLoading = service.columnsInLoadingState();

    expect(isLoading).toBe(true);
    expect(swimlaneServiceMock.isLoading).toHaveBeenCalled();
  });

  it("should return kanban loading state when in kanban mode", async () => {
    await service.initializeBoard();
    kanbanServiceMock.isLoading.mockReturnValueOnce(true);

    const isLoading = service.columnsInLoadingState();

    expect(isLoading).toBe(true);
    expect(kanbanServiceMock.isLoading).toHaveBeenCalled();
  });

  it("should include all filter parameters when creating filters", async () => {
    await service.initializeBoard();
    service.setSearchKey("search term");
    await service.setSelectedProjects(["proj1", "proj2"]);
    service.setSelectedPriority(WorkItemPriority.HIGH);
    service.setSelectedCategories(["cat1", "cat2"]);
    const dateRange = {
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-03-31"),
    };
    service.setSelectedDateRange(dateRange);
    service.setSelectedAssignees(["assignee1", "assignee2"]);
    jest.clearAllMocks();

    service.fullBoardRefresh();
    await waitForMicrotasks();

    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({
        search: "search term",
        projectIds: ["proj1", "proj2"],
        workItemPriority: WorkItemPriority.HIGH,
        workItemCategories: ["cat1", "cat2"],
        dueDateFrom: dateRange.startDate.toISOString(),
        dueDateTo: dateRange.endDate.toISOString(),
        assignees: ["assignee1", "assignee2"],
        resolvedDateSince: expect.any(String),
      }),
      0
    );
  });

  it("should clear category filter when setting empty categories in category mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.CATEGORY);
    service.setSelectedCategories(["cat1"]);
    jest.clearAllMocks();

    service.setSelectedCategories([]);

    expect(swimlaneServiceMock.setSwimlanesByCategories).toHaveBeenCalledWith(
      service.availableCategories(),
      undefined
    );
  });

  it("should clear priority filter when setting null priority in priority mode", async () => {
    await service.initializeBoard();
    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    service.setSelectedPriority(WorkItemPriority.HIGH);
    jest.clearAllMocks();

    service.setSelectedPriority(null);

    expect(swimlaneServiceMock.setSwimlanesByPriority).toHaveBeenCalledWith(
      undefined
    );
  });

  it("should include assignees in filters when show my tasks only is enabled", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.fullBoardRefresh();
    await waitForMicrotasks();

    expect(kanbanServiceMock.loadData).toHaveBeenCalledWith(
      service.columnConfigs(),
      expect.objectContaining({
        assignees: ["tester"],
      }),
      0
    );
  });

  it("should set default assignee during initialization when URL has no filters and override showMyTasksOnly setting", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({});
    service.setShowMyTasksOnly(false);

    await service.initializeBoard();

    expect(service.filters.showMyTasksOnly()).toBe(true);
    expect(service.filters.selectedAssignees()).toEqual(["tester"]);
  });

  it("should restore search key from URL when URL has search key during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      searchKey: "bug fix",
    });

    await service.initializeBoard();

    expect(service.filters.searchKey()).toBe("bug fix");
  });

  it("should restore selected projects from URL when URL has projects during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      selectedProjects: ["project-1", "project-2"],
    });
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(of([]));

    await service.initializeBoard();

    expect(service.filters.selectedProjects()).toEqual([
      "project-1",
      "project-2",
    ]);
  });

  it("should restore selected priority from URL when URL has priority during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      selectedPriority: WorkItemPriority.HIGH,
    });

    await service.initializeBoard();

    expect(service.filters.selectedPriority()).toBe(WorkItemPriority.HIGH);
  });

  it("should restore selected categories from URL when URL has categories during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      selectedCategories: ["bug", "feature"],
    });

    await service.initializeBoard();

    expect(service.filters.selectedCategories()).toEqual(["bug", "feature"]);
  });

  it("should restore selected date range from URL when URL has date range during initialization", async () => {
    const dateRange = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    };
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      selectedDateRange: dateRange,
    });

    await service.initializeBoard();

    expect(service.filters.selectedDateRange()).toEqual(dateRange);
  });

  it("should restore selected assignees from URL when URL has assignees during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      selectedAssignees: ["user1", "user2"],
    });

    await service.initializeBoard();

    expect(service.filters.selectedAssignees()).toEqual(["user1", "user2"]);
  });

  it("should restore sort by from URL when URL has sort by during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      sortBy: WorkItemSwimlaneOptionType.PRIORITY,
    });

    await service.initializeBoard();
    await waitForMicrotasks();

    expect(service.filters.sortBy()).toBe(WorkItemSwimlaneOptionType.PRIORITY);
    expect(service.viewMode()).toBe(WorkItemBoardViewMode.SWIMLANE);
  });

  it("should restore all filters from URL when URL has multiple filters during initialization", async () => {
    const dateRange = {
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-03-31"),
    };
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      searchKey: "urgent",
      selectedProjects: ["proj1"],
      selectedPriority: WorkItemPriority.MEDIUM,
      selectedCategories: ["bug"],
      selectedDateRange: dateRange,
      selectedAssignees: ["dev1"],
      sortBy: WorkItemSwimlaneOptionType.CATEGORY,
    });
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(of([]));

    await service.initializeBoard();
    await waitForMicrotasks();

    expect(service.filters.searchKey()).toBe("urgent");
    expect(service.filters.selectedProjects()).toEqual(["proj1"]);
    expect(service.filters.selectedPriority()).toBe(WorkItemPriority.MEDIUM);
    expect(service.filters.selectedCategories()).toEqual(["bug"]);
    expect(service.filters.selectedDateRange()).toEqual(dateRange);
    expect(service.filters.selectedAssignees()).toEqual(["dev1"]);
    expect(service.filters.sortBy()).toBe(WorkItemSwimlaneOptionType.CATEGORY);
  });

  it("should not set default assignee when URL has filters during initialization", async () => {
    urlSyncServiceMock.getFiltersFromUrl.mockReturnValueOnce({
      searchKey: "test",
    });

    await service.initializeBoard();

    expect(service.filters.selectedAssignees()).toEqual([]);
  });

  it("should sync filters to URL when initialized and filter changes", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSearchKey("new search");
    await waitForMicrotasks();

    expect(urlSyncServiceMock.syncFiltersToUrl).toHaveBeenCalledWith(
      {
        searchKey: "new search",
        selectedProjects: [],
        selectedPriority: null,
        selectedObjectIds: [],
        selectedAssignees: ["tester"],
        selectedCategories: [],
        selectedDateRange: null,
        sortBy: null,
      },
      true,
      false
    );
  });

  it("should sync filters with project specific flag when project specific is true", async () => {
    service.setIsProjectSpecific(true);
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSearchKey("test");
    await waitForMicrotasks();

    expect(urlSyncServiceMock.syncFiltersToUrl).toHaveBeenCalledWith(
      expect.any(Object),
      true,
      true
    );
  });

  it("should not sync filters to URL when not initialized", async () => {
    service.setSearchKey("test");
    await waitForMicrotasks();

    expect(urlSyncServiceMock.syncFiltersToUrl).not.toHaveBeenCalled();
  });

  it("should sync all current filters to URL when filter changes after initialization", async () => {
    await service.initializeBoard();
    service.setSearchKey("search");
    await service.setSelectedProjects(["p1"]);
    service.setSelectedPriority(WorkItemPriority.LOW);
    service.setSelectedCategories(["cat1"]);
    const dateRange = {
      startDate: new Date("2024-04-01"),
      endDate: new Date("2024-04-30"),
    };
    service.setSelectedDateRange(dateRange);
    service.setSelectedAssignees(["user1", "user2"]);
    service.setSortBy(WorkItemSwimlaneOptionType.DUE_DATE);
    jest.clearAllMocks();

    service.setSearchKey("updated search");
    await waitForMicrotasks();

    expect(urlSyncServiceMock.syncFiltersToUrl).toHaveBeenCalledWith(
      {
        searchKey: "updated search",
        selectedProjects: ["p1"],
        selectedPriority: WorkItemPriority.LOW,
        selectedAssignees: ["user1", "user2"],
        selectedCategories: ["cat1"],
        selectedDateRange: dateRange,
        selectedObjectIds: [],
        sortBy: WorkItemSwimlaneOptionType.DUE_DATE,
      },
      true,
      false
    );
  });

  it("should set show my tasks only to true when single assignee matches current user", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedAssignees(["tester"]);
    await waitForMicrotasks();

    expect(service.filters.showMyTasksOnly()).toBe(true);
    expect(service.filters.selectedAssignees()).toEqual(["tester"]);
  });

  it("should not set show my tasks only to true when single assignee does not match current user", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedAssignees(["other-user"]);
    await waitForMicrotasks();

    expect(service.filters.showMyTasksOnly()).toBe(false);
    expect(service.filters.selectedAssignees()).toEqual(["other-user"]);
  });

  it("should not set show my tasks only to true when multiple assignees are selected", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedAssignees(["tester", "other-user"]);
    await waitForMicrotasks();

    expect(service.filters.showMyTasksOnly()).toBe(false);
    expect(service.filters.selectedAssignees()).toEqual([
      "tester",
      "other-user",
    ]);
  });

  it("should set show my tasks only to false when empty assignees array is set", async () => {
    await service.initializeBoard();
    jest.clearAllMocks();

    service.setSelectedAssignees([]);
    await waitForMicrotasks();

    expect(service.filters.showMyTasksOnly()).toBe(false);
    expect(service.filters.selectedAssignees()).toEqual([]);
  });

  it("should handle category API error gracefully during initialization", async () => {
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(
      throwError(() => new Error("API Error"))
    );

    await service.initializeBoard();

    expect(service.availableCategories()).toEqual([]);
    expect(kanbanServiceMock.loadData).toHaveBeenCalled();
  });

  it("should format category labels using format pipe when categories are loaded", async () => {
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(
      of(["bug-fix", "new-feature"])
    );
    formatLabelPipeMock.transform
      .mockReturnValueOnce("BUG-FIX")
      .mockReturnValueOnce("NEW-FEATURE");

    await service.initializeBoard();

    expect(formatLabelPipeMock.transform).toHaveBeenCalledWith("bug-fix");
    expect(formatLabelPipeMock.transform).toHaveBeenCalledWith("new-feature");
    expect(service.availableCategories()).toEqual([
      { label: "BUG-FIX", value: "bug-fix" },
      { label: "NEW-FEATURE", value: "new-feature" },
    ]);
  });

  it("should update categories when projects change and maintain previous filter", async () => {
    await service.initializeBoard();
    service.setSelectedCategories(["old-cat"]);
    jest.clearAllMocks();
    workItemServiceMock.getWorkItemCategories.mockReturnValueOnce(
      of(["new-cat"])
    );
    formatLabelPipeMock.transform.mockReturnValueOnce("NEW-CAT");

    await service.setSelectedProjects(["new-project"]);
    await waitForMicrotasks();

    expect(workItemServiceMock.getWorkItemCategories).toHaveBeenCalledWith([
      "new-project",
    ]);
    expect(service.filters.selectedCategories()).toEqual(["old-cat"]);
    expect(service.availableCategories()).toEqual([
      { label: "NEW-CAT", value: "new-cat" },
    ]);
  });

  it("should keep category filter when switching to category swimlane mode", async () => {
    await service.initializeBoard();
    service.setSelectedCategories(["existing-cat"]);
    jest.clearAllMocks();

    service.setSortBy(WorkItemSwimlaneOptionType.CATEGORY);
    await waitForMicrotasks();

    expect(service.filters.selectedCategories()).toEqual(["existing-cat"]);
    expect(swimlaneServiceMock.setSwimlanesByCategories).toHaveBeenCalledWith(
      service.availableCategories(),
      ["existing-cat"]
    );
  });

  it("should keep priority filter when switching to priority swimlane mode", async () => {
    await service.initializeBoard();
    service.setSelectedPriority(WorkItemPriority.HIGH);
    jest.clearAllMocks();

    service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
    await waitForMicrotasks();

    expect(service.filters.selectedPriority()).toBe(WorkItemPriority.HIGH);
    expect(swimlaneServiceMock.setSwimlanesByPriority).toHaveBeenCalledWith(
      WorkItemPriority.HIGH
    );
  });

  it("should keep date range filter when switching to due date swimlane mode", async () => {
    await service.initializeBoard();
    const dateRange = {
      startDate: new Date("2024-05-01"),
      endDate: new Date("2024-05-31"),
    };
    service.setSelectedDateRange(dateRange);
    jest.clearAllMocks();

    service.setSortBy(WorkItemSwimlaneOptionType.DUE_DATE);
    await waitForMicrotasks();

    expect(service.filters.selectedDateRange()).toEqual(dateRange);
    expect(swimlaneServiceMock.setSwimlanesByDueDate).toHaveBeenCalledWith({
      from: dateRange.startDate.toISOString(),
      to: dateRange.endDate.toISOString(),
    });
  });

  describe("applyWorkItemChanges", () => {
    it("should apply multiple CREATE actions in kanban mode", async () => {
      await service.initializeBoard();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const workItem3 = createMatchingWorkItem({
        id: "wi-3",
        workItemStatus: WorkItemStatus.UNDERWAY,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem: workItem1 },
        { action: WorkItemChangeAction.CREATE, workItem: workItem2 },
        { action: WorkItemChangeAction.CREATE, workItem: workItem3 },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledTimes(3);
      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledWith(workItem1);
      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledWith(workItem2);
      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledWith(workItem3);
    });

    it("should apply multiple UPDATE actions in kanban mode", async () => {
      await service.initializeBoard();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.UPDATE, workItem: workItem1 },
        { action: WorkItemChangeAction.UPDATE, workItem: workItem2 },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.updateWorkItem).toHaveBeenCalledTimes(2);
      expect(kanbanServiceMock.updateWorkItem).toHaveBeenCalledWith(workItem1);
      expect(kanbanServiceMock.updateWorkItem).toHaveBeenCalledWith(workItem2);
    });

    it("should apply multiple DELETE actions in kanban mode", async () => {
      await service.initializeBoard();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.DELETE,
          workItemId: "wi-1",
        },
        {
          action: WorkItemChangeAction.DELETE,
          workItemId: "wi-2",
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledTimes(2);
      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-1");
      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-2");
    });

    it("should apply multiple MIXED actions in kanban mode", async () => {
      await service.initializeBoard();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem: workItem1 },
        { action: WorkItemChangeAction.UPDATE, workItem: workItem2 },
        { action: WorkItemChangeAction.DELETE, workItemId: "wi-3" },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledWith(workItem1);
      expect(kanbanServiceMock.updateWorkItem).toHaveBeenCalledWith(workItem2);
      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-3");
    });

    it("should apply multiple CREATE actions in swimlane mode", async () => {
      await service.initializeBoard();
      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const workItem3 = createMatchingWorkItem({
        id: "wi-3",
        workItemStatus: WorkItemStatus.UNDERWAY,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem: workItem1 },
        { action: WorkItemChangeAction.CREATE, workItem: workItem2 },
        { action: WorkItemChangeAction.CREATE, workItem: workItem3 },
      ];

      service.applyWorkItemChanges(changes);

      expect(swimlaneServiceMock.addWorkItem).toHaveBeenCalledTimes(3);
      expect(swimlaneServiceMock.addWorkItem).toHaveBeenCalledWith(workItem1);
      expect(swimlaneServiceMock.addWorkItem).toHaveBeenCalledWith(workItem2);
      expect(swimlaneServiceMock.addWorkItem).toHaveBeenCalledWith(workItem3);
    });

    it("should apply multiple UPDATE actions in swimlane mode", async () => {
      await service.initializeBoard();
      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.UPDATE, workItem: workItem1 },
        { action: WorkItemChangeAction.UPDATE, workItem: workItem2 },
      ];

      service.applyWorkItemChanges(changes);

      expect(swimlaneServiceMock.updateWorkItem).toHaveBeenCalledTimes(2);
      expect(swimlaneServiceMock.updateWorkItem).toHaveBeenCalledWith(
        workItem1
      );
      expect(swimlaneServiceMock.updateWorkItem).toHaveBeenCalledWith(
        workItem2
      );
    });

    it("should apply multiple DELETE actions in swimlane mode", async () => {
      await service.initializeBoard();
      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.DELETE,
          workItemId: "wi-1",
        },
        {
          action: WorkItemChangeAction.DELETE,
          workItemId: "wi-2",
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(swimlaneServiceMock.removeWorkItem).toHaveBeenCalledTimes(2);
      expect(swimlaneServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-1");
      expect(swimlaneServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-2");
    });

    it("should apply multiple MIXED actions in swimlane mode", async () => {
      await service.initializeBoard();
      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem: workItem1 },
        { action: WorkItemChangeAction.UPDATE, workItem: workItem2 },
        { action: WorkItemChangeAction.DELETE, workItemId: "wi-3" },
      ];

      service.applyWorkItemChanges(changes);

      expect(swimlaneServiceMock.addWorkItem).toHaveBeenCalledWith(workItem1);
      expect(swimlaneServiceMock.updateWorkItem).toHaveBeenCalledWith(
        workItem2
      );
      expect(swimlaneServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-3");
    });

    it("should not throw error when empty changes array is provided", async () => {
      await service.initializeBoard();
      const changes: WorkItemChange[] = [];

      expect(() => service.applyWorkItemChanges(changes)).not.toThrow();

      expect(kanbanServiceMock.addWorkItem).not.toHaveBeenCalled();
      expect(kanbanServiceMock.updateWorkItem).not.toHaveBeenCalled();
      expect(kanbanServiceMock.removeWorkItem).not.toHaveBeenCalled();
    });

    it("should delegate to correct service when view mode changes between calls", async () => {
      await service.initializeBoard();
      const workItem1 = createMatchingWorkItem({ id: "wi-1" });
      const changes1: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem: workItem1 },
      ];

      service.applyWorkItemChanges(changes1);

      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledWith(workItem1);

      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();
      jest.clearAllMocks();
      const workItem2 = createMatchingWorkItem({
        id: "wi-2",
        workItemStatus: WorkItemStatus.ASSIGNED,
      });
      const changes2: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem: workItem2 },
      ];

      service.applyWorkItemChanges(changes2);

      expect(swimlaneServiceMock.addWorkItem).toHaveBeenCalledWith(workItem2);
      expect(kanbanServiceMock.addWorkItem).not.toHaveBeenCalled();
    });

    it("should not add work item when CREATE does not match filters", async () => {
      await service.initializeBoard();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.CREATE,
          workItem: createMatchingWorkItem({
            id: "wi-1",
            assignee: "other-user",
          }),
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.addWorkItem).not.toHaveBeenCalled();
    });

    it("should remove work item when UPDATE does not match filters", async () => {
      await service.initializeBoard();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.UPDATE,
          workItem: createMatchingWorkItem({
            id: "wi-1",
            assignee: "other-user",
          }),
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.updateWorkItem).not.toHaveBeenCalled();
      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-1");
    });

    it("should remove work item when UPDATE does not match category filter", async () => {
      await service.initializeBoard();
      service.setSelectedCategories(["BUG"]);
      await waitForMicrotasks();
      jest.clearAllMocks();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.UPDATE,
          workItem: createMatchingWorkItem({
            id: "wi-1",
            workItemCategory: "FEATURE",
          }),
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.updateWorkItem).not.toHaveBeenCalled();
      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-1");
    });

    it("should remove work item when UPDATE does not match priority filter", async () => {
      await service.initializeBoard();
      service.setSelectedPriority(WorkItemPriority.HIGH);
      await waitForMicrotasks();
      jest.clearAllMocks();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.UPDATE,
          workItem: createMatchingWorkItem({
            id: "wi-1",
            workItemPriority: WorkItemPriority.LOW,
          }),
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.updateWorkItem).not.toHaveBeenCalled();
      expect(kanbanServiceMock.removeWorkItem).toHaveBeenCalledWith("wi-1");
    });

    it("should add work item when CREATE matches priority filter", async () => {
      await service.initializeBoard();
      service.setSelectedPriority(WorkItemPriority.HIGH);
      await waitForMicrotasks();
      jest.clearAllMocks();
      const workItem = createMatchingWorkItem({
        id: "wi-1",
        workItemPriority: WorkItemPriority.HIGH,
      });
      const changes: WorkItemChange[] = [
        { action: WorkItemChangeAction.CREATE, workItem },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.addWorkItem).toHaveBeenCalledWith(workItem);
    });

    it("should not add work item when CREATE does not match priority filter", async () => {
      await service.initializeBoard();
      service.setSelectedPriority(WorkItemPriority.HIGH);
      await waitForMicrotasks();
      jest.clearAllMocks();
      const changes: WorkItemChange[] = [
        {
          action: WorkItemChangeAction.CREATE,
          workItem: createMatchingWorkItem({
            id: "wi-1",
            workItemPriority: WorkItemPriority.LOW,
          }),
        },
      ];

      service.applyWorkItemChanges(changes);

      expect(kanbanServiceMock.addWorkItem).not.toHaveBeenCalled();
    });
  });

  describe("visibleWorkItems computed signal", () => {
    it("should delegate to kanban service allVisibleWorkItems in kanban mode", async () => {
      const mockItems = [
        { id: "w1", workItemStatus: WorkItemStatus.OPEN } as WorkItem,
        { id: "w2", workItemStatus: WorkItemStatus.ASSIGNED } as WorkItem,
      ];
      kanbanServiceMock.allVisibleWorkItems = computed(() => mockItems);
      await service.initializeBoard();

      const items = service.visibleWorkItems();

      expect(items).toEqual(mockItems);
      expect(items.length).toBe(2);
    });

    it("should delegate to swimlane service allVisibleWorkItems in swimlane mode", async () => {
      const mockItems = [
        { id: "w1", workItemStatus: WorkItemStatus.OPEN } as WorkItem,
        { id: "w2", workItemStatus: WorkItemStatus.DONE } as WorkItem,
      ];
      swimlaneServiceMock.allVisibleWorkItems = computed(() => mockItems);
      await service.initializeBoard();
      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();

      const items = service.visibleWorkItems();

      expect(items).toEqual(mockItems);
      expect(items.length).toBe(2);
    });

    it("should return empty array when no view service is active", () => {
      const items = service.visibleWorkItems();

      expect(items).toEqual([]);
    });

    it("should update reactively when view mode changes", async () => {
      const kanbanItems = [{ id: "k1" } as WorkItem];
      const swimlaneItems = [{ id: "s1" }, { id: "s2" }] as WorkItem[];
      kanbanServiceMock.allVisibleWorkItems = computed(() => kanbanItems);
      swimlaneServiceMock.allVisibleWorkItems = computed(() => swimlaneItems);
      await service.initializeBoard();
      expect(service.visibleWorkItems().length).toBe(1);

      service.setSortBy(WorkItemSwimlaneOptionType.PRIORITY);
      await waitForMicrotasks();

      expect(service.visibleWorkItems().length).toBe(2);
      expect(service.visibleWorkItems()[0].id).toBe("s1");
    });
  });
});
