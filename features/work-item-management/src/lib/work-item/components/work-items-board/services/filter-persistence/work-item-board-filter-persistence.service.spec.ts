import { TestBed } from "@angular/core/testing";
import { WorkItemBoardFilterPersistenceService } from "./work-item-board-filter-persistence.service";
import { WorkItemPriority } from "../../../../model/work-item";
import { WorkItemBoardUrlFilters } from "../../model/work-item-board-filters.model";

describe("WorkItemBoardFilterPersistenceService", () => {
  const MOCK_USERNAME = "test-user";
  const STORAGE_KEY = `work-item-board-filters:${MOCK_USERNAME}`;
  const MOCK_SEARCH_KEY = "test search";
  const MOCK_SORT_BY = "priority";
  const MOCK_PROJECTS = ["project-1", "project-2"];
  const MOCK_OBJECT_IDS = ["object-1", "object-2"];
  const MOCK_ASSIGNEES = ["user-1", "user-2"];
  const MOCK_CATEGORIES = ["category-1", "category-2"];
  const MOCK_PRIORITY = WorkItemPriority.HIGH;
  const MOCK_START_DATE = new Date("2025-01-01T00:00:00.000Z");
  const MOCK_END_DATE = new Date("2025-12-31T00:00:00.000Z");

  let service: WorkItemBoardFilterPersistenceService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [WorkItemBoardFilterPersistenceService],
    });

    service = TestBed.inject(WorkItemBoardFilterPersistenceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("saveFilters", () => {
    it("should save filters to localStorage", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: MOCK_SEARCH_KEY,
        selectedProjects: MOCK_PROJECTS,
        selectedPriority: MOCK_PRIORITY,
        selectedAssignees: MOCK_ASSIGNEES,
        selectedCategories: MOCK_CATEGORIES,
        selectedDateRange: {
          startDate: MOCK_START_DATE,
          endDate: MOCK_END_DATE,
        },
        selectedObjectIds: MOCK_OBJECT_IDS,
        sortBy: MOCK_SORT_BY,
      };

      service.saveFilters(filters, MOCK_USERNAME);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.searchKey).toBe(MOCK_SEARCH_KEY);
      expect(parsed.selectedProjects).toEqual(MOCK_PROJECTS);
      expect(parsed.selectedPriority).toBe(MOCK_PRIORITY);
      expect(parsed.selectedAssignees).toEqual(MOCK_ASSIGNEES);
      expect(parsed.selectedCategories).toEqual(MOCK_CATEGORIES);
      expect(parsed.selectedObjectIds).toEqual(MOCK_OBJECT_IDS);
      expect(parsed.sortBy).toBe(MOCK_SORT_BY);
    });

    it("should omit empty arrays and null values", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: "",
        selectedProjects: [],
        selectedPriority: null,
        selectedAssignees: [],
        selectedCategories: [],
        selectedDateRange: null,
        selectedObjectIds: [],
        sortBy: null,
      };

      service.saveFilters(filters, MOCK_USERNAME);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.searchKey).toBeUndefined();
      expect(parsed.selectedProjects).toBeUndefined();
      expect(parsed.selectedPriority).toBeUndefined();
      expect(parsed.selectedAssignees).toBeUndefined();
      expect(parsed.selectedCategories).toBeUndefined();
      expect(parsed.selectedDateRange).toBeUndefined();
      expect(parsed.selectedObjectIds).toBeUndefined();
      expect(parsed.sortBy).toBeUndefined();
    });

    it("should serialize date range with ISO strings", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: "",
        selectedProjects: [],
        selectedPriority: null,
        selectedAssignees: [],
        selectedCategories: [],
        selectedDateRange: {
          startDate: MOCK_START_DATE,
          endDate: MOCK_END_DATE,
        },
        selectedObjectIds: [],
        sortBy: null,
      };

      service.saveFilters(filters, MOCK_USERNAME);

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.selectedDateRange.startDate).toBe(
        MOCK_START_DATE.toISOString()
      );
      expect(parsed.selectedDateRange.endDate).toBe(
        MOCK_END_DATE.toISOString()
      );
    });
  });

  describe("loadFilters", () => {
    it("should return null when no filters are stored", () => {
      const result = service.loadFilters(MOCK_USERNAME);

      expect(result).toBeNull();
    });

    it("should return null when stored data is invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "invalid json");

      const result = service.loadFilters(MOCK_USERNAME);

      expect(result).toBeNull();
    });

    it("should restore all filter values", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: MOCK_SEARCH_KEY,
        selectedProjects: MOCK_PROJECTS,
        selectedPriority: MOCK_PRIORITY,
        selectedAssignees: MOCK_ASSIGNEES,
        selectedCategories: MOCK_CATEGORIES,
        selectedDateRange: {
          startDate: MOCK_START_DATE,
          endDate: MOCK_END_DATE,
        },
        selectedObjectIds: MOCK_OBJECT_IDS,
        sortBy: MOCK_SORT_BY,
      };
      service.saveFilters(filters, MOCK_USERNAME);

      const result = service.loadFilters(MOCK_USERNAME);

      expect(result).not.toBeNull();
      expect(result!.searchKey).toBe(MOCK_SEARCH_KEY);
      expect(result!.selectedProjects).toEqual(MOCK_PROJECTS);
      expect(result!.selectedPriority).toBe(MOCK_PRIORITY);
      expect(result!.selectedAssignees).toEqual(MOCK_ASSIGNEES);
      expect(result!.selectedCategories).toEqual(MOCK_CATEGORIES);
      expect(result!.selectedObjectIds).toEqual(MOCK_OBJECT_IDS);
      expect(result!.sortBy).toBe(MOCK_SORT_BY);
    });

    it("should deserialize date range back to Date objects", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: "",
        selectedProjects: [],
        selectedPriority: null,
        selectedAssignees: [],
        selectedCategories: [],
        selectedDateRange: {
          startDate: MOCK_START_DATE,
          endDate: MOCK_END_DATE,
        },
        selectedObjectIds: [],
        sortBy: null,
      };
      service.saveFilters(filters, MOCK_USERNAME);

      const result = service.loadFilters(MOCK_USERNAME);

      expect(result!.selectedDateRange).not.toBeNull();
      expect(result!.selectedDateRange!.startDate).toEqual(MOCK_START_DATE);
      expect(result!.selectedDateRange!.endDate).toEqual(MOCK_END_DATE);
    });

    it("should return empty filters object when stored filters have no values", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));

      const result = service.loadFilters(MOCK_USERNAME);

      expect(result).not.toBeNull();
      expect(Object.keys(result!)).toHaveLength(0);
    });

    it("should handle date range with invalid dates", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedDateRange: {
            startDate: "not-a-date",
            endDate: null,
          },
        })
      );

      const result = service.loadFilters(MOCK_USERNAME);

      expect(result).not.toBeNull();
      expect(result!.selectedDateRange).toBeUndefined();
    });

    it("should isolate filters between different users", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: MOCK_SEARCH_KEY,
        selectedProjects: [],
        selectedPriority: null,
        selectedAssignees: MOCK_ASSIGNEES,
        selectedCategories: [],
        selectedDateRange: null,
        selectedObjectIds: [],
        sortBy: null,
      };
      service.saveFilters(filters, MOCK_USERNAME);

      const otherUserResult = service.loadFilters("other-user");
      const sameUserResult = service.loadFilters(MOCK_USERNAME);

      expect(otherUserResult).toBeNull();
      expect(sameUserResult).not.toBeNull();
      expect(sameUserResult!.searchKey).toBe(MOCK_SEARCH_KEY);
    });
  });

  describe("clearFilters", () => {
    it("should remove stored filters from localStorage", () => {
      const filters: WorkItemBoardUrlFilters = {
        searchKey: MOCK_SEARCH_KEY,
        selectedProjects: [],
        selectedPriority: null,
        selectedAssignees: [],
        selectedCategories: [],
        selectedDateRange: null,
        selectedObjectIds: [],
        sortBy: null,
      };
      service.saveFilters(filters, MOCK_USERNAME);

      service.clearFilters(MOCK_USERNAME);

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("should not throw when no stored filters exist", () => {
      expect(() => service.clearFilters(MOCK_USERNAME)).not.toThrow();
    });
  });
});
