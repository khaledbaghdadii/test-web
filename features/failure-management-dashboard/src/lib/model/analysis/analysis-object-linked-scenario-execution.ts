import {
  ScenarioExecutionBusinessProcess,
  ScenarioExecutionProject,
  TestCaseExecution,
} from "@mxflow/test-management";

export interface AnalysisObjectLinkedScenarioExecutionDetails {
  scenarioExecutionId: string;
  testCaseExecutions: TestCaseExecution[];
  scenarioDefinitionName: string;
  project: ScenarioExecutionProject;
  businessProcesses: ScenarioExecutionBusinessProcess[];
}
