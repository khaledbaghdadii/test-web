import { Component, EventEmitter, Input, Output } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { WorkItemPriority } from "../../../../model/work-item";

@Component({
  selector: "mxevolve-work-item-priority-filter",
  imports: [FormsModule, SelectModule],
  templateUrl: "./work-item-priority-filter.component.html",
})
export class WorkItemPriorityFilterComponent {
  @Input() workItemPriority: WorkItemPriority | null = null;
  @Input() disabled: boolean = false;

  @Output() workItemPriorityChange =
    new EventEmitter<WorkItemPriority | null>();

  get priorityOptions() {
    return [
      { label: "High", value: WorkItemPriority.HIGH },
      { label: "Medium", value: WorkItemPriority.MEDIUM },
      { label: "Low", value: WorkItemPriority.LOW },
    ];
  }

  onPriorityChange(priority: WorkItemPriority | null): void {
    this.workItemPriorityChange.emit(priority);
  }
}
