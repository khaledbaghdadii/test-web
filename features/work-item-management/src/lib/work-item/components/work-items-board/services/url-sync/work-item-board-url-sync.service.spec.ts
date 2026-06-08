import { TestBed } from "@angular/core/testing";
import { Router, ActivatedRoute, NavigationEnd, Params } from "@angular/router";
import { Subject } from "rxjs";
import { WorkItemBoardUrlSyncService } from "./work-item-board-url-sync.service";
import { WorkItemPriority } from "../../../../model/work-item";
import { WorkItemBoardUrlFilters } from "../../model/work-item-board-filters.model";

describe("WorkItemBoardUrlSyncService", () => {
  const MOCK_SEARCH_KEY = "test search";
  const MOCK_SORT_BY = "priority";
  const MOCK_PROJECTS = ["project-1", "project-2"];
  const MOCK_OBJECT_IDS = ["object-1", "object-2"];
  const MOCK_ASSIGNEES = ["user-1", "user-2"];
  const MOCK_CATEGORIES = ["category-1", "category-2"];
  const MOCK_PRIORITY = WorkItemPriority.HIGH;
  const MOCK_START_DATE = new Date("2025-01-01");
  const MOCK_END_DATE = new Date("2025-12-31");
  const MOCK_START_DATE_ISO = "2025-01-01";
  const MOCK_END_DATE_ISO = "2025-12-31";

  let service: WorkItemBoardUrlSyncService;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>;
  let routerEventsSubject: Subject<unknown>;

  beforeEach(() => {
    routerEventsSubject = new Subject();

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      navigate: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<Router>;

    mockActivatedRoute = {
      snapshot: {
        queryParams: {},
      },
    } as unknown as jest.Mocked<ActivatedRoute>;

    TestBed.configureTestingModule({
      providers: [
        WorkItemBoardUrlSyncService,
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    service = TestBed.inject(WorkItemBoardUrlSyncService);
  });

  it("should emit query params when navigation ends", () => {
    const mockParams: Params = { search: MOCK_SEARCH_KEY };
    mockActivatedRoute.snapshot.queryParams = mockParams;

    const promise = new Promise<void>((resolve) => {
      service.queryParams$.subscribe((params) => {
        expect(params).toEqual(mockParams);
        resolve();
      });
    });

    routerEventsSubject.next(new NavigationEnd(1, "/test", "/test"));

    return promise;
  });

  it("should filter duplicate params and ignore non-navigation events", () => {
    const mockParams: Params = { search: MOCK_SEARCH_KEY };
    mockActivatedRoute.snapshot.queryParams = mockParams;

    const emissions: Params[] = [];
    const promise = new Promise<void>((resolve) => {
      service.queryParams$.subscribe((params) => {
        emissions.push(params);
        if (emissions.length === 1) {
          resolve();
        }
      });
    });

    routerEventsSubject.next({ type: "OTHER_EVENT" });
    routerEventsSubject.next(new NavigationEnd(1, "/test", "/test"));
    routerEventsSubject.next(new NavigationEnd(2, "/test", "/test"));

    return promise.then(() => {
      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toEqual(mockParams);
    });
  });

  it("should parse priority enum with lowercase to uppercase conversion", () => {
    mockActivatedRoute.snapshot.queryParams = { priority: "high" };

    const result = service.getFiltersFromUrl();

    expect(result.selectedPriority).toBe(WorkItemPriority.HIGH);
  });

  it("should ignore invalid priority enum values", () => {
    mockActivatedRoute.snapshot.queryParams = { priority: "invalid" };

    const result = service.getFiltersFromUrl();

    expect(result.selectedPriority).toBeUndefined();
  });

  it("should convert single query param values to arrays", () => {
    mockActivatedRoute.snapshot.queryParams = {
      projects: "single-project",
      assignees: "single-user",
      categories: "single-category",
    };

    const result = service.getFiltersFromUrl();

    expect(result.selectedProjects).toEqual(["single-project"]);
    expect(result.selectedAssignees).toEqual(["single-user"]);
    expect(result.selectedCategories).toEqual(["single-category"]);
  });

  it("should parse partial date range with only start date", () => {
    mockActivatedRoute.snapshot.queryParams = {
      dueDateFrom: MOCK_START_DATE_ISO,
    };

    const result = service.getFiltersFromUrl();

    expect(result.selectedDateRange).toEqual({
      startDate: new Date(MOCK_START_DATE_ISO),
      endDate: null,
    });
  });

  it("should ignore invalid date formats", () => {
    mockActivatedRoute.snapshot.queryParams = {
      dueDateFrom: "invalid-date",
    };

    const result = service.getFiltersFromUrl();

    expect(result.selectedDateRange).toBeUndefined();
  });

  it("should parse all filter types from query params", () => {
    mockActivatedRoute.snapshot.queryParams = {
      search: MOCK_SEARCH_KEY,
      sortBy: MOCK_SORT_BY,
      projects: MOCK_PROJECTS,
      assignees: MOCK_ASSIGNEES,
      categories: MOCK_CATEGORIES,
      priority: "high",
      dueDateFrom: MOCK_START_DATE_ISO,
      dueDateTo: MOCK_END_DATE_ISO,
    };

    const result = service.getFiltersFromUrl();

    expect(result).toEqual({
      searchKey: MOCK_SEARCH_KEY,
      sortBy: MOCK_SORT_BY,
      selectedProjects: MOCK_PROJECTS,
      selectedAssignees: MOCK_ASSIGNEES,
      selectedCategories: MOCK_CATEGORIES,
      selectedPriority: WorkItemPriority.HIGH,
      selectedDateRange: {
        startDate: new Date(MOCK_START_DATE_ISO),
        endDate: new Date(MOCK_END_DATE_ISO),
      },
    });
  });

  it("should serialize all filter types to query params with proper formatting", async () => {
    const filters: WorkItemBoardUrlFilters = {
      searchKey: MOCK_SEARCH_KEY,
      sortBy: MOCK_SORT_BY,
      selectedProjects: MOCK_PROJECTS,
      selectedObjectIds: MOCK_OBJECT_IDS,
      selectedAssignees: MOCK_ASSIGNEES,
      selectedCategories: MOCK_CATEGORIES,
      selectedPriority: MOCK_PRIORITY,
      selectedDateRange: {
        startDate: MOCK_START_DATE,
        endDate: MOCK_END_DATE,
      },
    };

    await service.syncFiltersToUrl(filters);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: {
          search: MOCK_SEARCH_KEY,
          sortBy: MOCK_SORT_BY,
          projects: MOCK_PROJECTS,
          objectIds: MOCK_OBJECT_IDS,
          assignees: MOCK_ASSIGNEES,
          categories: MOCK_CATEGORIES,
          priority: "high",
          dueDateFrom: MOCK_START_DATE_ISO,
          dueDateTo: MOCK_END_DATE_ISO,
        },
      })
    );
  });

  it("should exclude projects from url when excludeProjects flag is true", async () => {
    const filters: WorkItemBoardUrlFilters = {
      searchKey: MOCK_SEARCH_KEY,
      sortBy: null,
      selectedObjectIds: [],
      selectedProjects: MOCK_PROJECTS,
      selectedAssignees: [],
      selectedCategories: [],
      selectedPriority: null,
      selectedDateRange: null,
    };

    await service.syncFiltersToUrl(filters, true, true);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { search: MOCK_SEARCH_KEY },
      })
    );
  });

  it("should use replaceUrl false when specified", async () => {
    const filters: WorkItemBoardUrlFilters = {
      searchKey: "",
      sortBy: null,
      selectedProjects: [],
      selectedObjectIds: [],
      selectedAssignees: [],
      selectedCategories: [],
      selectedPriority: null,
      selectedDateRange: null,
    };

    await service.syncFiltersToUrl(filters, false);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        replaceUrl: false,
      })
    );
  });

  it("should queue concurrent syncs with lock mechanism", async () => {
    const filters: WorkItemBoardUrlFilters = {
      searchKey: MOCK_SEARCH_KEY,
      sortBy: null,
      selectedProjects: [],
      selectedObjectIds: [],
      selectedAssignees: [],
      selectedCategories: [],
      selectedPriority: null,
      selectedDateRange: null,
    };

    const firstCall = service.syncFiltersToUrl(filters);
    const secondCall = service.syncFiltersToUrl(filters);

    await Promise.all([firstCall, secondCall]);

    expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
  });

  it("should release sync lock after navigation failure", async () => {
    mockRouter.navigate.mockRejectedValueOnce(new Error("Navigation failed"));
    const filters: WorkItemBoardUrlFilters = {
      searchKey: MOCK_SEARCH_KEY,
      sortBy: null,
      selectedObjectIds: [],
      selectedProjects: [],
      selectedAssignees: [],
      selectedCategories: [],
      selectedPriority: null,
      selectedDateRange: null,
    };

    await expect(service.syncFiltersToUrl(filters)).rejects.toThrow(
      "Navigation failed"
    );

    await service.syncFiltersToUrl(filters);

    expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
  });

  it("should maintain filter integrity in full round trip", async () => {
    const filters: WorkItemBoardUrlFilters = {
      searchKey: MOCK_SEARCH_KEY,
      sortBy: MOCK_SORT_BY,
      selectedProjects: MOCK_PROJECTS,
      selectedAssignees: MOCK_ASSIGNEES,
      selectedCategories: MOCK_CATEGORIES,
      selectedObjectIds: MOCK_OBJECT_IDS,
      selectedPriority: MOCK_PRIORITY,
      selectedDateRange: {
        startDate: MOCK_START_DATE,
        endDate: MOCK_END_DATE,
      },
    };

    await service.syncFiltersToUrl(filters);
    const capturedParams = (mockRouter.navigate as jest.Mock).mock.calls[0][1]
      .queryParams;
    mockActivatedRoute.snapshot.queryParams = capturedParams;

    const result = service.getFiltersFromUrl();

    expect(result).toEqual({
      searchKey: filters.searchKey,
      sortBy: filters.sortBy,
      selectedProjects: filters.selectedProjects,
      selectedObjectIds: filters.selectedObjectIds,
      selectedAssignees: filters.selectedAssignees,
      selectedCategories: filters.selectedCategories,
      selectedPriority: filters.selectedPriority,
      selectedDateRange: {
        startDate: filters.selectedDateRange?.startDate,
        endDate: filters.selectedDateRange?.endDate,
      },
    });
  });

  it("should handle empty filters in round trip", async () => {
    const filters: WorkItemBoardUrlFilters = {
      searchKey: "",
      sortBy: null,
      selectedProjects: [],
      selectedAssignees: [],
      selectedCategories: [],
      selectedObjectIds: [],
      selectedPriority: null,
      selectedDateRange: null,
    };

    await service.syncFiltersToUrl(filters);
    const capturedParams = (mockRouter.navigate as jest.Mock).mock.calls[0][1]
      .queryParams;
    mockActivatedRoute.snapshot.queryParams = capturedParams;

    const result = service.getFiltersFromUrl();

    expect(result).toEqual({});
  });
});
