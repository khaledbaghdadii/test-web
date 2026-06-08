import { Component, Input } from "@angular/core";

import { TooltipModule } from "primeng/tooltip";
import { DetectionsSummaryPipe } from "./detections-summary.pipe";
import {
  faBug,
  faBullseye,
  faDumpsterFire,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ScenarioDetections } from "../../execution/scenario-execution/scenario-execution";

@Component({
  selector: "mxevolve-detections-summary",
  imports: [DetectionsSummaryPipe, TooltipModule, FontAwesomeModule],
  templateUrl: "./detections-summary.component.html",
})
export class DetectionsSummaryComponent {
  bugIcon = faBug;
  bullseyeIcon = faBullseye;
  dumpsterFireIcon = faDumpsterFire;
  @Input() scenarioDetections: ScenarioDetections;
}
