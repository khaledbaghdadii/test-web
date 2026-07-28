import { Pipe, PipeTransform } from "@angular/core";
import { CheckKeepExecutionDisabledRequest } from "./check-keep-execution-disabled-request";

@Pipe({
  name: "keepExecutionDisabled",
  standalone: true,
})
export class KeepExecutionDisabledPipe implements PipeTransform {
  transform(
    checkKeepExecutionDisabledRequest: CheckKeepExecutionDisabledRequest
  ): boolean {
    return (
      checkKeepExecutionDisabledRequest.disableKeepExecution ||
      !checkKeepExecutionDisabledRequest.isTestUnitHead ||
      checkKeepExecutionDisabledRequest.scenarioExecutionCleaningStatus !==
        "NOT_LAUNCHED" ||
      !checkKeepExecutionDisabledRequest.isScenarioExecutionFailed
    );
  }
}
