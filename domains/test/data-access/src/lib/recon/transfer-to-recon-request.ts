export interface TransferToReconRequest {
  projectId: string;
  scenarioExecutionId: string;
  testExecutionId: string;
  cycleId: string;
  folderPaths: string[];
}
