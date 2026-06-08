import { Component, EventEmitter, Input, Output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";

import { TooltipModule } from "primeng/tooltip";
import {
  DetectionUriBuilderPipe,
  LiteConfigurationImpact,
  DetectionCategory,
  DetectionType,
} from "@mxflow/features/failure-management";

@Component({
  selector: "mxevolve-linked-configuration-impact-details-table",
  templateUrl: "./linked-configuration-impact-details-table.component.html",
  imports: [
    TableModule,
    SkeletonModule,
    RouterModule,
    ButtonModule,
    TableEmptyMessageComponent,
    TooltipModule,
    DetectionUriBuilderPipe,
  ],
})
export class LinkedConfigurationImpactDetailsTableComponent {
  @Input() configurationImpacts: LiteConfigurationImpact[];
  @Input({ required: true }) isLoading: boolean;
  @Output() unlinkImpactRequestEvent = new EventEmitter<string>();

  handleUnlink(id: string) {
    this.unlinkImpactRequestEvent.emit(id);
  }

  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
}
