import { Pipe, PipeTransform } from "@angular/core";
import { AnalysisObjectType } from "../analysis-object-type";

@Pipe({
  name: "analysisObjectTypeDisplay",
  standalone: true,
})
export class AnalysisObjectTypeDisplayPipe implements PipeTransform {
  transform(analysisObjectType: AnalysisObjectType): string {
    switch (analysisObjectType) {
      case AnalysisObjectType.BINARY_IMPACT:
        return "Binary Impact";
      case AnalysisObjectType.BINARY_REGRESSION:
        return "Binary Regression";
      case AnalysisObjectType.CONFIGURATION_IMPACT:
        return "Configuration Impact";
      case AnalysisObjectType.CONFIGURATION_REGRESSION:
        return "Configuration Regression";
      case AnalysisObjectType.FAILURE_REASON:
        return "Reason of Failure";
      case AnalysisObjectType.INCIDENT:
        return "Incident";
      default:
        throw new Error("Analysis object type not supported");
    }
  }
}
