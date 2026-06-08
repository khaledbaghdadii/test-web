export enum TestCaseExecutionAnalysisStatusIneligibilityReason {
  NO_INCIDENTS_LINKED = "NO_INCIDENTS_LINKED",
  NO_IMPACTS_LINKED = "NO_IMPACTS_LINKED",
  NO_REGRESSIONS_LINKED = "NO_REGRESSIONS_LINKED",
  NO_FAILURE_REASONS_LINKED = "NO_FAILURE_REASONS_LINKED",
  REGRESSION_LINKED = "REGRESSION_LINKED",
  TRANSITION_NOT_POSSIBLE = "TRANSITION_NOT_POSSIBLE",
  TEST_CASE_EXECUTION_NOT_FAILED = "TEST_CASE_EXECUTION_NOT_FAILED",
  FAILURE_REASONS_LINKED = "FAILURE_REASONS_LINKED",
}

export const TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage: Record<
  TestCaseExecutionAnalysisStatusIneligibilityReason,
  string
> = {
  [TestCaseExecutionAnalysisStatusIneligibilityReason.NO_INCIDENTS_LINKED]:
    "No Incidents Linked",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.NO_IMPACTS_LINKED]:
    "No Impacts Linked",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.NO_REGRESSIONS_LINKED]:
    "No Regressions Linked",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.NO_FAILURE_REASONS_LINKED]:
    "No Failure Reasons Linked",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.REGRESSION_LINKED]:
    "Regression Linked",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.TRANSITION_NOT_POSSIBLE]:
    "Transition Not Possible",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.TEST_CASE_EXECUTION_NOT_FAILED]:
    "Test Case Execution Not Failed",
  [TestCaseExecutionAnalysisStatusIneligibilityReason.FAILURE_REASONS_LINKED]:
    "Reason of failure Linked",
};
