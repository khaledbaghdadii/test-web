import { Injectable, inject } from "@angular/core";
import { AnalysisObjectLinkingStateService } from "./analysis-object-linking-state-service";
import { BinaryImpactLinkingStateService } from "./binary-impact-linking-state.service";
import { BinaryRegressionLinkingStateService } from "./binary-regression-linking-state.service";
import { ConfigurationRegressionLinkingStateService } from "./configuration-regression-linking-state.service";
import { IncidentLinkingStateService } from "./incident-linking-state.service";
import { ConfigurationImpactLinkingStateService } from "./configuration-impact-linking-state.service";
import { AnalysisObjectType } from "../analysis-object-type";
import { FailureReasonLinkingStateService } from "./failure-reason-linking-state.service";

@Injectable({
  providedIn: "root",
})
export class AnalysisObjectLinkingStateFactoryService {
  private binaryImpactLinkingStateService = inject(
    BinaryImpactLinkingStateService
  );
  private binaryRegressionLinkingStateService = inject(
    BinaryRegressionLinkingStateService
  );
  private configurationRegressionLinkingStateService = inject(
    ConfigurationRegressionLinkingStateService
  );
  private configurationImpactLinkingStateService = inject(
    ConfigurationImpactLinkingStateService
  );
  private incidentLinkingStateService = inject(IncidentLinkingStateService);
  private failureReasonLinkingStateService = inject(
    FailureReasonLinkingStateService
  );

  getAnalysisObjectLinkingStateService(
    analysisObjectType: string
  ): AnalysisObjectLinkingStateService {
    switch (analysisObjectType) {
      case AnalysisObjectType.BINARY_IMPACT:
        return this.binaryImpactLinkingStateService;
      case AnalysisObjectType.BINARY_REGRESSION:
        return this.binaryRegressionLinkingStateService;
      case AnalysisObjectType.CONFIGURATION_REGRESSION:
        return this.configurationRegressionLinkingStateService;
      case AnalysisObjectType.CONFIGURATION_IMPACT:
        return this.configurationImpactLinkingStateService;
      case AnalysisObjectType.INCIDENT:
        return this.incidentLinkingStateService;
      case AnalysisObjectType.FAILURE_REASON:
        return this.failureReasonLinkingStateService;
      default:
        throw new Error(
          `No linking state service found for analysis object type: ${analysisObjectType}`
        );
    }
  }
}
