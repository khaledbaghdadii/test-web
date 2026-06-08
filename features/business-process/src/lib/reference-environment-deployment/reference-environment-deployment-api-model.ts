export class ReferenceEnvironmentDeploymentApiModel {
  supported: boolean;
  enabledInCurrentlyActiveStage: boolean;
  limitReached: boolean;
  canCleanAndDeploy: boolean;
  referenceEnvironments: string[];
  requestIds?: string[];
}
