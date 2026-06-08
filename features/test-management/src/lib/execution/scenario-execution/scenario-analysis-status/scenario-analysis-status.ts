export const ScenarioAnalysisStatus = {
  NA: "NA",
  ASSIGNED: "Assigned",
  UNDER_ANALYSIS: "Under Analysis",
  INCIDENT_SENT: "Incident Sent",
  PASSED: "Passed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const PossibleScenarioAnalysisStatuses = [
  ScenarioAnalysisStatus.NA,
  ScenarioAnalysisStatus.ASSIGNED,
  ScenarioAnalysisStatus.UNDER_ANALYSIS,
  ScenarioAnalysisStatus.INCIDENT_SENT,
  ScenarioAnalysisStatus.PASSED,
  ScenarioAnalysisStatus.FAILED,
  ScenarioAnalysisStatus.CANCELLED,
] as const;

export type ScenarioAnalysisStatus =
  | (typeof PossibleScenarioAnalysisStatuses)[number]
  | undefined;
