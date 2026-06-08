export enum BinaryImpactIntegrationStatus {
  NOT_TO_BE_INTEGRATED = "NOT_TO_BE_INTEGRATED",
  TO_BE_INTEGRATED = "TO_BE_INTEGRATED",
  TRIGGERED = "TRIGGERED",
  COMPLETED = "COMPLETED",
}

export const BinaryImpactIntegrationStatusDisplayValue: Record<
  BinaryImpactIntegrationStatus,
  string
> = {
  [BinaryImpactIntegrationStatus.NOT_TO_BE_INTEGRATED]: "Not to be Integrated",
  [BinaryImpactIntegrationStatus.TO_BE_INTEGRATED]: "To be Integrated",
  [BinaryImpactIntegrationStatus.TRIGGERED]: "Triggered",
  [BinaryImpactIntegrationStatus.COMPLETED]: "Completed",
};
