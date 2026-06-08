import { WorkItem } from "../model/work-item";

export class WorkItemTimeUtilitiesService {
  static getElapsedTimePercentage(workItem: WorkItem): number {
    const { createdOn, dueDate } = workItem;
    if (!dueDate) {
      return 0;
    }
    const created = new Date(createdOn).getTime();
    const due = new Date(dueDate).getTime();
    const current = Date.now();
    if (created > due || current > due) {
      return 100;
    }
    const total = due - created;
    const elapsed = Math.max(0, current - created);
    return total > 0 ? Math.round((elapsed / total) * 100) : 0;
  }
}
