import { ScenarioAnalysisStatus } from "./scenario-analysis-status";

export interface AnalysisStatusEligibility {
  nextAnalysisStatuses: AnalysisStatusState[];
  isUpdateEligible: boolean;
  updateIneligibilityReason: AnalysisStatusUpdateIneligibilityReason;
}

export interface AnalysisStatusState {
  analysisStatus: ScenarioAnalysisStatus;
  isEligible: boolean;
  ineligibilityReason?: AnalysisStatusUpdateIneligibilityReason;
}

export enum AnalysisStatusUpdateIneligibilityReason {
  SCENARIO_EXECUTION_PASSED = "SCENARIO_EXECUTION_PASSED",
  SCENARIO_EXECUTION_UNDERWAY = "SCENARIO_EXECUTION_UNDERWAY",
  LOADING = "LOADING",
  SCENARIO_EXECUTION_NOT_FAILED = "SCENARIO_EXECUTION_NOT_FAILED",
  TRANSITION_NOT_POSSIBLE = "TRANSITION_NOT_POSSIBLE",
  SCENARIO_EXECUTION_NOT_ASSIGNED = "SCENARIO_EXECUTION_NOT_ASSIGNED",
  NO_FAILURE_REASONS_LINKED = "NO_FAILURE_REASONS_LINKED",
  NO_INCIDENT_LINKED = "NO_INCIDENT_LINKED",
  NO_REGRESSIONS_LINKED = "NO_REGRESSIONS_LINKED",
  NO_IMPACTS_LINKED = "NO_IMPACTS_LINKED",
  REGRESSIONS_LINKED = "REGRESSIONS_LINKED",
  DETECTION_OR_INCIDENT_LINKED = "DETECTION_OR_INCIDENT_LINKED",
  FAILURE_REASONS_LINKED = "FAILURE_REASONS_LINKED",
}

export const AnalysisStatusUpdateIneligibilityReasonDisplayMessage: Record<
  AnalysisStatusUpdateIneligibilityReason,
  string
> = {
  [AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED]:
    "The analysis status is automatically set to passed since the scenario execution passed",
  [AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_UNDERWAY]:
    "You cannot set the analysis status since the scenario execution is still underway.",
  [AnalysisStatusUpdateIneligibilityReason.LOADING]:
    "Refreshing analysis statuses",
  [AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_NOT_FAILED]:
    "You cannot set the analysis status if the scenario execution has not failed",
  [AnalysisStatusUpdateIneligibilityReason.TRANSITION_NOT_POSSIBLE]:
    "Transition not possible",
  [AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_NOT_ASSIGNED]:
    "Marking the Analysis Status as Assigned requires setting an assignee",
  [AnalysisStatusUpdateIneligibilityReason.NO_FAILURE_REASONS_LINKED]:
    "No Failure Reasons are linked to the scenario execution",
  [AnalysisStatusUpdateIneligibilityReason.NO_INCIDENT_LINKED]:
    "No Incidents are linked to the scenario execution or test cases",
  [AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED]:
    "No Regressions are linked to the scenario execution or test cases",
  [AnalysisStatusUpdateIneligibilityReason.NO_IMPACTS_LINKED]:
    "No Impacts are linked to the scenario execution or test cases",
  [AnalysisStatusUpdateIneligibilityReason.REGRESSIONS_LINKED]:
    "Regressions are linked to the scenario execution or test cases",
  [AnalysisStatusUpdateIneligibilityReason.DETECTION_OR_INCIDENT_LINKED]:
    "Cannot set the status to Assigned: a detection or incident is linked to this scenario execution",
  [AnalysisStatusUpdateIneligibilityReason.FAILURE_REASONS_LINKED]:
    "Reasons of failure are linked to the scenario execution or test cases",
};
