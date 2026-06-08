import { TestBed } from "@angular/core/testing";
import { WritableSignal } from "@angular/core";
import { firstValueFrom, of, Subject, throwError } from "rxjs";
import { SwimlaneViewService, CategoryOption } from "./swimlane-view.service";
import { WorkItemService } from "../../../../../services/work-item-api/work-item.service";
import { WorkItemBoardFilter } from "../../../model/work-item-board-filter.model";
import {
  WorkItemStatus,
  WorkItemPriority,
  WorkItem,
} from "../../../../../model/work-item";
import { WorkItemsPerStatusApiResponse } from "../../../../../services/work-item-api/response/work-items-per-status-api-response.model";
import { WorkItemBoardColumnConfig } from "../../../model/work-item-board-column-config.model";
import { WorkItemSwimlaneGroupBy } from "../../../model/work-item-swimlane-group-by.enum";
import { WorkItemsColumnState } from "../../../model/work-items-column-state.model";
import { WorkItemDueDateRange } from "../../../model/work-item-due-date-range.enum";

describe("SwimlaneViewService", () => {
  let service: SwimlaneViewService;
  let workItemServiceMock: { getWorkItemsPerStatus: jest.Mock };
  const TODO = "TODO" as unknown as WorkItemStatus;
  const IN_PROGRESS = "IN_PROGRESS" as unknown as WorkItemStatus;
  const DONE = "DONE" as unknown as WorkItemStatus;
  const columns: ReadonlyArray<WorkItemBoardColumnConfig> = [
    { id: "todo", title: "To Do", status: TODO },
    { id: "doing", title: "In Progress", status: IN_PROGRESS },
    { id: "done", title: "Done", status: DONE },
  ];
  const emptyState = () => ({
    items: [],
    currentPage: 0,
    isLastPage: false,
    totalItems: 0,
  });
  const makeResponse = (
    entries: Array<[WorkItemStatus, unknown[], boolean, number]>
  ): WorkItemsPerStatusApiResponse => {
    const r: Record<string, unknown> = {};
    for (const [status, content, last, total] of entries) {
      r[status] = { content, last, totalElements: total };
    }
    return r as WorkItemsPerStatusApiResponse;
  };
  const getState = (swimlaneId: string, columnId: string) =>
    service.getColumnStateForSwimlane(swimlaneId, columnId)();
  const filters = {} as WorkItemBoardFilter;

  beforeEach(() => {
    workItemServiceMock = {
      getWorkItemsPerStatus: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        SwimlaneViewService,
        { provide: WorkItemService, useValue: workItemServiceMock },
      ],
    });
    service = TestBed.inject(SwimlaneViewService);
  });

  describe("initializeSwimlane", () => {
    it("should create column states when swimlane is initialized", () => {
      const swimlaneId = "high";

      service.initializeSwimlane(swimlaneId, columns);

      expect(getState(swimlaneId, "todo")).toEqual(emptyState());
      expect(getState(swimlaneId, "doing")).toEqual(emptyState());
      expect(getState(swimlaneId, "done")).toEqual(emptyState());
    });

    it("should skip initialization when swimlane already exists", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 3]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      expect(getState(swimlaneId, "todo").items).toEqual([{ id: 1 }]);

      service.initializeSwimlane(swimlaneId, columns);

      expect(getState(swimlaneId, "todo").items).toEqual([{ id: 1 }]);
    });
  });

  describe("getColumnStateForSwimlane", () => {
    it("should create default state when swimlane does not exist", () => {
      const swimlaneId = "unknown";
      const columnId = "todo";

      const state = getState(swimlaneId, columnId);

      expect(state).toEqual(emptyState());
    });

    it("should create default column state when column does not exist", () => {
      const swimlaneId = "high";
      service.initializeSwimlane(swimlaneId, columns);

      const state = getState(swimlaneId, "unknown-column");

      expect(state).toEqual(emptyState());
    });
  });

  describe("loadSwimlaneData", () => {
    it("should load first page when column state does not exist", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledWith(
        {
          workItemPriority: WorkItemPriority.HIGH,
          workItemStatuses: [TODO, IN_PROGRESS, DONE],
        },
        0,
        10
      );
    });

    it("should not load next page when column state does not exist", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 1)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).not.toHaveBeenCalled();
    });

    it("should load data for all columns when loading first page", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [{ id: 1 }], false, 3],
        [IN_PROGRESS, [{ id: 2 }], false, 2],
        [DONE, [{ id: 3 }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledWith(
        {
          workItemPriority: WorkItemPriority.HIGH,
          workItemStatuses: [TODO, IN_PROGRESS, DONE],
        },
        0,
        10
      );
      expect(getState(swimlaneId, "todo")).toEqual({
        items: [{ id: 1 }],
        currentPage: 0,
        isLastPage: false,
        totalItems: 3,
      });
      expect(getState(swimlaneId, "doing")).toEqual({
        items: [{ id: 2 }],
        currentPage: 0,
        isLastPage: false,
        totalItems: 2,
      });
      expect(getState(swimlaneId, "done")).toEqual({
        items: [{ id: 3 }],
        currentPage: 0,
        isLastPage: true,
        totalItems: 1,
      });
    });

    it("should append items when loading subsequent pages", async () => {
      const swimlaneId = "medium";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], false, 3],
        [IN_PROGRESS, [{ id: "p0" }], false, 2],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      const page1 = makeResponse([
        [TODO, [{ id: "t1" }], false, 3],
        [IN_PROGRESS, [{ id: "p1" }], true, 2],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 1)
      );

      expect(getState(swimlaneId, "todo")).toEqual({
        items: [{ id: "t0" }, { id: "t1" }],
        currentPage: 1,
        isLastPage: false,
        totalItems: 3,
      });
      expect(getState(swimlaneId, "doing")).toEqual({
        items: [{ id: "p0" }, { id: "p1" }],
        currentPage: 1,
        isLastPage: true,
        totalItems: 2,
      });
    });

    it("should skip API call when all columns reach last page", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], true, 1],
        [IN_PROGRESS, [{ id: "p0" }], true, 1],
        [DONE, [{ id: "d0" }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      workItemServiceMock.getWorkItemsPerStatus.mockClear();

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 1)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).not.toHaveBeenCalled();
    });

    it("should return early when swimlane does not exist", async () => {
      const swimlaneId = "unknown";

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).not.toHaveBeenCalled();
    });

    it("should reset loading state when API call fails", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        throwError(() => new Error("boom"))
      );

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(service.isLoading()).toBe(false);
    });

    it("should apply priority filter when swimlane groups by priority", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledWith(
        {
          workItemPriority: WorkItemPriority.HIGH,
          workItemStatuses: [TODO, IN_PROGRESS, DONE],
        },
        0,
        10
      );
    });

    it("should apply category filter when swimlane groups by category", async () => {
      const categories: CategoryOption[] = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
      ];
      service.setSwimlanesByCategories(categories);
      const swimlaneId = "bug";
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledWith(
        {
          workItemCategories: ["bug"],
          workItemStatuses: [TODO, IN_PROGRESS, DONE],
        },
        0,
        10
      );
    });

    it("should keep swimlane expanded when data is loaded with items", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        false
      );

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        false
      );
    });

    it("should collapse swimlane when response has no items", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [], true, 0],
        [IN_PROGRESS, [], true, 0],
        [DONE, [], true, 0],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        false
      );

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        true
      );
    });

    it("should request only incomplete columns when loading next page", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], false, 5],
        [IN_PROGRESS, [{ id: "p0" }], false, 5],
        [DONE, [{ id: "d0" }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      const page1 = makeResponse([
        [TODO, [{ id: "t1" }], false, 5],
        [IN_PROGRESS, [{ id: "p1" }], false, 5],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 1)
      );

      expect(
        workItemServiceMock.getWorkItemsPerStatus
      ).toHaveBeenLastCalledWith(
        {
          workItemPriority: WorkItemPriority.HIGH,
          workItemStatuses: [TODO, IN_PROGRESS],
        },
        1,
        10
      );
    });

    it("should replace items when loading first page again", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0First = makeResponse([[TODO, [{ id: 1 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        of(page0First)
      );
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      expect(getState(swimlaneId, "todo").items).toEqual([{ id: 1 }]);
      const page0Second = makeResponse([[TODO, [{ id: 2 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        of(page0Second)
      );

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(getState(swimlaneId, "todo").items).toEqual([{ id: 2 }]);
      expect(getState(swimlaneId, "todo").items.length).toBe(1);
    });
  });

  describe("concurrent load guard", () => {
    it("should block concurrent loads when same page is requested", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const subject = new Subject<WorkItemsPerStatusApiResponse>();
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValue(
        subject.asObservable()
      );
      const sub1 = service
        .loadSwimlaneData(swimlaneId, columns, filters, 0)
        .subscribe();
      workItemServiceMock.getWorkItemsPerStatus.mockClear();

      const sub2 = service
        .loadSwimlaneData(swimlaneId, columns, filters, 0)
        .subscribe();

      expect(workItemServiceMock.getWorkItemsPerStatus).not.toHaveBeenCalled();
      subject.next(makeResponse([[TODO, [], false, 0]]));
      subject.complete();
      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it("should allow next load when previous load completes", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      const page1 = makeResponse([[TODO, [{ id: 2 }], true, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 1)
      );

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledTimes(
        2
      );
    });
  });

  describe("setSwimlanesByPriority", () => {
    it("should create swimlane configs for each priority level", () => {
      service.setSwimlanesByPriority();

      const swimlanes = service.swimlanes();
      expect(swimlanes).toEqual([
        {
          id: "high",
          title: "High Priority",
          groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
          value: WorkItemPriority.HIGH,
          isCollapsed: false,
        },
        {
          id: "medium",
          title: "Medium Priority",
          groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
          value: WorkItemPriority.MEDIUM,
          isCollapsed: false,
        },
        {
          id: "low",
          title: "Low Priority",
          groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
          value: WorkItemPriority.LOW,
          isCollapsed: false,
        },
      ]);
    });

    it("should filter to only high priority swimlane when priorityFilter is HIGH", () => {
      service.setSwimlanesByPriority(WorkItemPriority.HIGH);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(1);
      expect(swimlanes[0]).toEqual({
        id: "high",
        title: "High Priority",
        groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
        value: WorkItemPriority.HIGH,
        isCollapsed: false,
      });
    });

    it("should filter to only medium priority swimlane when priorityFilter is MEDIUM", () => {
      service.setSwimlanesByPriority(WorkItemPriority.MEDIUM);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(1);
      expect(swimlanes[0].value).toBe(WorkItemPriority.MEDIUM);
    });

    it("should filter to only low priority swimlane when priorityFilter is LOW", () => {
      service.setSwimlanesByPriority(WorkItemPriority.LOW);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(1);
      expect(swimlanes[0].value).toBe(WorkItemPriority.LOW);
    });
  });

  describe("setSwimlanesByCategories", () => {
    it("should create swimlane configs for each category", () => {
      const categories: CategoryOption[] = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
        { label: "Task", value: "task" },
      ];

      service.setSwimlanesByCategories(categories);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toEqual([
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

    it("should filter to only specified categories when categoryFilter is provided", () => {
      const categories: CategoryOption[] = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
        { label: "Task", value: "task" },
      ];

      service.setSwimlanesByCategories(categories, ["bug", "task"]);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(2);
      expect(swimlanes.map((s) => s.value)).toEqual(["bug", "task"]);
    });

    it("should show all categories when categoryFilter is empty array", () => {
      const categories: CategoryOption[] = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
      ];

      service.setSwimlanesByCategories(categories, []);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(2);
    });

    it("should filter to single category when categoryFilter has one item", () => {
      const categories: CategoryOption[] = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
        { label: "Task", value: "task" },
      ];

      service.setSwimlanesByCategories(categories, ["feature"]);

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(1);
      expect(swimlanes[0].value).toBe("feature");
    });
  });

  describe("toggleCollapse", () => {
    it("should toggle collapse state when swimlane is toggled", () => {
      service.setSwimlanesByPriority();
      const swimlaneId = "high";
      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        false
      );

      service.toggleCollapse(swimlaneId);

      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        true
      );
    });

    it("should collapse expanded swimlane when toggled again", () => {
      service.setSwimlanesByPriority();
      const swimlaneId = "high";
      service.toggleCollapse(swimlaneId);
      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        true
      );

      service.toggleCollapse(swimlaneId);

      expect(service.getWorkItemSwimlaneConfig(swimlaneId)?.isCollapsed).toBe(
        false
      );
    });
  });

  describe("reset", () => {
    it("should restore initial state when reset is called", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [{ id: 1 }], false, 3],
        [IN_PROGRESS, [{ id: 2 }], false, 2],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      expect(getState(swimlaneId, "todo").items.length).toBe(1);

      service.reset();

      expect(getState(swimlaneId, "todo")).toEqual(emptyState());
      expect(getState(swimlaneId, "doing")).toEqual(emptyState());
      expect(service.isLoading()).toBe(false);
    });
  });

  describe("shouldLoadMore", () => {
    it("should respect threshold when determining load more", () => {
      const height = 1000;

      const belowThreshold = service.shouldLoadMore(799, height);
      const atThreshold = service.shouldLoadMore(800, height);
      const aboveThreshold = service.shouldLoadMore(1000, height);

      expect(belowThreshold).toBe(false);
      expect(atThreshold).toBe(true);
      expect(aboveThreshold).toBe(true);
    });
  });

  describe("getHighestPage", () => {
    it("should report highest page when columns receive new data", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], false, 3],
        [IN_PROGRESS, [{ id: "p0" }], false, 3],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );
      expect(service.getHighestPage(swimlaneId)).toBe(0);
      const page1 = makeResponse([
        [TODO, [{ id: "t1" }], false, 3],
        [IN_PROGRESS, [{ id: "p1" }], false, 3],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 1)
      );

      expect(service.getHighestPage(swimlaneId)).toBe(1);
    });

    it("should return zero when swimlane does not exist", () => {
      const swimlaneId = "unknown";

      const highestPage = service.getHighestPage(swimlaneId);

      expect(highestPage).toBe(0);
    });
  });

  describe("getWorkItemSwimlaneConfig", () => {
    it("should return swimlane config when swimlane exists", () => {
      service.setSwimlanesByPriority();
      const swimlaneId = "high";

      const swimlane = service.getWorkItemSwimlaneConfig(swimlaneId);

      expect(swimlane).toEqual({
        id: "high",
        title: "High Priority",
        groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
        value: WorkItemPriority.HIGH,
        isCollapsed: false,
      });
    });

    it("should return undefined when swimlane does not exist", () => {
      service.setSwimlanesByPriority();
      const swimlaneId = "unknown";

      const swimlane = service.getWorkItemSwimlaneConfig(swimlaneId);

      expect(swimlane).toBeUndefined();
    });
  });

  describe("isLoading", () => {
    it("should be true when any swimlane is loading a page", async () => {
      const swimlaneId = "high";
      service.setSwimlanesByPriority();
      service.initializeSwimlane(swimlaneId, columns);
      const subject = new Subject<WorkItemsPerStatusApiResponse>();
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValue(
        subject.asObservable()
      );

      const loadPromise = firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      expect(service.isLoading()).toBe(true);
      subject.next(makeResponse([[TODO, [], false, 0]]));
      subject.complete();
      await loadPromise;
      expect(service.isLoading()).toBe(false);
    });
  });

  describe("getAggregatedColumnState", () => {
    it("should aggregate totals and items across all swimlanes", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      service.initializeSwimlane("medium", columns);
      const highState = (
        service as unknown as {
          swimlaneStates: Map<
            string,
            Map<string, WritableSignal<WorkItemsColumnState>>
          >;
        }
      ).swimlaneStates
        .get("high")
        ?.get("todo");
      const mediumState = (
        service as unknown as {
          swimlaneStates: Map<
            string,
            Map<string, WritableSignal<WorkItemsColumnState>>
          >;
        }
      ).swimlaneStates
        .get("medium")
        ?.get("todo");
      highState?.set({
        items: [{ id: "h1" }] as WorkItem[],
        currentPage: 1,
        isLastPage: false,
        totalItems: 3,
      });
      mediumState?.set({
        items: [{ id: "m1" }] as WorkItem[],
        currentPage: 0,
        isLastPage: false,
        totalItems: 2,
      });

      const aggregated = service.getAggregatedColumnState("todo");

      expect(aggregated()).toEqual({
        totalItems: 5,
        currentPage: 1,
        items: [{ id: "h1" }, { id: "m1" }],
        isLastPage: false,
      });
    });

    it("should return empty state when no swimlanes exist", () => {
      const aggregated = service.getAggregatedColumnState("todo");

      expect(aggregated()).toEqual({
        totalItems: 0,
        currentPage: 0,
        items: [],
        isLastPage: true,
      });
    });
  });

  describe("setSwimlanesByDueDate", () => {
    it("should create swimlane configs for each due date range", () => {
      service.setSwimlanesByDueDate();

      const swimlanes = service.swimlanes();
      expect(swimlanes).toEqual([
        {
          id: "today",
          title: "Due Today",
          groupBy: WorkItemSwimlaneGroupBy.DUE_DATE,
          value: WorkItemDueDateRange.TODAY,
          isCollapsed: false,
        },
        {
          id: "this-week",
          title: "Due in a Week",
          groupBy: WorkItemSwimlaneGroupBy.DUE_DATE,
          value: WorkItemDueDateRange.THIS_WEEK,
          isCollapsed: false,
        },
        {
          id: "this-month",
          title: "Due in a Month",
          groupBy: WorkItemSwimlaneGroupBy.DUE_DATE,
          value: WorkItemDueDateRange.THIS_MONTH,
          isCollapsed: false,
        },
        {
          id: "later",
          title: "Due Later",
          groupBy: WorkItemSwimlaneGroupBy.DUE_DATE,
          value: WorkItemDueDateRange.LATER,
          isCollapsed: false,
        },
      ]);
    });

    it("should filter overlapping swimlanes when user range has only from date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      service.setSwimlanesByDueDate({
        from: futureDate.toISOString(),
      });

      const swimlanes = service.swimlanes();
      expect(swimlanes.length).toBeGreaterThan(0);
    });

    it("should filter overlapping swimlanes when user range has only to date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      service.setSwimlanesByDueDate({
        to: futureDate.toISOString(),
      });

      const swimlanes = service.swimlanes();
      expect(swimlanes.length).toBeGreaterThanOrEqual(1);
      expect(
        swimlanes.some((s) => s.id === "today" || s.id === "this-week")
      ).toBe(true);
    });

    it("should include unbounded swimlanes when user end date overlaps", () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      service.setSwimlanesByDueDate({
        from: today.toISOString(),
        to: nextWeek.toISOString(),
      });

      const swimlanes = service.swimlanes();
      expect(swimlanes.length).toBeGreaterThan(0);
    });

    it("should filter to overlapping swimlanes when dateRangeFilter is provided", () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      service.setSwimlanesByDueDate({
        from: today.toISOString(),
        to: tomorrow.toISOString(),
      });

      const swimlanes = service.swimlanes();
      expect(swimlanes.length).toBeGreaterThan(0);
      expect(swimlanes.some((s) => s.id === "today")).toBe(true);
    });

    it("should return all swimlanes when dateRangeFilter has no from or to", () => {
      service.setSwimlanesByDueDate({});

      const swimlanes = service.swimlanes();
      expect(swimlanes).toHaveLength(4);
    });

    it("should filter to later swimlanes when dateRangeFilter is far future", () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 60);

      service.setSwimlanesByDueDate({
        from: farFuture.toISOString(),
      });

      const swimlanes = service.swimlanes();
      expect(swimlanes.some((s) => s.id === "later")).toBe(true);
    });

    it("should handle date range that spans multiple swimlanes", () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(nextMonth.getDate() + 30);

      service.setSwimlanesByDueDate({
        from: today.toISOString(),
        to: nextMonth.toISOString(),
      });

      const swimlanes = service.swimlanes();
      expect(swimlanes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("loadSwimlaneData with due date", () => {
    it("should apply due date filter when swimlane groups by due date", async () => {
      service.setSwimlanesByDueDate();
      const swimlaneId = "today";
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filters, 0)
      );

      const call = workItemServiceMock.getWorkItemsPerStatus.mock.calls[0];
      expect(call[0]).toHaveProperty("dueDateFrom");
      expect(call[0]).toHaveProperty("dueDateTo");
      expect(call[0]).toHaveProperty("workItemStatuses");
      expect(call[0].dueDateFrom).toBeDefined();
      expect(call[0].dueDateTo).toBeDefined();
      expect(call[0].workItemStatuses).toEqual([TODO, IN_PROGRESS, DONE]);
    });

    it("should use swimlane date when base filter has no start date", async () => {
      service.setSwimlanesByDueDate();
      const swimlaneId = "today";
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      const filtersWithoutDate = { ...filters };
      delete filtersWithoutDate.dueDateFrom;
      delete filtersWithoutDate.dueDateTo;

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filtersWithoutDate, 0)
      );

      const call = workItemServiceMock.getWorkItemsPerStatus.mock.calls[0];
      expect(call[0].dueDateFrom).toBeDefined();
      expect(call[0].dueDateTo).toBeDefined();
    });

    it("should use base date when swimlane has no date range", async () => {
      service.setSwimlanesByDueDate();
      const swimlaneId = "today";
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      const baseStartDate = new Date();
      baseStartDate.setDate(baseStartDate.getDate() - 10);
      const baseEndDate = new Date();
      baseEndDate.setDate(baseEndDate.getDate() + 10);
      const filtersWithDate = {
        ...filters,
        dueDateFrom: baseStartDate.toISOString(),
        dueDateTo: baseEndDate.toISOString(),
      };

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filtersWithDate, 0)
      );

      const call = workItemServiceMock.getWorkItemsPerStatus.mock.calls[0];
      expect(call[0].dueDateFrom).toBeDefined();
      expect(call[0].dueDateTo).toBeDefined();
    });

    it("should use most restrictive start date when both dates exist", async () => {
      service.setSwimlanesByDueDate();
      const swimlaneId = "this-week";
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      const earlierDate = new Date();
      earlierDate.setDate(earlierDate.getDate() - 5);
      const filtersWithDate = {
        ...filters,
        dueDateFrom: earlierDate.toISOString(),
      };

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filtersWithDate, 0)
      );

      const call = workItemServiceMock.getWorkItemsPerStatus.mock.calls[0];
      const resultStartDate = new Date(call[0].dueDateFrom);
      const filterStartDate = new Date(earlierDate);
      expect(resultStartDate.getTime()).toBeGreaterThanOrEqual(
        filterStartDate.getTime()
      );
    });

    it("should use most restrictive end date when both dates exist", async () => {
      service.setSwimlanesByDueDate();
      const swimlaneId = "this-week";
      service.initializeSwimlane(swimlaneId, columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      const laterDate = new Date();
      laterDate.setDate(laterDate.getDate() + 30);
      const filtersWithDate = {
        ...filters,
        dueDateTo: laterDate.toISOString(),
      };

      await firstValueFrom(
        service.loadSwimlaneData(swimlaneId, columns, filtersWithDate, 0)
      );

      const call = workItemServiceMock.getWorkItemsPerStatus.mock.calls[0];
      const resultEndDate = new Date(call[0].dueDateTo);
      const filterEndDate = new Date(laterDate);
      expect(resultEndDate.getTime()).toBeLessThanOrEqual(
        filterEndDate.getTime()
      );
    });
  });

  describe("addWorkItem", () => {
    it("should add work item to matching swimlane by priority", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      const state = getState("high", "todo");
      expect(state.items).toContainEqual(workItem);
      expect(state.totalItems).toBe(1);
    });

    it("should add work item to matching swimlane by category", () => {
      service.setSwimlanesByCategories([{ label: "Bug", value: "bug" }]);
      service.initializeSwimlane("bug", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemCategory: "bug",
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      const state = getState("bug", "todo");
      expect(state.items).toContainEqual(workItem);
      expect(state.totalItems).toBe(1);
    });

    it("should add work item to matching swimlane by due date", () => {
      service.setSwimlanesByDueDate();
      service.initializeSwimlane("today", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: TODO,
        dueDate: new Date().toISOString(),
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      const state = getState("today", "todo");
      expect(state.items).toContainEqual(workItem);
      expect(state.totalItems).toBe(1);
    });

    it("should add work item to correct column based on status", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: IN_PROGRESS,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      expect(getState("high", "doing").items).toContainEqual(workItem);
      expect(getState("high", "todo").items).toEqual([]);
    });

    it("should not add work item when status has no matching column", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: "INVALID" as unknown as WorkItemStatus,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      expect(getState("high", "todo").items).toEqual([]);
    });

    it("should prepend work item to existing items", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const existingItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      const newItem = {
        id: "wi-2",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(existingItem);

      service.addWorkItem(newItem);

      const state = getState("high", "todo");
      expect(state.items[0]).toEqual(newItem);
      expect(state.items[1]).toEqual(existingItem);
    });
  });

  describe("updateWorkItem", () => {
    it("should update work item properties when it stays in same location", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const originalItem = {
        id: "wi-1",
        name: "Original",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(originalItem);
      const updatedItem = {
        ...originalItem,
        name: "Updated",
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      const state = getState("high", "todo");
      expect(state.items[0].name).toBe("Updated");
      expect(state.totalItems).toBe(1);
    });

    it("should move work item to new column when status changes", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const originalItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(originalItem);
      const updatedItem = {
        ...originalItem,
        workItemStatus: DONE,
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      expect(getState("high", "todo").items).toEqual([]);
      expect(getState("high", "done").items).toContainEqual(updatedItem);
    });

    it("should move work item to new swimlane when priority changes", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      service.initializeSwimlane("low", columns);
      const originalItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(originalItem);
      const updatedItem = {
        ...originalItem,
        workItemPriority: WorkItemPriority.LOW,
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      expect(getState("high", "todo").items).toEqual([]);
      expect(getState("low", "todo").items).toContainEqual(updatedItem);
    });

    it("should move work item to new swimlane when category changes", () => {
      service.setSwimlanesByCategories([
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
      ]);
      service.initializeSwimlane("bug", columns);
      service.initializeSwimlane("feature", columns);
      const originalItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemCategory: "bug",
      } as unknown as WorkItem;
      service.addWorkItem(originalItem);
      const updatedItem = {
        ...originalItem,
        workItemCategory: "feature",
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      expect(getState("bug", "todo").items).toEqual([]);
      expect(getState("feature", "todo").items).toContainEqual(updatedItem);
    });

    it("should move work item to new swimlane when due date changes", () => {
      service.setSwimlanesByDueDate();
      service.initializeSwimlane("today", columns);
      service.initializeSwimlane("this-week", columns);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);
      const originalItem = {
        id: "wi-1",
        workItemStatus: TODO,
        dueDate: today.toISOString(),
      } as unknown as WorkItem;
      service.addWorkItem(originalItem);
      const updatedItem = {
        ...originalItem,
        dueDate: nextWeek.toISOString(),
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      expect(getState("today", "todo").items).toEqual([]);
      expect(getState("this-week", "todo").items).toContainEqual(updatedItem);
    });

    it("should move work item to new swimlane and column when both change", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      service.initializeSwimlane("low", columns);
      const originalItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(originalItem);
      const updatedItem = {
        ...originalItem,
        workItemStatus: DONE,
        workItemPriority: WorkItemPriority.LOW,
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      expect(getState("high", "todo").items).toEqual([]);
      expect(getState("low", "done").items).toContainEqual(updatedItem);
    });

    it("should do nothing when work item does not exist", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const nonExistentItem = {
        id: "wi-999",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;

      service.updateWorkItem(nonExistentItem);

      expect(getState("high", "todo").items).toEqual([]);
    });

    it("should adjust total counts when moving between columns", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const item = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(item);
      const updatedItem = {
        ...item,
        workItemStatus: DONE,
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem);

      expect(getState("high", "todo").totalItems).toBe(0);
      expect(getState("high", "done").totalItems).toBe(1);
    });
  });

  describe("removeWorkItem", () => {
    it("should remove work item from swimlane", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(workItem);

      service.removeWorkItem("wi-1");

      const state = getState("high", "todo");
      expect(state.items).toEqual([]);
      expect(state.totalItems).toBe(0);
    });

    it("should not affect other work items when removing one", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const item1 = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      const item2 = {
        id: "wi-2",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(item1);
      service.addWorkItem(item2);

      service.removeWorkItem("wi-2");

      const state = getState("high", "todo");
      expect(state.items).toContainEqual(item1);
      expect(state.totalItems).toBe(1);
    });

    it("should do nothing when work item does not exist", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);
      const workItem = {
        id: "wi-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem;
      service.addWorkItem(workItem);

      service.removeWorkItem("wi-999");

      const state = getState("high", "todo");
      expect(state.items).toContainEqual(workItem);
      expect(state.totalItems).toBe(1);
    });

    it("should not reduce total count below zero", () => {
      service.setSwimlanesByPriority();
      service.initializeSwimlane("high", columns);

      service.removeWorkItem("wi-999");

      expect(getState("high", "todo").totalItems).toBe(0);
    });
  });

  describe("allVisibleWorkItems computed signal", () => {
    beforeEach(() => {
      service.setSwimlanesByPriority();
    });

    it("should return empty array when no work items are loaded", () => {
      const items = service.allVisibleWorkItems();

      expect(items).toEqual([]);
    });

    it("should return all work items from multiple swimlanes and columns", () => {
      service.initializeSwimlane("high", columns);
      service.initializeSwimlane("medium", columns);
      service.addWorkItem({
        id: "h-todo",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "m-done",
        workItemStatus: DONE,
        workItemPriority: WorkItemPriority.MEDIUM,
      } as unknown as WorkItem);

      const items = service.allVisibleWorkItems();

      expect(items.length).toBe(2);
      expect(items.map((i) => i.id)).toEqual(
        expect.arrayContaining(["h-todo", "m-done"])
      );
    });

    it("should deduplicate work items with same id", () => {
      service.initializeSwimlane("high", columns);
      const highState = (
        service as unknown as {
          swimlaneStates: Map<
            string,
            Map<string, WritableSignal<WorkItemsColumnState>>
          >;
        }
      ).swimlaneStates
        .get("high")
        ?.get("todo");
      highState?.set({
        items: [{ id: "w1" }, { id: "w1" }] as WorkItem[],
        currentPage: 0,
        isLastPage: false,
        totalItems: 2,
      });

      const items = service.allVisibleWorkItems();

      expect(items.length).toBe(1);
      expect(items[0].id).toBe("w1");
    });

    it("should update reactively when work items are added", () => {
      service.initializeSwimlane("high", columns);
      expect(service.allVisibleWorkItems().length).toBe(0);

      service.addWorkItem({
        id: "new-1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem);

      expect(service.allVisibleWorkItems().length).toBe(1);
      expect(service.allVisibleWorkItems()[0].id).toBe("new-1");
    });

    it("should update reactively when work items are removed", () => {
      service.initializeSwimlane("high", columns);
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "w2",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem);
      expect(service.allVisibleWorkItems().length).toBe(2);

      service.removeWorkItem("w1");

      expect(service.allVisibleWorkItems().length).toBe(1);
      expect(service.allVisibleWorkItems()[0].id).toBe("w2");
    });

    it("should update reactively when work items move between swimlanes", () => {
      service.initializeSwimlane("high", columns);
      service.initializeSwimlane("low", columns);
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.HIGH,
      } as unknown as WorkItem);
      expect(service.allVisibleWorkItems().length).toBe(1);

      service.updateWorkItem({
        id: "w1",
        workItemStatus: TODO,
        workItemPriority: WorkItemPriority.LOW,
      } as unknown as WorkItem);

      const items = service.allVisibleWorkItems();
      expect(items.length).toBe(1);
      expect(items[0].id).toBe("w1");
    });
  });
});
