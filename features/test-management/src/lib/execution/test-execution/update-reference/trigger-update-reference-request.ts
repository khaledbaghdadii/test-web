export interface TriggerUpdateReferenceRequest {
  projectId: string;
  scenarioExecutionId: string;
  testExecutionId: string;
  testCaseExecutionId?: string;
  commitMessage: string;
  binaryImpactIds: string[];
  configurationImpactIds: string[];
  referenceToUpdate: UpdateReferenceFileRequest;
}

export interface UpdateReferenceFileRequest {
  referenceFilePathOnRepo: string;
  updatedReferenceFilePath: string;
}
