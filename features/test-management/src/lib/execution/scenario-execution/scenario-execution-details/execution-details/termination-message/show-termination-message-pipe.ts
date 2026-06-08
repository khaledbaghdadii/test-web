import { Pipe, PipeTransform } from "@angular/core";
import { ScenarioExecution } from "../../../scenario-execution";

@Pipe({
  name: "showTerminationMessage",
})
export class ShowTerminationMessagePipe implements PipeTransform {
  transform(scenarioExecution: ScenarioExecution): boolean {
    return scenarioExecution.isFailed;
  }
}
