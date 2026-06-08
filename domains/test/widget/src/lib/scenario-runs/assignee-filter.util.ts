import type { ScenarioRunsPanelViewModel } from "./scenario-runs-panel-facade.service";

export type AssigneeFilterValue =
  | "not-assigned"
  | "assigned-to-me"
  | "assigned-to-my-stream"
  | null;

export function panelPassesAssigneeFilter(
  panel: ScenarioRunsPanelViewModel,
  filterValue: AssigneeFilterValue,
  currentUserId: string,
  userStreamBpcIds: Set<string>
): boolean {
  if (!filterValue) return true;
  switch (filterValue) {
    case "not-assigned":
      return !panel.head.assigneeId;
    case "assigned-to-me":
      return panel.head.assigneeId === currentUserId;
    case "assigned-to-my-stream":
      return (panel.filterData.businessProcessChainIds ?? []).some((id) =>
        userStreamBpcIds.has(id)
      );
  }
}
