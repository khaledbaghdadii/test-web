import { DetectionType } from "@mxflow/features/failure-management";
import { TestCaseExecution } from "./test-case-execution";
import { Detection } from "../../detection/detection";
import { Incident } from "@mxflow/features/incident-management";

export type LinkedDetectionData = Detection & {
  analysisObjectType: DetectionType;
};

export interface TestCaseExecutionSummaryData {
  testCaseExecution: TestCaseExecution;
  hasTestUnitAnalysisObjectLinks: boolean;
  linkedRegressions: LinkedDetectionData[];
  linkedImpacts: LinkedDetectionData[];
  linkedIncidents: Incident[];
}
