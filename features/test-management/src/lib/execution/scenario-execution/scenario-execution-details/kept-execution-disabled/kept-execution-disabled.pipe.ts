import { Pipe, PipeTransform } from "@angular/core";
import { CheckKeptExecutionDisabledRequest } from "./check-kept-execution-disabled-request";

@Pipe({
  name: "keptExecutionDisabled",
  standalone: true,
})
export class KeptExecutionDisabledPipe implements PipeTransform {
  transform(
    checkKeptExecutionDisabledRequest: CheckKeptExecutionDisabledRequest
  ): boolean {
    return (
      checkKeptExecutionDisabledRequest.disableKeepExecution ||
      checkKeptExecutionDisabledRequest.scenarioExecutionCleaningStatus !==
        "NOT_LAUNCHED" ||
      !checkKeptExecutionDisabledRequest.isScenarioExecutionFailed
    );
  }
}
