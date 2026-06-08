import { Component, EventEmitter, Input, Output } from "@angular/core";

import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { RouterModule } from "@angular/router";
import {
  DetectionUriBuilderPipe,
  LiteBinaryRegression,
  DetectionCategory,
  DetectionType,
  HiddenDetectionCreationDetailComponent,
} from "@mxflow/features/failure-management";

@Component({
  selector: "mxevolve-linked-binary-regression-details-table",
  templateUrl: "./linked-binary-regression-details-table.component.html",
  imports: [
    TableModule,
    ButtonModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    TooltipModule,
    RouterModule,
    HiddenDetectionCreationDetailComponent,
    DetectionUriBuilderPipe,
  ],
})
export class LinkedBinaryRegressionDetailsTableComponent {
  @Input() regressions: LiteBinaryRegression[];
  @Output() unlinkRegressionRequestEvent = new EventEmitter<string>();
  @Input({ required: true }) isLoading: boolean;

  onUnlink(id: string) {
    this.unlinkRegressionRequestEvent.emit(id);
  }

  protected readonly Array = Array;
  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
}
