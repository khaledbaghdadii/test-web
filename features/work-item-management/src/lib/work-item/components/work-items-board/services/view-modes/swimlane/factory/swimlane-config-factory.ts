import { WorkItemDueDateRange } from "../../../../model/work-item-due-date-range.enum";
import { WorkItemSwimlaneGroupBy } from "../../../../model/work-item-swimlane-group-by.enum";
import { WorkItemSwimlaneConfig } from "../../../../model/work-item-swimlane-config.model";
import { WorkItemPriority } from "../../../../../../model/work-item";

export interface DueDateSwimlaneDefinition {
  id: string;
  title: string;
  range: WorkItemDueDateRange;
}

export class SwimlaneConfigFactory {
  private static readonly DUE_DATE_SWIMLANES: DueDateSwimlaneDefinition[] = [
    {
      id: "today",
      title: "Due Today",
      range: WorkItemDueDateRange.TODAY,
    },
    {
      id: "this-week",
      title: "Due in a Week",
      range: WorkItemDueDateRange.THIS_WEEK,
    },
    {
      id: "this-month",
      title: "Due in a Month",
      range: WorkItemDueDateRange.THIS_MONTH,
    },
    {
      id: "later",
      title: "Due Later",
      range: WorkItemDueDateRange.LATER,
    },
  ];

  private static readonly PRIORITY_SWIMLANES = [
    {
      id: "high",
      title: "High Priority",
      priority: WorkItemPriority.HIGH,
    },
    {
      id: "medium",
      title: "Medium Priority",
      priority: WorkItemPriority.MEDIUM,
    },
    {
      id: "low",
      title: "Low Priority",
      priority: WorkItemPriority.LOW,
    },
  ];

  static createDueDateSwimlanes(): WorkItemSwimlaneConfig[] {
    return this.DUE_DATE_SWIMLANES.map((def) => ({
      id: def.id,
      title: def.title,
      groupBy: WorkItemSwimlaneGroupBy.DUE_DATE,
      value: def.range,
      isCollapsed: false,
    }));
  }

  static createPrioritySwimlanes(): WorkItemSwimlaneConfig[] {
    return this.PRIORITY_SWIMLANES.map((def) => ({
      id: def.id,
      title: def.title,
      groupBy: WorkItemSwimlaneGroupBy.PRIORITY,
      value: def.priority,
      isCollapsed: false,
    }));
  }

  static createCategorySwimlanes(
    categories: Array<{ label: string; value: string }>
  ): WorkItemSwimlaneConfig[] {
    return categories.map((category) => ({
      id: category.value,
      title: category.label,
      groupBy: WorkItemSwimlaneGroupBy.CATEGORY,
      value: category.value,
      isCollapsed: false,
    }));
  }
}
