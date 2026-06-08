export enum AnalysisObjectType {
  BINARY_REGRESSION = "BINARY_REGRESSION",
  BINARY_IMPACT = "BINARY_IMPACT",
  CONFIGURATION_REGRESSION = "CONFIGURATION_REGRESSION",
  CONFIGURATION_IMPACT = "CONFIGURATION_IMPACT",
  INCIDENT = "INCIDENT",
  FAILURE_REASON = "FAILURE_REASON",
}

export type ProjectSpecificAnalysisObjectType =
  | AnalysisObjectType.BINARY_IMPACT
  | AnalysisObjectType.CONFIGURATION_IMPACT
  | AnalysisObjectType.CONFIGURATION_REGRESSION;

export type GlobalAnalysisObjectType =
  | AnalysisObjectType.BINARY_REGRESSION
  | AnalysisObjectType.INCIDENT;
