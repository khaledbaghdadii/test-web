export enum TestCaseExecutionStatus {
  NOT_STARTED = "NOT_STARTED",
  UNDERWAY = "UNDERWAY",
  PASSED = "PASSED",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
  NA = "NA",
}

export const TestCaseExecutionStatusDisplayValue: Record<
  TestCaseExecutionStatus,
  string
> = {
  [TestCaseExecutionStatus.NOT_STARTED]: "Not Started",
  [TestCaseExecutionStatus.UNDERWAY]: "Underway",
  [TestCaseExecutionStatus.PASSED]: "Passed",
  [TestCaseExecutionStatus.FAILED]: "Failed",
  [TestCaseExecutionStatus.NA]: "NA",
} as unknown as Record<TestCaseExecutionStatus, string>;
