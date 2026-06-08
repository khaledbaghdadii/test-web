import { TestCaseExecutionAnalysisStatus } from "./analysis-status/test-case-execution-analysis-status";

export interface UpdateTestCaseExecutionAnalysisStatusRequest {
  analysisStatus: TestCaseExecutionAnalysisStatus;
  testCaseExecutionId: string;
  projectId: string;
}
