import { Component, computed, input } from "@angular/core";

import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";
import { TestUnitScenarioExecutionModel } from "../../test-unit/test-unit.model";

@Component({
  imports: [BadgeModule, TooltipModule],
  selector: "mxevolve-scenario-execution-summary",
  templateUrl: "./scenario-execution-summary.component.html",
})
export class ScenarioExecutionSummaryComponent {
  scenarioExecutions = input<TestUnitScenarioExecutionModel[]>([]);

  numberOfUnderwayExecutions = computed(() =>
    this.getNumberOfUnderwayExecutions(this.scenarioExecutions())
  );

  numberOfPassedExecutions = computed(() =>
    this.getNumberOfPassedExecutions(this.scenarioExecutions())
  );

  numberOfFailedExecutions = computed(() =>
    this.getNumberOfFailedExecutions(this.scenarioExecutions())
  );

  passedExecutionsTooltip = computed(() =>
    this.getMessage(this.numberOfPassedExecutions(), "Passed")
  );

  underwayExecutionsTooltip = computed(() =>
    this.getMessage(this.numberOfUnderwayExecutions(), "Underway")
  );

  failedExecutionsTooltip = computed(() =>
    this.getMessage(this.numberOfFailedExecutions(), "Failed")
  );

  private getNumberOfPassedExecutions(
    scenarioExecutions: TestUnitScenarioExecutionModel[]
  ): number {
    return scenarioExecutions.filter(
      (scenarioExecution) =>
        scenarioExecution.isFinished && !scenarioExecution.isFailed
    ).length;
  }

  private getNumberOfUnderwayExecutions(
    scenarioExecutions: TestUnitScenarioExecutionModel[]
  ): number {
    return scenarioExecutions.filter(
      (scenarioExecution) => !scenarioExecution.isFinished
    ).length;
  }

  private getNumberOfFailedExecutions(
    scenarioExecutions: TestUnitScenarioExecutionModel[]
  ): number {
    return scenarioExecutions.filter(
      (scenarioExecution) => scenarioExecution.isFailed
    ).length;
  }

  private getMessage(numberOfExecutions: number, label: string) {
    return numberOfExecutions == 1
      ? `${numberOfExecutions} ${label} Execution`
      : `${numberOfExecutions} ${label} Executions`;
  }
}
