import { Component, Input } from "@angular/core";
import { ScenarioAnalysisStatus } from "./scenario-analysis-status";
import { TagModule } from "primeng/tag";

@Component({
  imports: [TagModule],
  selector: "mxevolve-scenario-analysis-status",
  templateUrl: "./scenario-analysis-status.component.html",
})
export class ScenarioAnalysisStatusComponent {
  ScenarioAnalysisStatus = ScenarioAnalysisStatus;
  @Input() status: ScenarioAnalysisStatus;
}
