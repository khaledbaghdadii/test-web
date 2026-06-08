import { Component, EventEmitter, Input, Output } from "@angular/core";

import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { RouterModule } from "@angular/router";
import {
  DetectionUriBuilderPipe,
  LiteConfigurationRegression,
  DetectionCategory,
  DetectionType,
} from "@mxflow/features/failure-management";

@Component({
  selector: "mxevolve-linked-configuration-regression-details-table",
  templateUrl: "./linked-configuration-regression-details-table.component.html",
  imports: [
    TableModule,
    ButtonModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    TooltipModule,
    RouterModule,
    DetectionUriBuilderPipe,
  ],
})
export class LinkedConfigurationRegressionDetailsTableComponent {
  @Input() regressions: LiteConfigurationRegression[];
  @Output() unlinkRegressionRequestEvent = new EventEmitter<string>();
  @Input({ required: true }) isLoading: boolean;

  onUnlink(id: string) {
    this.unlinkRegressionRequestEvent.emit(id);
  }

  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
}
