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
  @Input({ required: true }) projectId: string;
  @Output() keepExecutionToggled = new EventEmitter<string>();

  isTargetExecution(scenarioExecution: TestUnitScenarioExecutionModel) {
    return scenarioExecution.id == this.selectedScenarioExecutionId();
  }

  toggleKeepExecutionFlag(id: string) {
    this.keepExecutionToggled.emit(id);
  }

  protected readonly Array = Array;

  protected refreshSelectedScenarioExecution() {
    this.stateService.refreshSelectedScenarioExecution$().subscribe();
  }
}
