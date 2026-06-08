import {
  TriggerUpdateReferenceRequest,
  UpdateReferenceFileRequest,
} from "./trigger-update-reference-request";
import { TriggerUpdateReferenceResponse } from "./trigger-update-reference-response";

export const projectId = "projectId";
export const scenarioExecutionId = "scenarioExecutionId";
export const testExecutionId = "testExecutionId";
export const testCaseExecutionId = "testCaseExecutionId";
export const commitMessage = "commitMessage";
export const binaryImpactId = "binaryImpactId";
export const binaryImpactIds = [binaryImpactId];
export const configurationImpactId = "configurationImpactId";
export const configurationImpactIds = [configurationImpactId];
export const referenceFilePathOnRepo = "referenceFilePathOnRepo";
export const updatedReferenceFilePath = "updatedReferenceFilePath";
export const updateReferenceId = "updateReferenceId";

export const referenceToUpdate: UpdateReferenceFileRequest = {
  referenceFilePathOnRepo: referenceFilePathOnRepo,
  updatedReferenceFilePath: updatedReferenceFilePath,
};

export const triggerUpdateReferenceRequest: TriggerUpdateReferenceRequest = {
  projectId: projectId,
  scenarioExecutionId: scenarioExecutionId,
  testExecutionId: testExecutionId,
  testCaseExecutionId: testCaseExecutionId,
  commitMessage: commitMessage,
  binaryImpactIds: binaryImpactIds,
  configurationImpactIds: configurationImpactIds,
  referenceToUpdate: referenceToUpdate,
};

export const triggerUpdateReferenceRequestNoTestCaseExecutionId: TriggerUpdateReferenceRequest =
  {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testExecutionId: testExecutionId,
    testCaseExecutionId: undefined,
    commitMessage: commitMessage,
    binaryImpactIds: binaryImpactIds,
    configurationImpactIds: configurationImpactIds,
    referenceToUpdate: referenceToUpdate,
  };

export const triggerUpdateReferenceResponse: TriggerUpdateReferenceResponse = {
  updateReferenceId: updateReferenceId,
};
