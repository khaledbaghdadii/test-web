import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, Subject, throwError } from "rxjs";
import { KanbanViewService } from "./kanban-view.service";
import { WorkItemBoardColumnConfig } from "../../../model/work-item-board-column-config.model";
import { WorkItemService } from "../../../../../services/work-item-api/work-item.service";
import { WorkItemBoardFilter } from "../../../model/work-item-board-filter.model";
import { WorkItemStatus, WorkItem } from "../../../../../model/work-item";
import { WorkItemsPerStatusApiResponse } from "../../../../../services/work-item-api/response/work-items-per-status-api-response.model";

describe("KanbanViewService", () => {
  let service: KanbanViewService;
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
  const getState = (id: string) => service.getColumnState(id)();
  const filters = {} as WorkItemBoardFilter;

  beforeEach(() => {
    workItemServiceMock = {
      getWorkItemsPerStatus: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        KanbanViewService,
        { provide: WorkItemService, useValue: workItemServiceMock },
      ],
    });
    service = TestBed.inject(KanbanViewService);
  });

  describe("initializeColumns", () => {
    it("should create initial state when columns are provided", () => {
      const expectedInitialState = emptyState();

      service.initializeColumns(columns);

      expect(getState("todo")).toEqual(expectedInitialState);
      expect(getState("doing")).toEqual(expectedInitialState);
      expect(getState("done")).toEqual(expectedInitialState);
      expect(service.isLoading()).toBe(false);
    });

    it("should create default state when column state is requested", () => {
      const expectedInitialState = emptyState();

      const state = getState("unknown");

      expect(state).toEqual(expectedInitialState);
    });

    it("should reset column states when columns are reinitialized", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 3]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      expect(getState("todo").items.length).toBe(1);

      service.initializeColumns(columns);

      expect(getState("todo")).toEqual(emptyState());
    });
  });

  describe("loadData", () => {
    it("should set column state for each status when loading first page", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: 1 }], false, 3],
        [IN_PROGRESS, [{ id: 2 }], false, 2],
        [DONE, [{ id: 3 }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(service.loadData(columns, filters, 0));

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledWith(
        { workItemStatuses: [TODO, IN_PROGRESS, DONE] },
        0,
        10
      );
      expect(getState("todo")).toEqual({
        items: [{ id: 1 }],
        currentPage: 0,
        isLastPage: false,
        totalItems: 3,
      });
      expect(getState("doing")).toEqual({
        items: [{ id: 2 }],
        currentPage: 0,
        isLastPage: false,
        totalItems: 2,
      });
      expect(getState("done")).toEqual({
        items: [{ id: 3 }],
        currentPage: 0,
        isLastPage: true,
        totalItems: 1,
      });
      expect(service.isLoading()).toBe(false);
    });

    it("should append items when loading subsequent pages", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], false, 3],
        [IN_PROGRESS, [{ id: "p0" }], false, 2],
        [DONE, [{ id: "d0" }], false, 4],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      const page1 = makeResponse([
        [TODO, [{ id: "t1" }], false, 3],
        [IN_PROGRESS, [{ id: "p1" }], true, 2],
        [DONE, [{ id: "d1" }], false, 4],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(service.loadData(columns, filters, 1));

      expect(getState("todo")).toEqual({
        items: [{ id: "t0" }, { id: "t1" }],
        currentPage: 1,
        isLastPage: false,
        totalItems: 3,
      });
      expect(getState("doing")).toEqual({
        items: [{ id: "p0" }, { id: "p1" }],
        currentPage: 1,
        isLastPage: true,
        totalItems: 2,
      });
      expect(getState("done")).toEqual({
        items: [{ id: "d0" }, { id: "d1" }],
        currentPage: 1,
        isLastPage: false,
        totalItems: 4,
      });
      expect(service.getHighestPage()).toBe(1);
    });

    it("should skip API call when all statuses reach last page", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], true, 1],
        [IN_PROGRESS, [{ id: "p0" }], true, 1],
        [DONE, [{ id: "d0" }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      workItemServiceMock.getWorkItemsPerStatus.mockClear();

      await firstValueFrom(service.loadData(columns, filters, 1));

      expect(workItemServiceMock.getWorkItemsPerStatus).not.toHaveBeenCalled();
      expect(getState("todo").currentPage).toBe(0);
      expect(getState("todo").isLastPage).toBe(true);
    });

    it("should reset loading state when API call fails", async () => {
      service.initializeColumns(columns);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        throwError(() => new Error("boom"))
      );

      await firstValueFrom(service.loadData(columns, filters, 0));

      expect(service.isLoading()).toBe(false);
      expect(getState("todo")).toEqual(emptyState());
      expect(getState("doing")).toEqual(emptyState());
      expect(getState("done")).toEqual(emptyState());
    });

    it("should request only incomplete statuses when next page is requested", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], false, 5],
        [IN_PROGRESS, [{ id: "p0" }], false, 5],
        [DONE, [{ id: "d0" }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      const page1 = makeResponse([
        [TODO, [{ id: "t1" }], false, 5],
        [IN_PROGRESS, [{ id: "p1" }], false, 5],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(service.loadData(columns, filters, 1));

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledTimes(
        2
      );
      expect(
        workItemServiceMock.getWorkItemsPerStatus
      ).toHaveBeenLastCalledWith(
        { workItemStatuses: [TODO, IN_PROGRESS] },
        1,
        10
      );
    });

    it("should handle empty response when API returns no items", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [], true, 0],
        [IN_PROGRESS, [], true, 0],
        [DONE, [], true, 0],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(service.loadData(columns, filters, 0));

      expect(getState("todo")).toEqual({
        items: [],
        currentPage: 0,
        isLastPage: true,
        totalItems: 0,
      });
    });

    it("should retain previous data when response omits a status", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: 1 }], false, 2],
        [DONE, [{ id: 3 }], true, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));

      await firstValueFrom(service.loadData(columns, filters, 0));

      expect(getState("todo").items).toEqual([{ id: 1 }]);
      expect(getState("doing").items).toEqual([]);
      expect(getState("done").items).toEqual([{ id: 3 }]);
    });

    it("should reload first page when page zero is requested again", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      const page0Again = makeResponse([[TODO, [{ id: 3 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        of(page0Again)
      );

      await firstValueFrom(service.loadData(columns, filters, 0));

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledTimes(
        2
      );
    });

    it("should replace existing items when reloading first page", async () => {
      service.initializeColumns(columns);
      const page0First = makeResponse([[TODO, [{ id: 1 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        of(page0First)
      );
      await firstValueFrom(service.loadData(columns, filters, 0));
      expect(getState("todo").items).toEqual([{ id: 1 }]);
      const page0Second = makeResponse([[TODO, [{ id: 2 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(
        of(page0Second)
      );

      await firstValueFrom(service.loadData(columns, filters, 0));

      expect(getState("todo").items).toEqual([{ id: 2 }]);
      expect(getState("todo").items.length).toBe(1);
    });
  });

  describe("load guard", () => {
    it("should block concurrent loads when request is in flight", () => {
      service.initializeColumns(columns);
      const subject = new Subject<WorkItemsPerStatusApiResponse>();
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValue(
        subject.asObservable()
      );
      const sub1 = service.loadData(columns, filters, 0).subscribe();
      expect(service.isLoading()).toBe(true);
      workItemServiceMock.getWorkItemsPerStatus.mockClear();

      const sub2 = service.loadData(columns, filters, 1).subscribe();

      expect(workItemServiceMock.getWorkItemsPerStatus).not.toHaveBeenCalled();
      subject.next(makeResponse([[TODO, [], false, 0]]));
      subject.complete();
      expect(service.isLoading()).toBe(false);
      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it("should allow next load when previous load completes", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([[TODO, [{ id: 1 }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      expect(service.isLoading()).toBe(false);
      const page1 = makeResponse([[TODO, [{ id: 2 }], true, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));

      await firstValueFrom(service.loadData(columns, filters, 1));

      expect(workItemServiceMock.getWorkItemsPerStatus).toHaveBeenCalledTimes(
        2
      );
      expect(service.isLoading()).toBe(false);
    });
  });

  describe("reset", () => {
    it("should restore initial state when reset is called", async () => {
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: 1 }], false, 3],
        [IN_PROGRESS, [{ id: 2 }], false, 2],
        [DONE, [{ id: 3 }], false, 1],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      expect(getState("todo").items.length).toBe(1);

      service.reset();

      expect(getState("todo")).toEqual(emptyState());
      expect(getState("doing")).toEqual(emptyState());
      expect(getState("done")).toEqual(emptyState());
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
      service.initializeColumns(columns);
      const page0 = makeResponse([
        [TODO, [{ id: "t0" }], false, 3],
        [IN_PROGRESS, [{ id: "p0" }], false, 3],
        [DONE, [{ id: "d0" }], false, 3],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      expect(service.getHighestPage()).toBe(0);
      const page1 = makeResponse([
        [TODO, [{ id: "t1" }], false, 3],
        [IN_PROGRESS, [{ id: "p1" }], false, 3],
        [DONE, [{ id: "d1" }], false, 3],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));
      await firstValueFrom(service.loadData(columns, filters, 1));
      expect(service.getHighestPage()).toBe(1);
      const page2 = makeResponse([
        [TODO, [{ id: "t2" }], false, 3],
        [IN_PROGRESS, [{ id: "p2" }], true, 3],
        [DONE, [{ id: "d2" }], false, 3],
      ]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page2));

      await firstValueFrom(service.loadData(columns, filters, 2));

      expect(service.getHighestPage()).toBe(2);
    });
  });

  describe("addWorkItem", () => {
    beforeEach(() => {
      service.initializeColumns(columns);
    });

    it("should add work item to the beginning of the correct column based on status", () => {
      const workItem = {
        id: "new-1",
        workItemStatus: TODO,
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      const state = getState("todo");
      expect(state.items).toEqual([workItem]);
      expect(state.totalItems).toBe(1);
    });

    it("should prepend work item when column already contains items", async () => {
      const page0 = makeResponse([[TODO, [{ id: "existing-1" }], false, 1]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      const newWorkItem = {
        id: "new-1",
        workItemStatus: TODO,
      } as unknown as WorkItem;

      service.addWorkItem(newWorkItem);

      const state = getState("todo");
      expect(state.items).toEqual([newWorkItem, { id: "existing-1" }]);
      expect(state.totalItems).toBe(2);
    });

    it("should increment total items count when adding work item", () => {
      const workItem = {
        id: "new-1",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;

      service.addWorkItem(workItem);

      const state = getState("doing");
      expect(state.totalItems).toBe(1);
    });

    it("should not modify state when work item status has no matching column", () => {
      const invalidStatus = "INVALID_STATUS" as unknown as WorkItemStatus;
      const workItem = {
        id: "new-1",
        workItemStatus: invalidStatus,
      } as unknown as WorkItem;
      const initialState = getState("todo");

      service.addWorkItem(workItem);

      expect(getState("todo")).toEqual(initialState);
    });

    it("should add multiple work items to same column independently", () => {
      const workItem1 = {
        id: "new-1",
        workItemStatus: DONE,
      } as unknown as WorkItem;
      const workItem2 = {
        id: "new-2",
        workItemStatus: DONE,
      } as unknown as WorkItem;

      service.addWorkItem(workItem1);
      service.addWorkItem(workItem2);

      const state = getState("done");
      expect(state.items).toEqual([workItem2, workItem1]);
      expect(state.totalItems).toBe(2);
    });

    it("should add work items to different columns without interference", () => {
      const todoItem = {
        id: "todo-1",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      const doneItem = {
        id: "done-1",
        workItemStatus: DONE,
      } as unknown as WorkItem;

      service.addWorkItem(todoItem);
      service.addWorkItem(doneItem);

      expect(getState("todo").items).toEqual([todoItem]);
      expect(getState("done").items).toEqual([doneItem]);
      expect(getState("doing").items).toEqual([]);
    });
  });

  describe("updateWorkItem", () => {
    beforeEach(() => {
      service.initializeColumns(columns);
    });

    it("should update work item in place when status remains the same", () => {
      const original = {
        id: "w1",
        name: "Original",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(original);
      const updated = {
        id: "w1",
        name: "Updated",
        workItemStatus: TODO,
      } as unknown as WorkItem;

      service.updateWorkItem(updated);

      const state = getState("todo");
      expect(state.items).toEqual([updated]);
      expect((state.items[0] as WorkItem & { name: string }).name).toBe(
        "Updated"
      );
      expect(state.totalItems).toBe(1);
    });

    it("should move work item to new column when status changes", () => {
      const original = {
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(original);
      const updated = {
        id: "w1",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;

      service.updateWorkItem(updated);

      expect(getState("todo").items).toEqual([]);
      expect(getState("todo").totalItems).toBe(0);
      expect(getState("doing").items).toEqual([updated]);
      expect(getState("doing").totalItems).toBe(1);
    });

    it("should maintain correct item counts when moving between columns", () => {
      const item1 = { id: "w1", workItemStatus: TODO } as unknown as WorkItem;
      const item2 = { id: "w2", workItemStatus: TODO } as unknown as WorkItem;
      service.addWorkItem(item1);
      service.addWorkItem(item2);
      expect(getState("todo").totalItems).toBe(2);
      const updated = { id: "w1", workItemStatus: DONE } as unknown as WorkItem;

      service.updateWorkItem(updated);

      expect(getState("todo").totalItems).toBe(1);
      expect(getState("done").totalItems).toBe(1);
    });

    it("should not modify state when work item does not exist", () => {
      const nonExistent = {
        id: "missing",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      const initialTodoState = getState("todo");
      const initialDoingState = getState("doing");

      service.updateWorkItem(nonExistent);

      expect(getState("todo")).toEqual(initialTodoState);
      expect(getState("doing")).toEqual(initialDoingState);
    });

    it("should not modify state when new status has no matching column", () => {
      const original = {
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(original);
      const invalidStatus = "INVALID" as unknown as WorkItemStatus;
      const updated = {
        id: "w1",
        workItemStatus: invalidStatus,
      } as unknown as WorkItem;
      const initialState = getState("todo");

      service.updateWorkItem(updated);

      expect(getState("todo")).toEqual(initialState);
    });

    it("should preserve other items when updating specific work item", () => {
      const item1 = {
        id: "w1",
        name: "First",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      const item2 = {
        id: "w2",
        name: "Second",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      const item3 = {
        id: "w3",
        name: "Third",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(item1);
      service.addWorkItem(item2);
      service.addWorkItem(item3);
      const updatedItem2 = {
        id: "w2",
        name: "Updated Second",
        workItemStatus: TODO,
      } as unknown as WorkItem;

      service.updateWorkItem(updatedItem2);

      const state = getState("todo");
      expect(state.items.length).toBe(3);
      expect(
        (state.items.find((i) => i.id === "w1") as WorkItem & { name: string })
          ?.name
      ).toBe("First");
      expect(
        (state.items.find((i) => i.id === "w2") as WorkItem & { name: string })
          ?.name
      ).toBe("Updated Second");
      expect(
        (state.items.find((i) => i.id === "w3") as WorkItem & { name: string })
          ?.name
      ).toBe("Third");
    });

    it("should add work item to beginning of new column when moving", () => {
      const existing = {
        id: "existing",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;
      service.addWorkItem(existing);
      const moving = {
        id: "moving",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(moving);
      const updated = {
        id: "moving",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;

      service.updateWorkItem(updated);

      const state = getState("doing");
      expect(state.items[0].id).toBe("moving");
      expect(state.items[1].id).toBe("existing");
    });

    it("should handle moving work item across multiple columns", () => {
      const item = { id: "w1", workItemStatus: TODO } as unknown as WorkItem;
      service.addWorkItem(item);

      const movedToProgress = {
        id: "w1",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;
      service.updateWorkItem(movedToProgress);
      expect(getState("todo").items.length).toBe(0);
      expect(getState("doing").items.length).toBe(1);

      const movedToDone = {
        id: "w1",
        workItemStatus: DONE,
      } as unknown as WorkItem;
      service.updateWorkItem(movedToDone);

      expect(getState("todo").items.length).toBe(0);
      expect(getState("doing").items.length).toBe(0);
      expect(getState("done").items.length).toBe(1);
      expect(getState("done").items[0].id).toBe("w1");
    });
  });

  describe("removeWorkItem", () => {
    beforeEach(() => {
      service.initializeColumns(columns);
    });

    it("should remove work item from column and decrement count", () => {
      const workItem = {
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(workItem);
      expect(getState("todo").totalItems).toBe(1);

      service.removeWorkItem("w1");

      const state = getState("todo");
      expect(state.items).toEqual([]);
      expect(state.totalItems).toBe(0);
    });

    it("should remove only the specified work item from column with multiple items", () => {
      const item1 = {
        id: "w1",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;
      const item2 = {
        id: "w2",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;
      const item3 = {
        id: "w3",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem;
      service.addWorkItem(item1);
      service.addWorkItem(item2);
      service.addWorkItem(item3);

      service.removeWorkItem("w2");

      const state = getState("doing");
      expect(state.items.length).toBe(2);
      expect(state.items.find((i) => i.id === "w1")).toBeDefined();
      expect(state.items.find((i) => i.id === "w2")).toBeUndefined();
      expect(state.items.find((i) => i.id === "w3")).toBeDefined();
      expect(state.totalItems).toBe(2);
    });

    it("should not modify state when work item does not exist", () => {
      const workItem = {
        id: "w1",
        workItemStatus: DONE,
      } as unknown as WorkItem;
      service.addWorkItem(workItem);
      const initialState = getState("done");

      service.removeWorkItem("non-existent-id");

      expect(getState("done")).toEqual(initialState);
    });

    it("should not affect other columns when removing work item", () => {
      const todoItem = {
        id: "todo-1",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      const doneItem = {
        id: "done-1",
        workItemStatus: DONE,
      } as unknown as WorkItem;
      service.addWorkItem(todoItem);
      service.addWorkItem(doneItem);

      service.removeWorkItem("todo-1");

      expect(getState("todo").items).toEqual([]);
      expect(getState("done").items).toEqual([doneItem]);
    });

    it("should handle removing work item from empty column gracefully", () => {
      const initialState = getState("todo");

      service.removeWorkItem("non-existent");

      expect(getState("todo")).toEqual(initialState);
      expect(getState("todo").totalItems).toBe(0);
    });

    it("should not decrement count below zero", () => {
      const workItem = {
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem;
      service.addWorkItem(workItem);

      service.removeWorkItem("w1");
      service.removeWorkItem("w1");

      const state = getState("todo");
      expect(state.totalItems).toBe(0);
    });

    it("should remove work items in sequence correctly", () => {
      const item1 = { id: "w1", workItemStatus: TODO } as unknown as WorkItem;
      const item2 = { id: "w2", workItemStatus: TODO } as unknown as WorkItem;
      const item3 = { id: "w3", workItemStatus: TODO } as unknown as WorkItem;
      service.addWorkItem(item1);
      service.addWorkItem(item2);
      service.addWorkItem(item3);

      service.removeWorkItem("w1");
      expect(getState("todo").items.length).toBe(2);
      expect(getState("todo").totalItems).toBe(2);

      service.removeWorkItem("w2");
      expect(getState("todo").items.length).toBe(1);
      expect(getState("todo").totalItems).toBe(1);

      service.removeWorkItem("w3");
      expect(getState("todo").items.length).toBe(0);
      expect(getState("todo").totalItems).toBe(0);
    });
  });

  describe("allVisibleWorkItems computed signal", () => {
    beforeEach(() => {
      service.initializeColumns(columns);
    });

    it("should return empty array when no work items are loaded", () => {
      const items = service.allVisibleWorkItems();

      expect(items).toEqual([]);
    });

    it("should return all work items from multiple columns", () => {
      service.addWorkItem({
        id: "todo-1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "progress-1",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "done-1",
        workItemStatus: DONE,
      } as unknown as WorkItem);

      const items = service.allVisibleWorkItems();

      expect(items.length).toBe(3);
      expect(items.map((i) => i.id)).toContain("todo-1");
      expect(items.map((i) => i.id)).toContain("progress-1");
      expect(items.map((i) => i.id)).toContain("done-1");
    });

    it("should include work items from paginated results", async () => {
      const page0 = makeResponse([[TODO, [{ id: "t0" }], false, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page0));
      await firstValueFrom(service.loadData(columns, filters, 0));
      const page1 = makeResponse([[TODO, [{ id: "t1" }], true, 2]]);
      workItemServiceMock.getWorkItemsPerStatus.mockReturnValueOnce(of(page1));
      await firstValueFrom(service.loadData(columns, filters, 1));

      const items = service.allVisibleWorkItems();

      expect(items.length).toBe(2);
      expect(items.map((i) => i.id)).toEqual(
        expect.arrayContaining(["t0", "t1"])
      );
    });

    it("should update reactively when work items are added", () => {
      expect(service.allVisibleWorkItems().length).toBe(0);

      service.addWorkItem({
        id: "new-1",
        workItemStatus: TODO,
      } as unknown as WorkItem);

      expect(service.allVisibleWorkItems().length).toBe(1);
      expect(service.allVisibleWorkItems()[0].id).toBe("new-1");
    });

    it("should update reactively when work items are removed", () => {
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "w2",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      expect(service.allVisibleWorkItems().length).toBe(2);

      service.removeWorkItem("w1");

      expect(service.allVisibleWorkItems().length).toBe(1);
      expect(service.allVisibleWorkItems()[0].id).toBe("w2");
    });

    it("should update reactively when work items are updated", () => {
      service.addWorkItem({
        id: "w1",
        name: "Original",
        workItemStatus: TODO,
      } as unknown as WorkItem);

      service.updateWorkItem({
        id: "w1",
        name: "Updated",
        workItemStatus: TODO,
      } as unknown as WorkItem);

      const items = service.allVisibleWorkItems();
      expect(items.length).toBe(1);
      expect((items[0] as WorkItem & { name: string }).name).toBe("Updated");
    });

    it("should update reactively when work items are moved between columns", () => {
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "w2",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem);
      expect(service.allVisibleWorkItems().length).toBe(2);

      service.updateWorkItem({
        id: "w1",
        workItemStatus: DONE,
      } as unknown as WorkItem);

      const items = service.allVisibleWorkItems();
      expect(items.length).toBe(2);
      const ids = items.map((i) => i.id);
      expect(ids).toContain("w1");
      expect(ids).toContain("w2");
    });

    it("should reactively reflect changes after reset", () => {
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      expect(service.allVisibleWorkItems().length).toBe(1);

      service.reset();

      expect(service.allVisibleWorkItems().length).toBe(0);
    });

    it("should reactively reflect changes after reinitialization", () => {
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      expect(service.allVisibleWorkItems().length).toBe(1);

      service.initializeColumns(columns);

      expect(service.allVisibleWorkItems().length).toBe(0);
    });
  });

  describe("getColumnState signal", () => {
    beforeEach(() => {
      service.initializeColumns(columns);
    });

    it("should return a signal that updates when column state changes", () => {
      const todoStateSignal = service.getColumnState("todo");
      expect(todoStateSignal().items.length).toBe(0);

      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);

      expect(todoStateSignal().items.length).toBe(1);
      expect(todoStateSignal().items[0].id).toBe("w1");
    });

    it("should return independent signals for different columns", () => {
      const todoStateSignal = service.getColumnState("todo");
      const doingStateSignal = service.getColumnState("doing");

      service.addWorkItem({
        id: "todo-1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      service.addWorkItem({
        id: "doing-1",
        workItemStatus: IN_PROGRESS,
      } as unknown as WorkItem);

      expect(todoStateSignal().items.length).toBe(1);
      expect(doingStateSignal().items.length).toBe(1);
      expect(todoStateSignal().items[0].id).toBe("todo-1");
      expect(doingStateSignal().items[0].id).toBe("doing-1");
    });

    it("should update signal when work item is moved out of column", () => {
      const todoStateSignal = service.getColumnState("todo");
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      expect(todoStateSignal().items.length).toBe(1);

      service.updateWorkItem({
        id: "w1",
        workItemStatus: DONE,
      } as unknown as WorkItem);

      expect(todoStateSignal().items.length).toBe(0);
    });

    it("should update signal when work item is removed from column", () => {
      const todoStateSignal = service.getColumnState("todo");
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      expect(todoStateSignal().items.length).toBe(1);

      service.removeWorkItem("w1");

      expect(todoStateSignal().items.length).toBe(0);
      expect(todoStateSignal().totalItems).toBe(0);
    });

    it("should reset signal when reset is called", () => {
      const todoStateSignal = service.getColumnState("todo");
      service.addWorkItem({
        id: "w1",
        workItemStatus: TODO,
      } as unknown as WorkItem);
      expect(todoStateSignal().items.length).toBe(1);

      service.reset();

      expect(todoStateSignal()).toEqual(emptyState());
    });
  });
});
