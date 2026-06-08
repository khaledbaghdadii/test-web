import { Component, EventEmitter, Input, Output } from "@angular/core";

import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { RouterModule } from "@angular/router";
import { FailureReason } from "../failure-reason";

@Component({
  selector: "mxevolve-failure-reason-details-table",
  templateUrl: "./failure-reason-details-table.component.html",
  imports: [
    TableModule,
    ButtonModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    TooltipModule,
    RouterModule,
  ],
})
export class FailureReasonDetailsTableComponent {
  @Input() reasons: FailureReason[];
  @Output() unlinkFailureReasonRequestEvent = new EventEmitter<string>();
  @Input({ required: true }) isLoading: boolean;

  onUnlink(id: string) {
    this.unlinkFailureReasonRequestEvent.emit(id);
  }
}
