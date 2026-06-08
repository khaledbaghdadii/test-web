import { TestCaseExecutionAnalysisStatusIneligibilityReason } from "./test-case-execution-analysis-status-ineligibility-reason";
import { TestCaseExecutionAnalysisStatus } from "../analysis-status/test-case-execution-analysis-status";

export interface TestCaseExecutionsAnalysisStatusEligibility {
  nextAnalysisStatusTransitionEligibilities: TestCaseExecutionAnalysisStatusTransitionEligibility[];
  eligibleToUpdateTestCaseAnalysisStatus: boolean;
}

export interface TestCaseExecutionAnalysisStatusTransitionEligibility {
  analysisStatus: TestCaseExecutionAnalysisStatus;
  ineligibilityReason: TestCaseExecutionAnalysisStatusIneligibilityReason;
  eligible: boolean;
}
