import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScenarioExecutionService } from "./scenario-execution.service";
import { TestExecutionStatusComponent } from "./test-result-status/test-execution-status.component";

@NgModule({
  providers: [ScenarioExecutionService],
  imports: [CommonModule, TestExecutionStatusComponent],
})
export class ScenarioExecutionsModule {}
