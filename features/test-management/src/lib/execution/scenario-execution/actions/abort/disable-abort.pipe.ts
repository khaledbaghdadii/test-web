import { Pipe, PipeTransform } from "@angular/core";
import { ScenarioExecutionStatus } from "../../scenario-execution-status/scenario-execution-status";

@Pipe({
  name: "disableAbort",
})
export class DisableAbortPipe implements PipeTransform {
  transform(scenarioExecutionStatus: ScenarioExecutionStatus): boolean {
    return scenarioExecutionStatus !== ScenarioExecutionStatus.UNDERWAY;
  }
}
