import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FormatLabelPipe } from "@mxflow/pipe";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";
import { TagModule } from "primeng/tag";
import { WorkItem } from "@mxflow/features/work-item-management";
import {
  FaIconComponent,
  IconDefinition,
} from "@fortawesome/angular-fontawesome";
import {
  faCircleHalfStroke,
  faCodeMerge,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";

@Component({
  standalone: true,
  imports: [
    AvatarModule,
    TagModule,
    TooltipModule,
    FormatLabelPipe,
    FaIconComponent,
  ],
  selector: "mxevolve-work-item-category-icon",
  styleUrls: ["./work-item-catgory-icon.component.scss"],
  templateUrl: "./work-item-category-icon.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class WorkItemCategoryIconComponent {
  @Input({ required: true }) workItem: WorkItem;

  getCategoryIcon(): IconDefinition {
    switch (this.workItem.workItemCategory) {
      case "merge_request_review":
        return faCodeMerge;
      case "business_process":
        return faCircleHalfStroke;
      case "test_execution_failure":
        return faCircleXmark;
      default:
        return faQuestion;
    }
  }

  getCategorySeverity(): "info" | "warn" | "danger" | null | undefined {
    switch (this.workItem.workItemCategory) {
      case "merge_request_review":
        return "warn";
      case "business_process":
        return "warn";
      case "test_execution_failure":
        return "danger";
      default:
        return "info";
    }
  }
}
