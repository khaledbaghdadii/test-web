import { TestCaseExecutionStatus } from "./status/test-case-execution-status";
import { TestCaseExecution } from "./test-case-execution";

export const projectId = "projectId";
export const testCaseExecutionId1 = "testCaseExecutionId1";
export const testCaseExecutionId2 = "testCaseExecutionId2";
export const testCaseExecutionId3 = "testCaseExecutionId3";
export const testExecutionId = "testExecutionId";
export const testExecutionId1 = "exec-456";
export const testCaseExecution1 = {
  id: testCaseExecutionId1,
  projectId: "proj-123",
  testExecutionId: testExecutionId1,
  externalId: "ext-789",
  testCaseKey: "TC-001",
  functionalTestCaseId: "FTC-101",
  scenarioExecutionId: "SE-202",
  title: "Login Test",
  description: "Test for user login functionality",
  status: TestCaseExecutionStatus.UNDERWAY,
  startDate: "2025-04-08T13:57:47.345Z",
  endDate: "2025-04-08T14:00:00.000Z",
} as TestCaseExecution;

export const testCaseExecution2 = {
  id: testCaseExecutionId2,
  projectId: "proj-124",
  testExecutionId: "exec-457",
  externalId: "ext-790",
  testCaseKey: "TC-002",
  functionalTestCaseId: "FTC-102",
  scenarioExecutionId: "SE-203",
  title: "Signup Test",
  description: "Test for user signup functionality",
  status: TestCaseExecutionStatus.FAILED,
  startDate: "2025-04-08T14:10:00.000Z",
  endDate: "2025-04-08T14:15:00.000Z",
} as TestCaseExecution;

export const testCaseExecution3 = {
  id: testCaseExecutionId3,
  projectId: "proj-125",
  testExecutionId: "exec-458",
  externalId: "ext-791",
  testCaseKey: "TC-003",
  functionalTestCaseId: "FTC-103",
  scenarioExecutionId: "SE-204",
  title: "Logout Test",
  description: "Test for user logout functionality",
  status: TestCaseExecutionStatus.PASSED,
  startDate: "2025-04-08T14:20:00.000Z",
  endDate: "2025-04-08T14:25:00.000Z",
} as TestCaseExecution;
