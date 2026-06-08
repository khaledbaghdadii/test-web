import { Component, Input } from "@angular/core";
import { BusinessProcessExecutionStatus } from "@mxflow/features/business-process";
import { CommonModule } from "@angular/common";
import { TagModule } from "primeng/tag";

@Component({
  imports: [CommonModule, TagModule],
  selector: "app-business-process-execution-status",
  templateUrl: "business-process-execution-status.component.html",
})
export class BusinessProcessExecutionStatusComponent {
  @Input() status: BusinessProcessExecutionStatus;
  businessProcessExecutionStatus = BusinessProcessExecutionStatus;
}
