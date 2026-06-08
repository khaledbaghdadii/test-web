import { Pipe, PipeTransform } from "@angular/core";
import { ScenarioExecution } from "../../../scenario-execution";
import { ScenarioAnalysisStatus } from "../../../scenario-analysis-status/scenario-analysis-status";

@Pipe({
  name: "showComment",
  standalone: false,
})
export class ShowCommentPipe implements PipeTransform {
  transform(scenarioExecution: ScenarioExecution): boolean {
    return (
      this.executionAnalysisFailed(scenarioExecution) ||
      this.executionAnalysisCancelled(scenarioExecution) ||
      scenarioExecution.isFailed
    );
  }

  private executionAnalysisFailed(
    scenarioExecution: ScenarioExecution
  ): boolean {
    return scenarioExecution.analysisStatus == ScenarioAnalysisStatus.FAILED;
  }

  private executionAnalysisCancelled(
    scenarioExecution: ScenarioExecution
  ): boolean {
    return scenarioExecution.analysisStatus == ScenarioAnalysisStatus.CANCELLED;
  }
}
