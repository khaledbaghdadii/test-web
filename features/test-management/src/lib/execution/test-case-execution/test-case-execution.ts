import { TestCaseExecutionStatus } from "./status/test-case-execution-status";
import { TestCaseExecutionAnalysisStatus } from "./analysis-status/test-case-execution-analysis-status";

export interface TestCaseExecution {
  id: string;
  projectId: string;
  testExecutionId: string;
  externalId: string;
  testCaseKey: string;
  functionalTestCaseId: string;
  scenarioExecutionId: string;
  title: string;
  description: string;
  status: TestCaseExecutionStatus;
  analysisStatus: TestCaseExecutionAnalysisStatus;
  startDate?: string;
  endDate?: string;
}
