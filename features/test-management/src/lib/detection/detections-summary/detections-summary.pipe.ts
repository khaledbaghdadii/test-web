import { Pipe, PipeTransform } from "@angular/core";
import { DetectionsSummary } from "./detections-summary.model";
import { ScenarioDetections } from "../../execution/scenario-execution/scenario-execution";

@Pipe({
  name: "detectionsSummary",
  standalone: true,
})
export class DetectionsSummaryPipe implements PipeTransform {
  transform(scenarioDetections: ScenarioDetections): DetectionsSummary {
    return {
      impactCount:
        scenarioDetections.binaryImpactIds.length +
        scenarioDetections.configurationImpactIds.length,
      regressionCount:
        scenarioDetections.binaryRegressionIds.length +
        scenarioDetections.configurationRegressionIds.length,
      failureReasonCount: scenarioDetections.failureReasonIds.length,
    };
  }
}
