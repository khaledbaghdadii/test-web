import { Component, Input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  ScenarioExecutionHousekeepingStatus,
  ScenarioExecutionHousekeepingStatusDisplayValue,
} from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-scenario-execution-housekeeping-status",
  imports: [TagModule, MxevolveIconComponent],
  templateUrl: "./scenario-execution-housekeeping-status.component.html",
})
export class ScenarioExecutionHousekeepingStatusComponent {
  @Input() status: ScenarioExecutionHousekeepingStatus;
  protected readonly ScenarioExecutionHousekeepingStatus =
    ScenarioExecutionHousekeepingStatus;
  protected readonly displayValue =
    ScenarioExecutionHousekeepingStatusDisplayValue;
}
