export class ReferenceEnvironmentDeployment {
  projectId: string;
  processId: string;
  supported: boolean;
  enabledInCurrentlyActiveStage: boolean;
  limitReached: boolean;
  canCleanAndDeploy: boolean;
  referenceEnvironments: string[];
  requestIds?: string[];
}
