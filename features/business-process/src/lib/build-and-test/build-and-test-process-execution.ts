import { BuildAndTestProcessCreateBranchStage } from "./stage/build-and-test-process-create-branch-stage";
import { BuildAndTestProcessPrepareBuildStage } from "./stage/build-and-test-process-prepare-build-stage";
import { BuildAndTestProcessBuildAndTestStage } from "./stage/build-and-test-process-build-and-test-stage";
import { BuildAndTestProcessIntegrateChangesStage } from "./stage/build-and-test-process-integrate-changes-stage";
import { BuildAndTestProcessExecutionInput } from "./stage/build-and-test-process-execution-input";
import { BusinessProcessExecutionStatus } from "../business-process-execution-status/business-process-execution-status";

export interface BuildAndTestProcessExecution {
  id: string;
  name: string;
  projectId: string;
  definitionId: string;
  owner: string;
  notificationsRecipients?: string[];
  errorMessage?: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  supportsResourceManagement: boolean;
  hasPredefinedMergeRequestInputs: boolean;
  ciVersion: number;
  source: BuildAndTestSource;
  status: BusinessProcessExecutionStatus;
  input: BuildAndTestProcessExecutionInput;
  createBranchStage: BuildAndTestProcessCreateBranchStage;
  prepareBuildStage: BuildAndTestProcessPrepareBuildStage;
  buildAndTestStage: BuildAndTestProcessBuildAndTestStage;
  integrateChangesStage: BuildAndTestProcessIntegrateChangesStage;
}

export interface BuildAndTestSource {
  id: string;
  type: BuildAndTestSourceType;
}

export enum BuildAndTestSourceType {
  BUSINESS_PROCESS = "BUSINESS_PROCESS",
  USER = "USER",
}
