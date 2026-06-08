import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { SharedModule } from "primeng/api";
import { SkeletonModule } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import {
  DetectionUriBuilderPipe,
  LiteBinaryImpact,
  DetectionCategory,
  DetectionType,
} from "@mxflow/features/failure-management";

@Component({
  selector: "mxevolve-linked-binary-impact-details-table",
  imports: [
    ButtonModule,
    RouterLink,
    SharedModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    TableModule,
    TooltipModule,
    DetectionUriBuilderPipe,
  ],
  templateUrl: "./linked-binary-impact-details-table.component.html",
})
export class LinkedBinaryImpactDetailsTableComponent {
  @Input({ required: true }) binaryImpacts: LiteBinaryImpact[];
  @Input({ required: true }) isLoading: boolean;
  @Output() unlinkImpactRequestEvent = new EventEmitter<string>();

  handleUnlink(id: string) {
    this.unlinkImpactRequestEvent.emit(id);
  }

  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
  protected readonly Array = Array;
}
