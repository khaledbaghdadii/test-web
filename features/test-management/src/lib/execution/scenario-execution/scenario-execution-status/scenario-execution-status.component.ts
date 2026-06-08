import { Component, Input } from "@angular/core";

import { ScenarioExecutionStatus } from "./scenario-execution-status";
import { TagModule } from "primeng/tag";

@Component({
  imports: [TagModule],
  selector: "mxevolve-scenario-execution-status",
  templateUrl: "./scenario-execution-status.component.html",
})
export class ScenarioExecutionStatusComponent {
  @Input() status: ScenarioExecutionStatus;
  protected readonly ScenarioExecutionStatus = ScenarioExecutionStatus;
}
