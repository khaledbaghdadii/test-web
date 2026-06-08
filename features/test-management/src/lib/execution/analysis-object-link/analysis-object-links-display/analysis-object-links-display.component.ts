import { Component, Input } from "@angular/core";

import { LinkedDetectionData } from "../../test-case-execution/test-case-execution-with-linked-analysis-objects";
import {
  DetectionCategory,
  DetectionUriBuilderPipe,
} from "@mxflow/features/failure-management";
import { RouterLink } from "@angular/router";

@Component({
  selector: "mxevolve-analysis-object-links-display",
  imports: [DetectionUriBuilderPipe, RouterLink],
  templateUrl: "./analysis-object-links-display.component.html",
})
export class AnalysisObjectLinksDisplayComponent {
  @Input() linkedDetectionsData: LinkedDetectionData[] = [];
  @Input({ required: true }) detectionCategory: DetectionCategory;

  protected readonly DetectionCategory = DetectionCategory;
}
