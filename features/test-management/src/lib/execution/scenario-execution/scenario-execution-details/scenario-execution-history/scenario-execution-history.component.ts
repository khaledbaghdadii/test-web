import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
} from "@angular/core";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { TestUnitScenarioExecutionModel } from "../../../test-unit/test-unit.model";

@Component({
  selector: "mxevolve-scenario-execution-history",
  templateUrl: "./scenario-execution-history.component.html",
  standalone: false,
})
export class ScenarioExecutionHistoryComponent {
  stateService = inject(ScenarioExecutionStateManagementService);
  selectedScenarioExecutionId = this.stateService.scenarioExecutionId;
  testUnit = this.stateService.testUnit;
  testUnitScenarioExecutions = computed<TestUnitScenarioExecutionModel[]>(
    () => {
      return this.testUnit()?.scenarioExecutions ?? [];
    }
  );

  @Input() assignee = "-";
  @Output() keptExecutionToggled = new EventEmitter<string>();

  isTargetExecution(scenarioExecution: TestUnitScenarioExecutionModel) {
    return scenarioExecution.id == this.selectedScenarioExecutionId();
  }

  toggleKeptExecutionFlag(id: string) {
    this.keptExecutionToggled.emit(id);
  }

  protected readonly Array = Array;
}
