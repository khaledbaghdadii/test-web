import {
  WorkItemPriority,
  WorkItem,
} from "libs/features/work-item-management/src/lib/work-item/model/work-item";
import { WorkItemBoardFilter } from "../../../../model/work-item-board-filter.model";
import { WorkItemDueDateRange } from "../../../../model/work-item-due-date-range.enum";
import {
  PrioritySwimlaneStrategy,
  CategorySwimlaneStrategy,
  DueDateSwimlaneStrategy,
} from "./swimlane-match-strategies";

describe("Swimlane Match Strategies", () => {
  describe("PrioritySwimlaneStrategy", () => {
    let strategy: PrioritySwimlaneStrategy;

    beforeEach(() => {
      strategy = new PrioritySwimlaneStrategy();
    });

    describe("matches", () => {
      it("should return true when work item priority matches swimlane value", () => {
        const workItem = {
          workItemPriority: WorkItemPriority.HIGH,
        } as WorkItem;
        expect(strategy.matches(workItem, WorkItemPriority.HIGH)).toBe(true);
      });

      it("should return false when work item priority does not match swimlane value", () => {
        const workItem = {
          workItemPriority: WorkItemPriority.HIGH,
        } as WorkItem;
        expect(strategy.matches(workItem, WorkItemPriority.LOW)).toBe(false);
      });
    });

    describe("applyFilter", () => {
      it("should set workItemPriority filter", () => {
        const filters: WorkItemBoardFilter = {};
        strategy.applyFilter(filters, WorkItemPriority.HIGH);
        expect(filters.workItemPriority).toBe(WorkItemPriority.HIGH);
      });
    });
  });

  describe("CategorySwimlaneStrategy", () => {
    let strategy: CategorySwimlaneStrategy;

    beforeEach(() => {
      strategy = new CategorySwimlaneStrategy();
    });

    describe("matches", () => {
      it("should return true when work item category matches swimlane value", () => {
        const workItem = { workItemCategory: "bug" } as WorkItem;
        expect(strategy.matches(workItem, "bug")).toBe(true);
      });

      it("should return false when work item category does not match swimlane value", () => {
        const workItem = { workItemCategory: "bug" } as WorkItem;
        expect(strategy.matches(workItem, "feature")).toBe(false);
      });
    });

    describe("applyFilter", () => {
      it("should set workItemCategories filter as an array", () => {
        const filters: WorkItemBoardFilter = {};
        strategy.applyFilter(filters, "bug");
        expect(filters.workItemCategories).toEqual(["bug"]);
      });
    });
  });

  describe("DueDateSwimlaneStrategy", () => {
    let strategy: DueDateSwimlaneStrategy;
    let getMostRestrictiveStartDate: jest.Mock;
    let getMostRestrictiveEndDate: jest.Mock;

    beforeEach(() => {
      getMostRestrictiveStartDate = jest.fn(
        (base, swimlane) => swimlane || base
      );
      getMostRestrictiveEndDate = jest.fn((base, swimlane) => swimlane || base);
      strategy = new DueDateSwimlaneStrategy(
        getMostRestrictiveStartDate,
        getMostRestrictiveEndDate
      );
    });

    describe("matches", () => {
      it("should return false when work item has no due date", () => {
        const workItem = {} as WorkItem;
        expect(strategy.matches(workItem, WorkItemDueDateRange.TODAY)).toBe(
          false
        );
      });

      it("should return true when work item due date is within range", () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const workItem = {
          dueDate: today.toISOString(),
        } as unknown as WorkItem;
        expect(strategy.matches(workItem, WorkItemDueDateRange.TODAY)).toBe(
          true
        );
      });

      it("should return false when work item due date is before range start", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const workItem = {
          dueDate: yesterday.toISOString(),
        } as unknown as WorkItem;
        expect(strategy.matches(workItem, WorkItemDueDateRange.TODAY)).toBe(
          false
        );
      });

      it("should return false when work item due date is after range end", () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const workItem = {
          dueDate: tomorrow.toISOString(),
        } as unknown as WorkItem;
        expect(strategy.matches(workItem, WorkItemDueDateRange.TODAY)).toBe(
          false
        );
      });
    });

    describe("applyFilter", () => {
      it("should call date restriction methods with correct parameters", () => {
        const filters: WorkItemBoardFilter = {
          dueDateFrom: "2025-01-01",
          dueDateTo: "2025-12-31",
        };

        strategy.applyFilter(filters, WorkItemDueDateRange.TODAY);

        expect(getMostRestrictiveStartDate).toHaveBeenCalled();
        expect(getMostRestrictiveEndDate).toHaveBeenCalled();
      });

      it("should update filters with restricted date range", () => {
        getMostRestrictiveStartDate.mockReturnValue("2025-11-12");
        getMostRestrictiveEndDate.mockReturnValue("2025-11-12");

        const filters: WorkItemBoardFilter = {};
        strategy.applyFilter(filters, WorkItemDueDateRange.TODAY);

        expect(filters.dueDateFrom).toBe("2025-11-12");
        expect(filters.dueDateTo).toBe("2025-11-12");
      });
    });
  });
});
