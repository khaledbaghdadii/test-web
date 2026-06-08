import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TableModule } from "primeng/table";
import { FormsModule } from "@angular/forms";

import { SkeletonModule } from "primeng/skeleton";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { FailureReason } from "../failure-reason";
import { ToggleSwitchModule } from "primeng/toggleswitch";

@Component({
  selector: "mxevolve-failure-reasons-table",
  templateUrl: "./failure-reasons-table.component.html",
  styleUrls: ["./failure-reasons-table.component.scss"],
  imports: [
    TableModule,
    FormsModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    ProgressSpinnerModule,
    ToggleSwitchModule,
  ],
})
export class FailureReasonsTableComponent {
  @Input() failureReasons: FailureReasonTableData[] = [];
  @Input() isLoading = false;
  @Output() switchEnabledValue = new EventEmitter<SwitchEnabledRequest>();
}

export interface SwitchEnabledRequest {
  reasonId: string;
  newValue: boolean;
}

export interface FailureReasonTableData extends FailureReason {
  isDisabled: boolean;
  isLoading: boolean;
}
