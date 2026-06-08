export enum EnvironmentStatus {
  CLEAN_FAILED = "CLEAN_FAILED",
  CLEANED = "CLEANED",
  CLEANING = "CLEANING",
  BROKEN = "BROKEN",
  READY = "READY",
  EXECUTING = "EXECUTING",
  PREPARATION_FAILED = "PREPARATION_FAILED",
  PREPARING = "PREPARING",
  CONFIG_INVALID = "CONFIG_INVALID",
  CONFIG_VALID = "CONFIG_VALID",
  CREATED = "CREATED",
}

export const environmentUnfinishedDeploymentStatuses = [
  EnvironmentStatus.CREATED,
  EnvironmentStatus.CONFIG_VALID,
  EnvironmentStatus.PREPARING,
  EnvironmentStatus.EXECUTING,
];

export const environmentDeploymentFailureStatuses = [
  EnvironmentStatus.PREPARATION_FAILED,
  EnvironmentStatus.BROKEN,
  EnvironmentStatus.CONFIG_INVALID,
];
