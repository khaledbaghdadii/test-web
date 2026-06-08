import { Component, EventEmitter, Input, Output } from "@angular/core";

import { BusinessProcessAlertDisplayComponent } from "../business-process-alert-display/business-process-alert-display-component";
import { BusinessProcessExecutionAbortButtonComponent } from "../business-process-execution-abort/business-process-execution-abort-button.component";
import { BusinessProcessExecutionStatusComponent } from "../business-process-execution-status/business-process-execution-status.component";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { Stage, StatusBarComponent } from "@mxflow/ui/horizontal-timeline";
import { BusinessProcessFamilies } from "../business-process-definition/business-process-family";
import { FormatDatePipeModule } from "@mxflow/pipe";
import { ExpiryDateTagComponent } from "../expiry-date-tag/expiry-date-tag.component";
import { BusinessProcessExecutionStatus } from "../business-process-execution-status/business-process-execution-status";

@Component({
  selector: "mxevolve-business-process-execution-progress",
  imports: [
    BusinessProcessAlertDisplayComponent,
    BusinessProcessExecutionAbortButtonComponent,
    BusinessProcessExecutionStatusComponent,
    CardContainerModule,
    HeaderTitleModule,
    StatusBarComponent,
    FormatDatePipeModule,
    ExpiryDateTagComponent,
  ],
  templateUrl: "./business-process-execution-progress.component.html",
})
export class BusinessProcessExecutionProgressComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) processId: string;
  @Input({ required: true }) businessProcessExecutionName: string | undefined;
  @Input({ required: true }) familyId: BusinessProcessFamilies;
  @Input({ required: true }) expiryDate: string;
  @Input({ required: true }) endDate: string;
  @Input({ required: true }) isAborted: boolean;
  @Input({ required: true }) notStarted: boolean;
  @Input({ required: true }) executionStages: Stage[];
  @Input({ required: true }) selectedStage: Stage;
  @Input({ required: true }) errorMessage: string | undefined;
  @Input({ required: true }) status: BusinessProcessExecutionStatus | undefined;

  @Output() businessProcessAborted = new EventEmitter<void>();
  @Output() selectStage = new EventEmitter<string>();

  get isActive(): boolean {
    return !this.notStarted && !this.endDate;
  }
}
