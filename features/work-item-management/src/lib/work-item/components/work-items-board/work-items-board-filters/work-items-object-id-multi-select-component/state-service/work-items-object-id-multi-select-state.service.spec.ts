import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { WorkItemsObjectIdMultiSelectStateService } from "./work-items-object-id-multi-select-state.service";
import { WorkItemService } from "../../../../../services/work-item-api/work-item.service";
import { WorkItemStatus } from "../../../../../model/work-item";
import { of } from "rxjs";

const MOCK_WORK_ITEMS_PAGE_1 = {
  content: [{ objectId: "WI-1" }, { objectId: "WI-2" }],
  last: false,
};
const MOCK_WORK_ITEMS_PAGE_2 = {
  content: [{ objectId: "WI-3" }],
  last: true,
};

describe("WorkItemsObjectIdMultiSelectStateService", () => {
  let service: WorkItemsObjectIdMultiSelectStateService;
  let workItemService: Partial<WorkItemService>;

  beforeEach(() => {
    workItemService = {
      getFilteredWorkItems: jest
        .fn()
        .mockReturnValue(of(MOCK_WORK_ITEMS_PAGE_1)),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkItemsObjectIdMultiSelectStateService,
        { provide: WorkItemService, useValue: workItemService },
      ],
    });

    service = TestBed.inject(WorkItemsObjectIdMultiSelectStateService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch work item IDs on initialization", fakeAsync(() => {
    const now = Date.UTC(2024, 0, 10, 12, 0, 0);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);

    TestBed.tick();

    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-1" },
      { id: "WI-2" },
    ]);
    expect(service.isLastPageSignal()).toBe(false);
    expect(workItemService.getFilteredWorkItems).toHaveBeenCalledWith(
      expect.objectContaining({
        resolvedDateSince: fiveDaysAgo.toISOString(),
      }),
      0,
      20,
      "objectId,asc"
    );

    dateSpy.mockRestore();
  }));

  it("should update workItemObjectIdOptionsSignal with new page", fakeAsync(() => {
    const now = Date.UTC(2024, 0, 15, 10, 30, 0);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    TestBed.tick();
    workItemService.getFilteredWorkItems = jest
      .fn()
      .mockReturnValueOnce(of(MOCK_WORK_ITEMS_PAGE_2));

    service.setPageIndexSubject(1);
    tick();

    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-1" },
      { id: "WI-2" },
      { id: "WI-3" },
    ]);
    expect(service.isLastPageSignal()).toBe(true);
    expect(workItemService.getFilteredWorkItems).toHaveBeenCalledWith(
      expect.objectContaining({
        resolvedDateSince: fiveDaysAgo.toISOString(),
      }),
      1,
      20,
      "objectId,asc"
    );

    dateSpy.mockRestore();
  }));

  it("should set loading to false after fetch", () => {
    expect(service.isLoadingDataSignal()).toBe(false);
  });

  it("should handle fetch errors gracefully", fakeAsync(() => {
    TestBed.tick();
    workItemService.getFilteredWorkItems = jest.fn().mockReturnValueOnce({
      pipe: () => ({
        subscribe: (observer: { error: (err: { message: string }) => void }) =>
          observer.error({ message: "Failed" }),
      }),
    });

    service.setPageIndexSubject(1);
    tick();

    expect(service.errorMessageSignal()).toBe("Failed");
    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-1" },
      { id: "WI-2" },
    ]);
  }));

  it("should reset page and options when projectIds change", fakeAsync(() => {
    const now = Date.UTC(2024, 2, 5, 14, 0, 0);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    TestBed.tick();
    jest.clearAllMocks();
    workItemService.getFilteredWorkItems = jest.fn().mockReturnValue(
      of({
        content: [{ objectId: "WI-P1" }],
        last: true,
      })
    );

    service.setProjectIdsSubject(["P1", "P2"]);
    expect(service.pageIndexSignal()).toBe(0);
    expect(service.isLastPageSignal()).toBe(false);
    tick();

    expect(workItemService.getFilteredWorkItems).toHaveBeenCalledWith(
      expect.objectContaining({
        projectIds: ["P1", "P2"],
        resolvedDateSince: fiveDaysAgo.toISOString(),
      }),
      0,
      20,
      "objectId,asc"
    );
    expect(service.workItemObjectIdOptionsSignal()).toEqual([{ id: "WI-P1" }]);

    dateSpy.mockRestore();
  }));

  it("should set search key and fetch", fakeAsync(() => {
    const now = Date.UTC(2024, 5, 20, 8, 15, 0);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    TestBed.tick();
    jest.clearAllMocks();

    service.setSearchKeySubject("search");
    tick();

    expect(service.searchKeySignal()).toBe("search");
    expect(workItemService.getFilteredWorkItems).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "search",
        resolvedDateSince: fiveDaysAgo.toISOString(),
      }),
      0,
      20,
      "objectId,asc"
    );

    dateSpy.mockRestore();
  }));

  it("should reset page and options when workItemStatuses change", fakeAsync(() => {
    const now = Date.UTC(2024, 3, 15, 10, 0, 0);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    TestBed.tick();
    jest.clearAllMocks();
    workItemService.getFilteredWorkItems = jest.fn().mockReturnValue(
      of({
        content: [{ objectId: "WI-OPEN1" }],
        last: true,
      })
    );

    service.setWorkItemStatusesSubject([
      WorkItemStatus.OPEN,
      WorkItemStatus.ASSIGNED,
    ]);
    expect(service.pageIndexSignal()).toBe(0);
    expect(service.isLastPageSignal()).toBe(false);
    tick();

    expect(workItemService.getFilteredWorkItems).toHaveBeenCalledWith(
      expect.objectContaining({
        workItemStatuses: [WorkItemStatus.OPEN, WorkItemStatus.ASSIGNED],
        resolvedDateSince: fiveDaysAgo.toISOString(),
      }),
      0,
      20,
      "objectId,asc"
    );
    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-OPEN1" },
    ]);

    dateSpy.mockRestore();
  }));

  it("should filter out work items without objectId", fakeAsync(() => {
    workItemService.getFilteredWorkItems = jest.fn().mockReturnValue(
      of({
        content: [
          { objectId: "WI-1" },
          { objectId: null },
          { objectId: "WI-2" },
          { objectId: undefined },
        ],
        last: true,
      })
    );

    TestBed.tick();

    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-1" },
      { id: "WI-2" },
    ]);
  }));

  it("should filter out duplicate objectIds when appending pages", fakeAsync(() => {
    TestBed.tick();
    workItemService.getFilteredWorkItems = jest.fn().mockReturnValueOnce(
      of({
        content: [
          { objectId: "WI-2" },
          { objectId: "WI-3" },
          { objectId: "WI-1" },
        ],
        last: true,
      })
    );

    service.setPageIndexSubject(1);
    tick();

    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-1" },
      { id: "WI-2" },
      { id: "WI-3" },
    ]);
  }));

  it("should not fetch more pages when isLastPage is true", fakeAsync(() => {
    TestBed.tick();
    workItemService.getFilteredWorkItems = jest
      .fn()
      .mockReturnValueOnce(of(MOCK_WORK_ITEMS_PAGE_2));
    service.setPageIndexSubject(1);
    tick();
    expect(service.isLastPageSignal()).toBe(true);
    jest.clearAllMocks();

    service.setPageIndexSubject(2);
    tick();

    expect(workItemService.getFilteredWorkItems).not.toHaveBeenCalled();
  }));

  it("should clear existing options when resetting to page 0", fakeAsync(() => {
    TestBed.tick();
    workItemService.getFilteredWorkItems = jest
      .fn()
      .mockReturnValue(of(MOCK_WORK_ITEMS_PAGE_2));
    service.setPageIndexSubject(1);
    tick();
    expect(service.workItemObjectIdOptionsSignal()).toEqual([
      { id: "WI-1" },
      { id: "WI-2" },
      { id: "WI-3" },
    ]);
    workItemService.getFilteredWorkItems = jest.fn().mockReturnValue(
      of({
        content: [{ objectId: "WI-4" }],
        last: false,
      })
    );

    service.setPageIndexSubject(0);
    tick();

    expect(service.workItemObjectIdOptionsSignal()).toEqual([{ id: "WI-4" }]);
  }));
});
