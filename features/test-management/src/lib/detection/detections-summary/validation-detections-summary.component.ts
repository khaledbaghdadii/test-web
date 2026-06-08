import { Component, Input } from "@angular/core";
import { TooltipModule } from "primeng/tooltip";
import { DetectionsSummaryPipe } from "./detections-summary.pipe";

import { SkeletonModule } from "primeng/skeleton";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  faBug,
  faBullseye,
  faDumpsterFire,
} from "@fortawesome/free-solid-svg-icons";
import { ScenarioDetections } from "../../execution/scenario-execution/scenario-execution";

@Component({
  imports: [
    DetectionsSummaryPipe,
    TooltipModule,
    SkeletonModule,
    FontAwesomeModule,
  ],
  selector: "mxevolve-validation-detections-summary",
  templateUrl: "./validation-detections-summary.component.html",
})
export class ValidationDetectionsSummaryComponent {
  bugIcon = faBug;
  bullseyeIcon = faBullseye;
  dumpsterFireIcon = faDumpsterFire;
  @Input() scenarioDetections: ScenarioDetections;
  @Input() isLoading: boolean;
}
