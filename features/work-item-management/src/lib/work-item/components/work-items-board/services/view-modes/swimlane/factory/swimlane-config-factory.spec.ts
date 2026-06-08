import { SwimlaneConfigFactory } from "./swimlane-config-factory";
import { WorkItemDueDateRange } from "../../../../model/work-item-due-date-range.enum";
import { WorkItemSwimlaneGroupBy } from "../../../../model/work-item-swimlane-group-by.enum";
import { WorkItemPriority } from "../../../../../../model/work-item";

describe("SwimlaneConfigFactory", () => {
  describe("createDueDateSwimlanes", () => {
    it("should create 4 due date swimlanes", () => {
      const swimlanes = SwimlaneConfigFactory.createDueDateSwimlanes();

      expect(swimlanes).toHaveLength(4);
    });

    it("should create TODAY swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createDueDateSwimlanes();
      const today = swimlanes[0];

      expect(today.id).toBe("today");
      expect(today.title).toBe("Due Today");
      expect(today.groupBy).toBe(WorkItemSwimlaneGroupBy.DUE_DATE);
      expect(today.value).toBe(WorkItemDueDateRange.TODAY);
      expect(today.isCollapsed).toBe(false);
    });

    it("should create THIS_WEEK swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createDueDateSwimlanes();
      const thisWeek = swimlanes[1];

      expect(thisWeek.id).toBe("this-week");
      expect(thisWeek.title).toBe("Due in a Week");
      expect(thisWeek.groupBy).toBe(WorkItemSwimlaneGroupBy.DUE_DATE);
      expect(thisWeek.value).toBe(WorkItemDueDateRange.THIS_WEEK);
      expect(thisWeek.isCollapsed).toBe(false);
    });

    it("should create THIS_MONTH swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createDueDateSwimlanes();
      const thisMonth = swimlanes[2];

      expect(thisMonth.id).toBe("this-month");
      expect(thisMonth.title).toBe("Due in a Month");
      expect(thisMonth.groupBy).toBe(WorkItemSwimlaneGroupBy.DUE_DATE);
      expect(thisMonth.value).toBe(WorkItemDueDateRange.THIS_MONTH);
      expect(thisMonth.isCollapsed).toBe(false);
    });

    it("should create LATER swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createDueDateSwimlanes();
      const later = swimlanes[3];

      expect(later.id).toBe("later");
      expect(later.title).toBe("Due Later");
      expect(later.groupBy).toBe(WorkItemSwimlaneGroupBy.DUE_DATE);
      expect(later.value).toBe(WorkItemDueDateRange.LATER);
      expect(later.isCollapsed).toBe(false);
    });
  });

  describe("createPrioritySwimlanes", () => {
    it("should create 3 priority swimlanes", () => {
      const swimlanes = SwimlaneConfigFactory.createPrioritySwimlanes();

      expect(swimlanes).toHaveLength(3);
    });

    it("should create HIGH priority swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createPrioritySwimlanes();
      const high = swimlanes[0];

      expect(high.id).toBe("high");
      expect(high.title).toBe("High Priority");
      expect(high.groupBy).toBe(WorkItemSwimlaneGroupBy.PRIORITY);
      expect(high.value).toBe(WorkItemPriority.HIGH);
      expect(high.isCollapsed).toBe(false);
    });

    it("should create MEDIUM priority swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createPrioritySwimlanes();
      const medium = swimlanes[1];

      expect(medium.id).toBe("medium");
      expect(medium.title).toBe("Medium Priority");
      expect(medium.groupBy).toBe(WorkItemSwimlaneGroupBy.PRIORITY);
      expect(medium.value).toBe(WorkItemPriority.MEDIUM);
      expect(medium.isCollapsed).toBe(false);
    });

    it("should create LOW priority swimlane", () => {
      const swimlanes = SwimlaneConfigFactory.createPrioritySwimlanes();
      const low = swimlanes[2];

      expect(low.id).toBe("low");
      expect(low.title).toBe("Low Priority");
      expect(low.groupBy).toBe(WorkItemSwimlaneGroupBy.PRIORITY);
      expect(low.value).toBe(WorkItemPriority.LOW);
      expect(low.isCollapsed).toBe(false);
    });
  });

  describe("createCategorySwimlanes", () => {
    it("should create swimlanes from categories", () => {
      const categories = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
      ];

      const swimlanes =
        SwimlaneConfigFactory.createCategorySwimlanes(categories);

      expect(swimlanes).toHaveLength(2);
    });

    it("should create swimlane with correct properties", () => {
      const categories = [{ label: "Bug", value: "bug" }];

      const swimlanes =
        SwimlaneConfigFactory.createCategorySwimlanes(categories);
      const bug = swimlanes[0];

      expect(bug.id).toBe("bug");
      expect(bug.title).toBe("Bug");
      expect(bug.groupBy).toBe(WorkItemSwimlaneGroupBy.CATEGORY);
      expect(bug.value).toBe("bug");
      expect(bug.isCollapsed).toBe(false);
    });

    it("should handle empty categories", () => {
      const swimlanes = SwimlaneConfigFactory.createCategorySwimlanes([]);

      expect(swimlanes).toHaveLength(0);
    });

    it("should create multiple category swimlanes", () => {
      const categories = [
        { label: "Bug", value: "bug" },
        { label: "Feature", value: "feature" },
        { label: "Enhancement", value: "enhancement" },
      ];

      const swimlanes =
        SwimlaneConfigFactory.createCategorySwimlanes(categories);

      expect(swimlanes).toHaveLength(3);
      expect(swimlanes[0].id).toBe("bug");
      expect(swimlanes[1].id).toBe("feature");
      expect(swimlanes[2].id).toBe("enhancement");
    });
  });
});
