export enum TestCaseExecutionAnalysisStatus {
  NA = "NA",
  INCIDENT_SENT = "INCIDENT_SENT",
  PASSED = "PASSED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export const TestCaseExecutionAnalysisStatusDisplayValue: Record<
  TestCaseExecutionAnalysisStatus,
  string
> = {
  [TestCaseExecutionAnalysisStatus.INCIDENT_SENT]: "Incident Sent",
  [TestCaseExecutionAnalysisStatus.PASSED]: "Passed",
  [TestCaseExecutionAnalysisStatus.FAILED]: "Failed",
  [TestCaseExecutionAnalysisStatus.NA]: "NA",
  [TestCaseExecutionAnalysisStatus.CANCELLED]: "Cancelled",
};
